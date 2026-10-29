"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { CircleAlert, CircleCheck, Download, Loader2, OctagonX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { SCHEMA_BASE_URL } from "@/lib/zip-utils"
import {
  GAIN_KEYS,
  swerveTopics,
  useLive,
  useNtValue,
  useNtVersion,
  type GainKey,
} from "@/components/live/live-context"
import { LiveBox, NotConnected, Path, useConnected } from "@/components/live/live-connection"
import { ON_FLOOR_CHECKLIST, SafetyDialog } from "@/components/live/live-safety"
import { LiveSetpoint } from "@/components/live/live-tuner"

/** Calls `onDone` once, the first time `done` becomes true. */
function useOnce(done: boolean, onDone?: () => void) {
  const reported = useRef(false)
  useEffect(() => {
    if (done && !reported.current) {
      reported.current = true
      onDone?.()
    }
  }, [done, onDone])
}

/** Confirms the telemetry the live steps need is published. */
export function LiveTelemetryCheck({ onFound }: { onFound?: () => void }) {
  const live = useLive()
  const connected = useConnected()
  const t = swerveTopics(live.driveName)
  const command = useNtValue<boolean>(t.command)
  const gain = useNtValue<number>(t.azimuth.gain("p"))
  const found = command !== undefined && gain !== undefined
  const [waited, setWaited] = useState(false)
  useOnce(found, onFound)

  useEffect(() => {
    setWaited(false)
    if (!connected) return
    const id = setTimeout(() => setWaited(true), 3000)
    return () => clearTimeout(id)
  }, [connected, live.driveName])

  if (!live.enabled) return null
  if (!connected) return <NotConnected />
  return (
    <LiveBox>
      {found ? (
        <p className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
          <CircleCheck className="h-4 w-4 shrink-0" />
          <span>
            Found the tuning command and the module gains under <Path>{`/Tuning/${live.driveName}`}</Path>.
          </span>
        </p>
      ) : waited ? (
        <p className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Nothing is published at <Path>{`/Tuning/${live.driveName}/Live Tuning`}</Path>. Check that the swerve drive
            picked above uses TelemetryVerbosity.HIGH, and that both a translation and a rotation controller are set.
          </span>
        </p>
      ) : (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 motion-safe:animate-spin motion-reduce:animate-pulse" />
          Looking for the tuning command...
        </p>
      )}
    </LiveBox>
  )
}

/** Spin in place over NetworkTables. On a real robot it has to come off the blocks first. */
export function LiveInPlace({ real }: { real: boolean }) {
  const live = useLive()
  const connected = useConnected()
  const t = swerveTopics(live.driveName)
  const driveOn = useNtValue<boolean>(t.drive.enabled)
  const inplace = useNtValue<boolean>(t.drive.inplace)
  const switchId = useId()
  const [dialog, setDialog] = useState(false)
  if (!live.enabled) return null
  if (!connected) return <NotConnected />
  const turnOn = () => {
    live.nt.set(t.drive.velocity, 0)
    live.nt.set(t.drive.inplace, true)
  }
  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      <div className="flex items-center gap-3">
        <Switch
          id={switchId}
          data-live="inplace"
          checked={inplace === true}
          disabled={!driveOn}
          onCheckedChange={(v) => {
            if (!v) {
              live.nt.set(t.drive.velocity, 0)
              live.nt.set(t.drive.inplace, false)
            } else if (real) setDialog(true)
            else turnOn()
          }}
        />
        <Label htmlFor={switchId} className="text-sm">
          Spin in place {inplace ? "on" : "off"}
        </Label>
      </div>
      {!driveOn && <p className="text-xs text-muted-foreground">Turn drive tuning on first.</p>}
      {inplace && (
        <>
          <p className="text-xs text-muted-foreground">
            The velocity was set to 0 m/s. Raise it slowly: a positive velocity spins the robot counterclockwise.
          </p>
          <LiveSetpoint mode="drive" />
        </>
      )}
      <SafetyDialog
        open={dialog}
        onOpenChange={setDialog}
        title="The robot is about to drive"
        intro="With spin in place on, the robot spins on the floor as soon as the velocity is above 0. Check each of these:"
        items={ON_FLOOR_CHECKLIST}
        confirmLabel="Turn spin in place on"
        onConfirm={turnOn}
      />
    </div>
  )
}

