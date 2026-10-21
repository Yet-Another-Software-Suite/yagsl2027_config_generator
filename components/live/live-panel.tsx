"use client"

import { useState, type ReactNode } from "react"
import { ArrowDown, Pause, Play, Plug, Radio } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { targetHost } from "@/lib/live-nt"
import { swerveTopics, useLive, useNtValue, useRobotState } from "@/components/live/live-context"
import { LiveBox, NotConnected, RobotStatus, useConnected } from "@/components/live/live-connection"
import { ON_BLOCKS_CHECKLIST, SafetyDialog } from "@/components/live/live-safety"
import { LiveTunerControls, type TuneMode } from "@/components/live/live-tuner"
import { LiveInPlace } from "@/components/live/live-steps"

const MODES: { mode: TuneMode; label: string }[] = [
  { mode: "azimuth", label: "Azimuth" },
  { mode: "drive", label: "Drive" },
]

const HOW_TO: Record<TuneMode, string> = {
  azimuth:
    "Switch the angle between 0 and 15 degrees and watch every module follow it. Raise p until it rings, back it off, then add a little d. Or press Auto.",
  drive:
    "Set a target speed with the feedback at 0, raise feedforward/v until the speed settles on it, then add feedback/p until it gets there quickly and holds. Or press Auto.",
}

/** Shown in place of the live tuning while Live mode is off: one click to tune from the page instead. */
export function LiveTuningInvite({ real }: { real: boolean }) {
  const live = useLive()
  if (live.enabled) return null
  const start = () =>
    live.turnOn(() => {
      if (real) return
      const host = targetHost({ kind: "sim" })
      if (host) void live.connect({ kind: "sim" }, host)
    })
  return (
    <div className="no-print flex flex-col gap-3 rounded-lg border-2 border-primary/40 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Radio className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="space-y-1">
          <p className="text-sm font-semibold">Tune from this page</p>
          <p className="text-sm text-muted-foreground">
            {real
              ? "Connect to your robot, then set the setpoint, watch every module on a graph and type the gains, all in one place."
              : "Connect to the running simulator, then set the setpoint, watch every module on a graph and type the gains, all in one place. A good place to play around."}{" "}
            Or follow the steps below in AdvantageScope.
          </p>
        </div>
      </div>
      <Button size="sm" className="shrink-0" onClick={start}>
        <Plug className="mr-2 h-4 w-4" />
        {real ? "Turn on Live mode" : "Connect to the simulator"}
      </Button>
    </div>
  )
}

/**
 * The live tuning in one place: start the tuning command and a mode, move the setpoint, watch the graph and type
 * the gains, switching between azimuth and drive without leaving it.
 */
export function LiveTuningPanel({
  real,
  notReadyHelp,
  onDone,
}: {
  real: boolean
  /** How to enable the robot in Utility mode, shown until it is. */
  notReadyHelp?: ReactNode
  /** Called after "Done tuning" stops everything. */
  onDone?: () => void
}) {
  const live = useLive()
  const connected = useConnected()
  const t = swerveTopics(live.driveName)
  const running = useNtValue<boolean>(t.command)
  const azimuthOn = useNtValue<boolean>(t.azimuth.enabled)
  const driveOn = useNtValue<boolean>(t.drive.enabled)
  const state = useRobotState()
  const [view, setView] = useState<TuneMode>("azimuth")
  const [pending, setPending] = useState<TuneMode | null>(null)

  if (!live.enabled) return null
  if (!connected) return <NotConnected />

  const active: TuneMode | null = driveOn ? "drive" : azimuthOn ? "azimuth" : null
  const shown = active ?? view
  const ready = state !== null && state.enabled && state.mode === "utility" && !state.eStop

  // Start the tuning command if it isn't running, then turn this mode on and the others off.
  const apply = (mode: TuneMode) => {
    if (!running) live.nt.set(t.command, true)
    live.nt.set(t.autoalignEnabled, false)
    live.nt.set(t.drive.inplace, false)
    live.nt.set(t.drive.velocity, 0)
    live.nt.set(t.drive.voltageEnabled, false)
    live.nt.set(t.azimuth.voltageEnabled, false)
    if (mode === "azimuth") {
      live.nt.set(t.drive.enabled, false)
      live.nt.set(t.azimuth.angle, 0)
    } else {
      live.nt.set(t.azimuth.enabled, false)
    }
    live.nt.set(t[mode].enabled, true)
    setView(mode)
  }

  // On a real robot, the safety checklist comes before anything moves on this connection.
  const start = (mode: TuneMode) => {
    if (real && !live.safetyConfirmed) setPending(mode)
    else apply(mode)
  }

  const pause = () => {
    live.nt.set(t.drive.velocity, 0)
    live.nt.set(t.drive.inplace, false)
    live.nt.set(t.drive.enabled, false)
    live.nt.set(t.azimuth.enabled, false)
  }

  const pick = (mode: TuneMode) => {
    // While a mode is on, picking the other one switches straight to it.
    if (active && active !== mode && ready) start(mode)
    else setView(mode)
  }

  const done = () => {
    live.stopAll()
    onDone?.()
  }

  return (
    <LiveBox className="space-y-4">
      <RobotStatus requireUtility />
      {!ready && notReadyHelp && <div className="text-sm text-muted-foreground">{notReadyHelp}</div>}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="tablist" aria-label="What to tune" className="inline-flex rounded-md border border-border bg-background p-0.5">
          {MODES.map(({ mode, label }) => (
            <button
              key={mode}
              role="tab"
              type="button"
              aria-selected={shown === mode}
              data-live={`tab-${mode}`}
              onClick={() => pick(mode)}
              className={cn(
                "flex items-center gap-1.5 rounded px-3 py-1 text-sm font-medium transition-colors",
                shown === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
              {active === mode && <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" aria-label="on" />}
            </button>
          ))}
        </div>
        {active === shown ? (
          <Button size="sm" variant="outline" className="bg-transparent" onClick={pause} data-live="pause">
            <Pause className="mr-2 h-4 w-4" />
            Pause
          </Button>
        ) : (
          <Button size="sm" disabled={!ready} onClick={() => start(shown)} data-live={`start-${shown}`}>
            <Play className="mr-2 h-4 w-4" />
            Start {shown} tuning
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">{HOW_TO[shown]}</p>
      {active !== shown && (
        <p className="text-xs text-muted-foreground">
          {ready
            ? `The modules hold still until you start ${shown} tuning.`
            : "Enable the robot in Utility mode to start tuning."}
        </p>
      )}

      <LiveTunerControls key={shown} mode={shown} />
      {shown === "drive" && <LiveInPlace real={real} />}

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
        <Button size="sm" onClick={done} data-live="done">
          <ArrowDown className="mr-2 h-4 w-4" />
          Done tuning, save the gains
        </Button>
        <span className="text-xs text-muted-foreground">Stops every mode and the tuning command.</span>
      </div>

      <SafetyDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title="Before the modules move"
        intro="Live tuning sends what you type straight to the motors, and the modules move as soon as a tuning mode is on. Check each of these:"
        items={ON_BLOCKS_CHECKLIST}
        confirmLabel="Everything is clear, start"
        onConfirm={() => {
          live.setSafetyConfirmed(true)
          if (pending) apply(pending)
          setPending(null)
        }}
      />
    </LiveBox>
  )
}
