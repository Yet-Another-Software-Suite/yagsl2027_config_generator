"use client"

import { useEffect, useId, useRef, useState } from "react"
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { GAIN_KEYS, swerveTopics, useLive, useModuleNames, useNtValue, type GainKey } from "@/components/live/live-context"
import { LiveAutoGains } from "@/components/live/live-auto"

export type TuneMode = "azimuth" | "drive"

const SETPOINTS: Record<TuneMode, { presets: number[]; unit: string; step: number; min: number; max: number; auto: [number, number] }> = {
  azimuth: { presets: [0, 15, 45, 90], unit: "°", step: 5, min: -180, max: 180, auto: [0, 15] },
  drive: { presets: [0, 0.1, 0.5, 1, 2], unit: "m/s", step: 0.1, min: -5, max: 5, auto: [0, 1] },
}

/** A number box that shows the robot's value until you type, and sends yours on Enter or when you leave it. */
export function NumberField({
  value,
  onCommit,
  step,
  className,
  id,
  ariaLabel,
  disabled,
  dataLive,
}: {
  value: number | undefined
  onCommit: (value: number) => void
  step: number
  className?: string
  id?: string
  ariaLabel?: string
  disabled?: boolean
  dataLive?: string
}) {
  const [text, setText] = useState("")
  const [editing, setEditing] = useState(false)
  useEffect(() => {
    if (!editing) setText(value === undefined ? "" : String(Number(value.toPrecision(6))))
  }, [value, editing])
  const commit = () => {
    setEditing(false)
    const n = Number.parseFloat(text)
    if (Number.isFinite(n) && n !== value) onCommit(n)
  }
  return (
    <Input
      id={id}
      data-live={dataLive}
      aria-label={ariaLabel}
      type="number"
      step={step}
      inputMode="decimal"
      disabled={disabled}
      className={cn("h-8", className)}
      value={text}
      onFocus={() => setEditing(true)}
      onChange={(e) => {
        setEditing(true)
        setText(e.target.value)
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur()
        if (e.key === "Escape") {
          setEditing(false)
          ;(e.target as HTMLInputElement).blur()
        }
      }}
    />
  )
}

/** Setpoint presets, a typed setpoint, and switching between two setpoints on a timer. */
export function LiveSetpoint({ mode }: { mode: TuneMode }) {
  const live = useLive()
  const t = swerveTopics(live.driveName)
  const topic = mode === "azimuth" ? t.azimuth.angle : t.drive.velocity
  const value = useNtValue<number>(topic)
  const tuningOn = useNtValue<boolean>(t[mode].enabled)
  const voltageOn = useNtValue<boolean>(t[mode].voltageEnabled)
  // The setpoint is ignored while Auto drives the motors at a voltage.
  const on = tuningOn === true && voltageOn !== true
  const spec = SETPOINTS[mode]
  const [auto, setAuto] = useState(false)
  const autoId = useId()
  const [autoA, autoB] = spec.auto

  useEffect(() => {
    if (!auto || !on) return
    let high = false
    const id = setInterval(() => {
      high = !high
      live.nt.set(topic, high ? autoB : autoA)
    }, 2000)
    return () => clearInterval(id)
  }, [auto, on, live.nt, topic, autoA, autoB])

  useEffect(() => {
    if (!on) setAuto(false)
  }, [on])

  const set = (n: number) => live.nt.set(topic, Math.max(spec.min, Math.min(spec.max, n)))

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium">{mode === "azimuth" ? "Angle" : "Velocity"}</span>
        {spec.presets.map((p) => (
          <Button
            key={p}
            size="sm"
            variant={value === p ? "default" : "outline"}
            className={cn("h-7 px-2", value !== p && "bg-transparent")}
            disabled={!on}
            onClick={() => {
              setAuto(false)
              set(p)
            }}
          >
            {p}
            {mode === "azimuth" ? "°" : ""}
          </Button>
        ))}
        <NumberField
          value={value}
          step={spec.step}
          className="w-24"
          ariaLabel={mode === "azimuth" ? "Angle in degrees" : "Velocity in meters per second"}
          disabled={!on}
          onCommit={(n) => {
            setAuto(false)
            set(n)
          }}
        />
        <span className="text-xs text-muted-foreground">{spec.unit}</span>
      </div>
      <div className="flex items-center gap-2">
        <Switch id={autoId} checked={auto} disabled={!on} onCheckedChange={setAuto} />
        <Label htmlFor={autoId} className="text-xs">
          Switch between {autoA} and {autoB}
          {spec.unit === "°" ? "°" : ` ${spec.unit}`} every 2 seconds
        </Label>
      </div>
    </div>
  )
}

