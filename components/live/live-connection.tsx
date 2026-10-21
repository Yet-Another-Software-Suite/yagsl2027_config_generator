"use client"

import { useEffect, useState, type ReactNode } from "react"
import { CircleAlert, CircleCheck, Loader2, Plug, Radio, Unplug } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { isLoopbackHost, targetHost, type LiveTarget } from "@/lib/live-nt"
import { useLive, useRobotState, useSwerveDrives } from "@/components/live/live-context"

export function Path({ children }: { children: string }) {
  return <code className="break-all rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{children}</code>
}

/** A box that holds the live controls of one step. */
export function LiveBox({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("no-print mt-2 space-y-3 rounded-md border border-primary/30 bg-primary/5 p-3", className)}>
      {children}
    </div>
  )
}

/** Shown in place of a step's live controls while Live mode is on but nothing is connected. */
export function NotConnected() {
  return (
    <LiveBox>
      <p className="text-xs text-muted-foreground">Connect above to do this step from here.</p>
    </LiveBox>
  )
}

export function useConnected() {
  const live = useLive()
  return live.enabled && live.status === "connected"
}

/** Header button that turns Live mode on and off. */
export function LiveModeToggle() {
  const { enabled, setEnabled, status } = useLive()
  return (
    <Button
      variant={enabled ? "default" : "outline"}
      size="sm"
      className={cn(!enabled && "bg-transparent")}
      onClick={() => setEnabled(!enabled)}
      aria-pressed={enabled}
      title="Live mode connects this guide to your simulator or robot and does the tuning steps from this page"
    >
      <Radio className="mr-2 h-4 w-4" />
      Live
      {enabled && (
        <span
          className={cn(
            "ml-2 inline-block h-2 w-2 rounded-full",
            status === "connected" ? "bg-green-500" : status === "connecting" ? "bg-yellow-400" : "bg-muted-foreground",
          )}
          aria-label={status}
        />
      )}
    </Button>
  )
}

/** The robot's enabled state and mode, from the ControlWord. */
export function RobotStatus({ requireUtility }: { requireUtility: boolean }) {
  const state = useRobotState()
  if (!state) return <p className="text-xs text-muted-foreground">Waiting for the robot's state...</p>
  const modeName = { unknown: "no mode", autonomous: "Autonomous", teleoperated: "Teleoperated", utility: "Utility" }[
    state.mode
  ]
  const ok = state.enabled && !state.eStop && (!requireUtility || state.mode === "utility")
  return (
    <div
      className={cn(
        "flex items-start gap-2 text-sm",
        ok ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400",
      )}
    >
      {ok ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />}
      <span>
        {state.eStop ? "The robot is emergency stopped." : `Robot ${state.enabled ? "enabled" : "disabled"}, ${modeName}.`}
        {!ok && !state.eStop && requireUtility && " Enable it in Utility mode with no OpMode selected."}
      </span>
    </div>
  )
}

const TROUBLESHOOT_AFTER_MS = 4000

