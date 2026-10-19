"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { swerveTopics, useLive, useModuleNames, useNtValue, useRobotState } from "@/components/live/live-context"
import type { TuneMode } from "@/components/live/live-tuner"
import { fitFeedforward, positionGains, velocityGain, type Feedforward, type Sample } from "@/lib/sysid"

/** The tests, as SysId runs them: a slow ramp and a step, each way. */
const TESTS: Record<
  TuneMode,
  { rampVoltsPerSecond: number; rampMax: number; step: number; stepSeconds: number; maxSpeed: number }
> = {
  // Rotations per second of the wheel: about 3 m/s on a 4 inch wheel.
  drive: { rampVoltsPerSecond: 1, rampMax: 6, step: 4, stepSeconds: 1.5, maxSpeed: 9.5 },
  azimuth: { rampVoltsPerSecond: 0.5, rampMax: 3, step: 2, stepSeconds: 1, maxSpeed: 8 },
}

/** The errors worth the maximum effort, for the LQR: a velocity loop's, and a position loop's. */
const DRIVE_VELOCITY_TOLERANCE = 1 // rotations per second, as SysId's default of 1
const AZIMUTH_POSITION_TOLERANCE = 0.02 // rotations, about 7 degrees
const AZIMUTH_VELOCITY_TOLERANCE = 1 // rotations per second

/** Assumed when the motor controllers don't publish closedloop/period: most run their closed loop on the device. */
const DEFAULT_PERIOD = 0.001