/** Where the closed loop runs, from the first module's telemetry: it sets the period gains are worked out for. */
function ClosedLoopPeriod({ mode }: { mode: TuneMode }) {
  const live = useLive()
  const modules = useModuleNames()
  const t = swerveTopics(live.driveName)
  const period = useNtValue<number>(modules.length ? t[mode].period(modules[0]) : "")
  if (period === undefined || !(period > 0)) return null
  const where = period <= 0.0015 ? "on the motor controller" : "on the SystemCore"
  return (
    <p className="text-xs text-muted-foreground">
      The {mode} closed loop runs {where}, every {Number((period * 1000).toPrecision(3))} ms.
    </p>
  )
}

const GAIN_LABELS: Record<GainKey, string> = {
  p: "feedback/p",
  i: "feedback/i",
  d: "feedback/d",
  s: "feedforward/s",
  v: "feedforward/v",
  a: "feedforward/a",
}

/** The six gains of one motor, read from the robot and sent back as you type. */
export function LiveGains({ mode }: { mode: TuneMode }) {
  const live = useLive()
  const t = swerveTopics(live.driveName)
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 short:grid-cols-2!">
      {GAIN_KEYS.map((key) => (
        <GainField key={key} topic={t[mode].gain(key)} label={GAIN_LABELS[key]} name={`${mode}-${key}`} />
      ))}
    </div>
  )
}

function GainField({ topic, label, name }: { topic: string; label: string; name: string }) {
  const live = useLive()
  const id = useId()
  const value = useNtValue<number>(topic)
  const initial = useRef<number | undefined>(undefined)
  if (initial.current === undefined && value !== undefined) initial.current = value
  const changed = initial.current !== undefined && value !== undefined && value !== initial.current
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="font-mono text-xs">
        {label}
      </Label>
      <NumberField id={id} dataLive={name} value={value} step={0.01} onCommit={(n) => live.nt.set(topic, n)} />
      <p className="h-4 text-[11px] text-muted-foreground">
        {changed ? `was ${Number(initial.current!.toPrecision(6))}` : ""}
      </p>
    </div>
  )
}

const WINDOW_SECONDS = 10
const SAMPLE_MS = 50

// Categorical slots 1 to 4 of the reference chart palette, one per module; the setpoint is a neutral dashed line.
const SERIES_VARS = ["var(--live-series-1)", "var(--live-series-2)", "var(--live-series-3)", "var(--live-series-4)"]

function wrapDegrees(deg: number) {
  const w = ((((deg + 180) % 360) + 360) % 360) - 180
  return w === -180 ? 180 : w
}

type Sample = { t: number } & Record<string, number | null>