/** Stops tuning and downloads the gains the robot is using as pidfproperties.json. */
export function LiveFinish({ real, onSaved }: { real: boolean; onSaved?: () => void }) {
  const live = useLive()
  const connected = useConnected()
  const t = swerveTopics(live.driveName)
  const running = useNtValue<boolean>(t.command)
  const values = {
    drive: GAIN_KEYS.map((k) => live.nt.get<number>(t.drive.gain(k))),
    angle: GAIN_KEYS.map((k) => live.nt.get<number>(t.azimuth.gain(k))),
  }
  // Re-render whenever the robot's values change.
  useNtVersion()
  const key = JSON.stringify(values)
  const complete = [...values.drive, ...values.angle].every((v) => v !== undefined)
  const filename = real ? "pidfproperties.json" : "pidfproperties_sim.json"
  const json = useMemo(() => {
    const parsed = JSON.parse(key) as { drive: (number | null)[]; angle: (number | null)[] }
    const obj = (list: (number | null)[]) =>
      Object.fromEntries(GAIN_KEYS.map((k: GainKey, i) => [k, Number((list[i] ?? 0).toPrecision(6))]))
    return JSON.stringify(
      { $schema: `${SCHEMA_BASE_URL}/pidfproperties.json`, drive: obj(parsed.drive), angle: obj(parsed.angle) },
      null,
      2,
    )
  }, [key])

  if (!live.enabled) return null
  if (!connected) return <NotConnected />

  const download = () => {
    const url = URL.createObjectURL(new Blob([json + "\n"], { type: "application/json" }))
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    onSaved?.()
  }

  return (
    <LiveBox>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" className="bg-transparent" disabled={!running} onClick={live.stopAll}>
          <OctagonX className="h-4 w-4" />
          Stop tuning
        </Button>
        <Button size="sm" disabled={!complete} onClick={download}>
          <Download className="h-4 w-4" />
          Download {filename}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        It holds the gains {real ? "the robot" : "the simulator"} is using right now. Replace{" "}
        <Path>{`src/main/deploy/swerve/modules/${filename}`}</Path> with it,{" "}
        {real ? "then redeploy." : "then restart the simulator."}
      </p>
      <pre className="max-h-64 overflow-auto rounded-sm bg-muted p-2.5 text-xs leading-relaxed">
        <code className="font-mono">{json}</code>
      </pre>
    </LiveBox>
  )
}

/** A bar along the bottom of the screen, with a stop button, whenever something can move. */
export function LiveStopBar() {
  const live = useLive()
  const connected = useConnected()
  const t = swerveTopics(live.driveName)
  const running = useNtValue<boolean>(t.command)
  const azimuth = useNtValue<boolean>(t.azimuth.enabled)
  const drive = useNtValue<boolean>(t.drive.enabled)
  if (!connected || !(running || azimuth || drive)) return null
  const what = drive ? "Drive tuning is on" : azimuth ? "Azimuth tuning is on" : "The tuning command is running"
  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-50 border-t border-transparent bg-card/95 px-4 py-2 shadow-lg backdrop-blur">
      <div className="container mx-auto flex items-center justify-between gap-3">
        <span className="text-sm">
          <span className="font-medium">{what}</span>
          <span className="text-muted-foreground"> on {live.host === "localhost" ? "the simulator" : live.host}.</span>
        </span>
        <Button size="sm" variant="destructive" onClick={live.stopAll}>
          <OctagonX className="h-4 w-4" />
          Stop
        </Button>
      </div>
    </div>
  )
}