interface Result {
  ff: Feedforward
  gains: Record<"p" | "i" | "d" | "s" | "v" | "a", number>
  period: number
  periodAssumed: boolean
  /** How far behind the measured velocity is, in seconds. */
  delay: number
  /** Whether the robot published the delay, rather than it being typed. */
  delayPublished: boolean
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Work out the gains for the drive or azimuth motors, like SysId: drive them at a slowly rising voltage and at a
 * voltage step, each way, fit the feedforward to how they moved, and get the feedback from an LQR. The gains are
 * then sent to the robot, which uses them at once.
 */
export function LiveAutoGains({ mode }: { mode: TuneMode }) {
  const live = useLive()
  const t = swerveTopics(live.driveName)
  const modules = useModuleNames()
  const tuningOn = useNtValue<boolean>(t[mode].enabled)
  const running = useNtValue<boolean>(t.command)
  const voltageTopic = useNtValue<boolean>(t[mode].voltageEnabled)
  const state = useRobotState()
  const [wheelInches, setWheelInches] = useState("4")
  // How long the velocity takes to reach the closed loop: a robot loop in simulation, plus any filtering by the
  // motor controller on a robot.
  const [delayMs, setDelayMs] = useState("20")
  // YAMS publishes the delay from the motor controller's velocity filtering, or the simulation period.
  const publishedDelay = useNtValue<number>(modules.length ? t[mode].measurementDelay(modules[0]) : "")
  const [status, setStatus] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const cancel = useRef(false)

  // Leaving the page or turning the mode off stops the test.
  useEffect(() => () => void (cancel.current = true), [])
  useEffect(() => {
    if (tuningOn === false || running === false) cancel.current = true
  }, [tuningOn, running])

  const mechanismVelocity = (m: string) => `/Mechanisms/${live.driveName}/modules/${m}/${mode}/mechanism/velocity`
  const linearVelocity = (m: string) => `/Mechanisms/${live.driveName}/modules/${m}/drive/measurement/velocity`
  // The drive only publishes its speed in meters per second unless its mechanism velocity is logged.
  const needsWheel = mode === "drive" && modules.length > 0 && !live.nt.has(mechanismVelocity(modules[0]))

  // The robot's YAMS needs the voltage tuning topics.
  if (voltageTopic === undefined) return null
  const ready = tuningOn === true && running === true && state?.enabled === true && modules.length > 0

  const run = async () => {
    setBusy(true)
    setError(null)
    setResult(null)
    cancel.current = false
    const spec = TESTS[mode]
    const circumference = (Number.parseFloat(wheelInches) * 0.0254 * Math.PI) || 0
    if (needsWheel && !(circumference > 0)) {
      setError("Type the wheel diameter first.")
      setBusy(false)
      return
    }
    // Velocity topic of each module, and how to turn its value into rotations per second.
    const sources = new Map<string, { module: string; scale: number }>()
    for (const m of modules) {
      if (needsWheel) sources.set(linearVelocity(m), { module: m, scale: 1 / circumference })
      else sources.set(mechanismVelocity(m), { module: m, scale: 1 })
    }

    // The voltage sent, by browser time, so each sample gets the voltage the robot had applied.
    const sent: { at: number; volts: number }[] = []
    const voltageAt = (at: number) => {
      // The robot applies a voltage on its next loop: take the one sent a loop before.
      const target = at - 20
      let v = 0
      for (const s of sent) {
        if (s.at > target) break
        v = s.volts
      }
      return v
    }
    const send = (volts: number) => {
      sent.push({ at: performance.now(), volts })
      live.nt.set(t[mode].voltage, volts)
    }
    const latest = new Map<string, number>()
    let recording: Map<string, Sample[]> | null = null
    const tests: Sample[][] = []
    const stopListening = live.nt.onSample((topic, timestampUs, value) => {
      const source = sources.get(topic)
      if (!source || typeof value !== "number") return
      const velocity = value * source.scale
      latest.set(source.module, velocity)
      recording?.get(source.module)?.push({ t: timestampUs / 1e6, voltage: voltageAt(performance.now()), velocity })
    })
    const fastest = () => Math.max(0, ...Array.from(latest.values()).map(Math.abs))
    const check = () => {
      if (cancel.current) throw new Error("Stopped.")
    }
    const rest = async () => {
      send(0)
      const until = performance.now() + 3000
      await sleep(500)
      while (performance.now() < until && fastest() > 0.05) {
        check()
        await sleep(50)
      }
    }
    const test = async (label: string, voltsAt: (seconds: number) => number, seconds: number) => {
      setStatus(label)
      recording = new Map(modules.map((m) => [m, []]))
      const start = performance.now()
      for (;;) {
        check()
        const elapsed = (performance.now() - start) / 1000
        if (elapsed >= seconds || fastest() > spec.maxSpeed) break
        send(voltsAt(elapsed))
        await sleep(20)
      }
      for (const samples of recording.values()) tests.push(samples)
      recording = null
      await rest()
    }

    try {
      // Voltage on, starting from 0 V.
      live.nt.set(t[mode].voltage, 0)
      live.nt.set(t[mode].voltageEnabled, true)
      await sleep(300)
      const rampSeconds = spec.rampMax / spec.rampVoltsPerSecond
      await test("Slowly forward", (s) => s * spec.rampVoltsPerSecond, rampSeconds)
      await test("Slowly backward", (s) => -s * spec.rampVoltsPerSecond, rampSeconds)
      await test("Quickly forward", () => spec.step, spec.stepSeconds)
      await test("Quickly backward", () => -spec.step, spec.stepSeconds)
      setStatus("Working out the gains")
      const ff = fitFeedforward(tests)
      if (!ff || !(ff.kv > 0)) throw new Error("The motors didn't move enough to work out the gains.")
      const publishedPeriod = live.nt.get<number>(t[mode].period(modules[0]))
      const period = publishedPeriod && publishedPeriod > 0 ? publishedPeriod : DEFAULT_PERIOD
      const ka = Math.max(0, ff.ka)
      const delay =
        publishedDelay !== undefined && publishedDelay >= 0
          ? publishedDelay
          : Math.max(0, Number.parseFloat(delayMs) || 0) / 1000
      const fit = { ...ff, ka }
      const gains =
        mode === "drive"
          ? { p: velocityGain(fit, period, DRIVE_VELOCITY_TOLERANCE, delay), i: 0, d: 0 }
          : (() => {
              const { kp, kd } = positionGains(fit, period, AZIMUTH_POSITION_TOLERANCE, AZIMUTH_VELOCITY_TOLERANCE, delay)
              return { p: kp, i: 0, d: kd }
            })()
      // A long delay can call for negative feedback, which would push the wrong way: use none instead.
      const all = { p: Math.max(0, gains.p), i: 0, d: Math.max(0, gains.d), s: Math.max(0, ff.ks), v: ff.kv, a: ka }
      for (const [key, value] of Object.entries(all)) {
        live.nt.set(t[mode].gain(key as keyof typeof all), Number(value.toPrecision(6)))
      }
      setResult({
        ff,
        gains: all,
        period,
        periodAssumed: !(publishedPeriod && publishedPeriod > 0),
        delay,
        delayPublished: publishedDelay !== undefined,
      })
      setStatus(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setStatus(null)
    } finally {
      stopListening()
      live.nt.set(t[mode].voltage, 0)
      live.nt.set(t[mode].voltageEnabled, false)
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {busy ? (
          <Button size="sm" variant="outline" className="h-7 bg-transparent" onClick={() => (cancel.current = true)}>
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            {status ?? "Running"}: stop
          </Button>
        ) : (
          <Button size="sm" className="h-7" disabled={!ready} onClick={run} data-live={`${mode}-auto`}>
            <Wand2 className="mr-2 h-3.5 w-3.5" />
            Auto
          </Button>
        )}
        {publishedDelay === undefined && (
          <div className="flex items-center gap-1">
            <Label htmlFor={`${mode}-delay`} className="text-xs">
              Measurement delay
            </Label>
            <Input
              id={`${mode}-delay`}
              className="h-7 w-16"
              type="number"
              step={1}
              value={delayMs}
              disabled={busy}
              onChange={(e) => setDelayMs(e.target.value)}
            />
            <span className="text-xs text-muted-foreground">ms</span>
          </div>
        )}
        {needsWheel && (
          <div className="flex items-center gap-1">
            <Label htmlFor={`${mode}-wheel`} className="text-xs">
              Wheel diameter
            </Label>
            <Input
              id={`${mode}-wheel`}
              className="h-7 w-16"
              type="number"
              step={0.1}
              value={wheelInches}
              disabled={busy}
              onChange={(e) => setWheelInches(e.target.value)}
            />
            <span className="text-xs text-muted-foreground">in</span>
          </div>
        )}
        <span className="text-xs text-muted-foreground">
          {mode === "drive"
            ? "Drives every wheel slowly, then quickly, each way, and works out all six gains."
            : "Turns every wheel slowly, then quickly, each way, and works out all six gains."}
        </span>
      </div>
      {!ready && !busy && <p className="text-xs text-muted-foreground">Turn {mode} tuning on to use Auto.</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {result && (
        <p className="text-xs text-muted-foreground" data-live={`${mode}-auto-result`}>
          Set from {result.ff.samples} samples (the fit explains {(result.ff.r2 * 100).toFixed(1)}% of the voltage), with
          the feedback worked out for a closed loop every {Number((result.period * 1000).toPrecision(3))} ms
          {result.periodAssumed ? ", assumed since the robot doesn't publish it" : ""}, with the velocity measured{" "}
          {Number((result.delay * 1000).toPrecision(3))} ms late{result.delayPublished ? ", as the robot publishes it" : ""}. Check them against the graph, and adjust from there.
        </p>
      )}
    </div>
  )
}