/** Pick the simulator or a robot, connect, and see what is connected. */
export function LiveConnectionCard({ real }: { real: boolean }) {
  const live = useLive()
  const [kind, setKind] = useState<"robot" | "custom">("robot")
  const [custom, setCustom] = useState("")
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (live.status !== "connecting") return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [live.status])

  if (!live.enabled) return null

  const target: LiveTarget = !real
    ? { kind: "sim" }
    : kind === "robot"
      ? { kind: "robot", team: live.team }
      : { kind: "custom", host: custom }
  const host = targetHost(target)
  const connectedHere =
    live.connectedTarget !== null && (live.connectedTarget.kind === "sim") === !real && live.status !== "idle"
  const otherConnection = live.status !== "idle" && !connectedHere
  const attemptStarted = live.nt.getAttemptStartedAt()
  const showHelp =
    connectedHere && live.status === "connecting" && attemptStarted !== null && now - attemptStarted > TROUBLESHOOT_AFTER_MS
  const insecurePage =
    typeof window !== "undefined" && !window.isSecureContext && host !== null && !isLoopbackHost(host)
  const where = live.host === "localhost" ? "the simulator" : live.host

  return (
    <div className="no-print space-y-3 rounded-lg border-2 border-primary/40 bg-primary/5 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Radio className="h-5 w-5 text-primary" />
        <h4 className="text-base font-semibold">
          Live mode: {real ? "connect to your robot" : "connect to the simulator"}
        </h4>
      </div>
      <p className="text-sm text-muted-foreground">
        This page talks to {real ? "the robot" : "the simulator"} over NetworkTables, the same way AdvantageScope does.
        Each step below gets buttons that do it for you, and graphs of what the modules do.
      </p>

      {!connectedHere && (
        <div className="space-y-2">
          {real && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Connect by</Label>
                <div className="flex gap-1">
                  <Button size="sm" variant={kind === "robot" ? "default" : "outline"} onClick={() => setKind("robot")}>
                    Team number
                  </Button>
                  <Button size="sm" variant={kind === "custom" ? "default" : "outline"} onClick={() => setKind("custom")}>
                    Address
                  </Button>
                </div>
              </div>
              {kind === "robot" ? (
                <div className="space-y-1">
                  <Label htmlFor="live-team" className="text-xs">
                    Team number
                  </Label>
                  <Input
                    id="live-team"
                    inputMode="numeric"
                    className="h-8 w-28"
                    value={live.team}
                    placeholder="9658"
                    onChange={(e) => live.setTeam(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <Label htmlFor="live-host" className="text-xs">
                    Robot address
                  </Label>
                  <Input
                    id="live-host"
                    className="h-8 w-52"
                    value={custom}
                    placeholder="10.96.58.2"
                    onChange={(e) => setCustom(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-end gap-3">
            <Button size="sm" disabled={!host || otherConnection} onClick={() => host && live.connect(target, host)}>
              <Plug className="mr-2 h-4 w-4" />
              Connect{host ? ` to ${real ? host : "the simulator"}` : ""}
            </Button>
          </div>
          {otherConnection && (
            <p className="text-xs text-muted-foreground">
              Live mode is connected to {live.connectedTarget?.kind === "sim" ? "the simulator" : "a robot"}.{" "}
              <button className="underline" onClick={live.disconnect}>
                Disconnect
              </button>{" "}
              first.
            </p>
          )}
          {insecurePage && (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              This page isn't loaded over HTTPS, so the browser won't let it reach the robot. Open it from
              https://config.yagsl.com/guide instead.
            </p>
          )}
        </div>
      )}

      {connectedHere && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            {live.status === "connected" ? (
              <span className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
                <CircleCheck className="h-4 w-4" />
                Connected to {where}
              </span>
            ) : (
              <span className="flex items-center gap-2 text-sm font-medium">
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting to {where}...
              </span>
            )}
            <Button size="sm" variant="outline" className="bg-transparent" onClick={live.disconnect}>
              <Unplug className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          </div>
          {live.status === "connected" && (
            <>
              <SwerveDrivePicker id={`live-drive-${real ? "robot" : "sim"}`} />
              <RobotStatus requireUtility />
            </>
          )}
          {showHelp && <ConnectionHelp real={real} />}
        </div>
      )}
    </div>
  )
}

const NO_DRIVE_AFTER_MS = 3000

/** Pick the swerve drive to tune, from the ones publishing telemetry under /Mechanisms. */
function SwerveDrivePicker({ id }: { id: string }) {
  const live = useLive()
  const drives = useSwerveDrives()
  const [waited, setWaited] = useState(false)
  const { driveName, setDriveName } = live

  // Keep the drive picked last time while it is there, or else take the first one found.
  useEffect(() => {
    if (drives.length && !drives.includes(driveName)) setDriveName(drives[0])
  }, [drives, driveName, setDriveName])

  useEffect(() => {
    const timer = setTimeout(() => setWaited(true), NO_DRIVE_AFTER_MS)
    return () => clearTimeout(timer)
  }, [])

  if (!drives.length) {
    return waited ? (
      <p className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          No swerve drive is publishing telemetry under <Path>/Mechanisms</Path>. Give its SwerveDriveConfig a{" "}
          <Path>.withTelemetry(...)</Path>, as in the next step.
        </span>
      </p>
    ) : (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Looking for swerve drives under <Path>/Mechanisms</Path>...
      </p>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Label htmlFor={id} className="text-sm">
        Swerve drive
      </Label>
      <Select value={drives.includes(driveName) ? driveName : undefined} onValueChange={setDriveName}>
        <SelectTrigger id={id} size="sm" className="h-8 min-w-36" data-live="drive-picker">
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
        <SelectContent>
          {drives.map((name) => (
            <SelectItem key={name} value={name}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-xs text-muted-foreground">
        {drives.length === 1
          ? `Found under /Mechanisms/${driveName}.`
          : `${drives.length} found under /Mechanisms.`}
      </span>
    </div>
  )
}

function ConnectionHelp({ real }: { real: boolean }) {
  return (
    <Alert>
      <CircleAlert className="h-4 w-4" />
      <AlertTitle>Can't connect yet</AlertTitle>
      <AlertDescription>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          {real ? (
            <>
              <li>Is this computer on the robot's network, over its Wi-Fi, Ethernet or USB?</li>
              <li>Is the robot code running? The Driver Station shows "Robot Code" in green.</li>
            </>
          ) : (
            <li>
              Is the simulator running? Live mode connects to it at <Path>localhost:5810</Path>, the same as
              AdvantageScope's <strong>Connect to Simulator</strong>.
            </li>
          )}
          <li>
            <strong>Chrome or Edge:</strong> when the browser asks whether this site may access devices on your local
            network, allow it. If you blocked it, click the icon left of the address bar, open{" "}
            <strong>Site settings</strong>, set <strong>Local network access</strong> to <strong>Allow</strong>, and
            reload.
            {real && (
              <>
                {" "}
                On an older version of Chrome or Edge, set <strong>Insecure content</strong> to <strong>Allow</strong> in
                the same place instead.
              </>
            )}
          </li>
          {real && (
            <>
              <li>
                <strong>Firefox:</strong> open <Path>about:config</Path> and set{" "}
                <Path>network.websocket.allowInsecureFromHTTPS</Path> to <Path>true</Path>. Firefox can't otherwise
                reach a robot from an HTTPS page.
              </li>
              <li>
                <strong>Safari</strong> can't connect to a robot from an HTTPS page. Use Chrome or Edge.
              </li>
            </>
          )}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