/** A rolling graph of the setpoint against what every module does. */
export function LiveTrace({ mode }: { mode: TuneMode }) {
  const live = useLive()
  const modules = useModuleNames()
  const moduleKey = modules.join("|")
  const [data, setData] = useState<Sample[]>([])

  useEffect(() => {
    const t = swerveTopics(live.driveName)
    const names = moduleKey ? moduleKey.split("|") : []
    const buffer: Sample[] = []
    setData([])
    const start = performance.now()
    let tick = 0
    const id = setInterval(() => {
      const now = (performance.now() - start) / 1000
      const sp = live.nt.get<number>(mode === "azimuth" ? t.azimuth.angle : t.drive.velocity)
      const sample: Sample = { t: now, setpoint: sp === undefined ? null : mode === "azimuth" ? wrapDegrees(sp) : sp }
      for (const m of names) {
        const v = live.nt.get<number>(mode === "azimuth" ? t.azimuth.measured(m) : t.drive.measured(m))
        sample[m] = v === undefined ? null : mode === "azimuth" ? wrapDegrees(v * 360) : v
      }
      buffer.push(sample)
      while (buffer.length && buffer[0].t < now - WINDOW_SECONDS) buffer.shift()
      // Sample twenty times a second, redraw ten.
      if (++tick % 2 === 0) setData(buffer.map((s) => ({ ...s, t: s.t - now })))
    }, SAMPLE_MS)
    return () => clearInterval(id)
  }, [live.nt, live.driveName, mode, moduleKey])

  const unit = mode === "azimuth" ? "°" : " m/s"
  const fmt = (v: unknown) => (typeof v === "number" ? `${v.toFixed(mode === "azimuth" ? 1 : 2)}${unit}` : "")

  return (
    <figure className="live-chart space-y-1">
      <figcaption className="text-xs font-medium text-foreground">
        {mode === "azimuth" ? "Module angle against the setpoint" : "Wheel speed against the setpoint"}, last{" "}
        {WINDOW_SECONDS} seconds
      </figcaption>
      <div className="h-56 w-full rounded-sm border border-border bg-background short:h-36">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              domain={[-WINDOW_SECONDS, 0]}
              ticks={[-10, -8, -6, -4, -2, 0]}
              tickFormatter={(v) => `${v}s`}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              stroke="var(--border)"
            />
            <YAxis
              width={52}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickFormatter={(v) => `${Number(v.toFixed(2))}${mode === "azimuth" ? "°" : ""}`}
              stroke="var(--border)"
              domain={["auto", "auto"]}
            />
            <Tooltip
              isAnimationActive={false}
              formatter={(v, name) => [fmt(v), name]}
              labelFormatter={(l) => (typeof l === "number" ? `${l.toFixed(1)} s` : "")}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                fontSize: 12,
                color: "var(--popover-foreground)",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {modules.map((m, i) => (
              <Line
                key={m}
                dataKey={m}
                name={m}
                dot={false}
                stroke={SERIES_VARS[i % SERIES_VARS.length]}
                strokeWidth={2}
                isAnimationActive={false}
                connectNulls
              />
            ))}
            <Line
              dataKey="setpoint"
              name="setpoint"
              dot={false}
              stroke="var(--foreground)"
              strokeWidth={2}
              strokeDasharray="5 4"
              isAnimationActive={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <LatestReadings sample={data[data.length - 1]} modules={modules} format={fmt} />
    </figure>
  )
}

/** The latest value of every line, as text, so no reading depends on telling the colors apart. */
function LatestReadings({
  sample,
  modules,
  format,
}: {
  sample: Sample | undefined
  modules: string[]
  format: (v: unknown) => string
}) {
  if (!sample) return null
  return (
    <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
      {["setpoint", ...modules].map((name, i) => (
        <div key={name} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-0.5 w-3"
            style={{
              background: i === 0 ? "var(--foreground)" : SERIES_VARS[(i - 1) % SERIES_VARS.length],
            }}
          />
          <dt className="text-muted-foreground">{name}</dt>
          <dd className="font-mono tabular-nums text-foreground">{format(sample[name]) || "-"}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Everything for tuning one motor: the setpoint, the graph and the gains. */
export function LiveTunerControls({ mode }: { mode: TuneMode }) {
  return (
    // On a phone on its side, the gains sit beside the graph so both fit on the screen.
    <div className="space-y-3 short:grid short:grid-cols-[3fr_2fr] short:gap-4 short:space-y-0">
      <div className="min-w-0 space-y-3">
        <LiveSetpoint mode={mode} />
        <LiveTrace mode={mode} />
      </div>
      <div className="min-w-0 space-y-3">
        <LiveAutoGains mode={mode} />
        <LiveGains mode={mode} />
        <ClosedLoopPeriod mode={mode} />
        <p className="text-xs text-muted-foreground">
          Type a gain and press Enter: the robot uses it on its next loop. Nothing is saved until you download the
          gains.
        </p>
      </div>
    </div>
  )
}
