"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react"
import { LiveNT, decodeControlWord, type ConnectionStatus, type LiveTarget, type RobotState } from "@/lib/live-nt"
import { LIVE_PASSWORD_SHA256, LivePasswordDialog } from "@/components/live/live-password"

const MODE_KEY = "yagsl-live-mode"
const TEAM_KEY = "yagsl-live-team"
const NAME_KEY = "yagsl-live-drive-name"
// Holds the password hash once it has been entered, so a new password locks Live mode again.
const UNLOCK_KEY = "yagsl-live-unlock"

/** NetworkTables paths for a SwerveDrive whose telemetry is named `name`. */
export function swerveTopics(name: string) {
  const tuning = `/Tuning/${name}`
  const mechanisms = `/Mechanisms/${name}`
  return {
    tuningPrefix: `${tuning}/`,
    mechanismsPrefix: `${mechanisms}/`,
    command: `${mechanisms}/tuning/running`,
    modulesPrefix: `${mechanisms}/modules/`,
    azimuth: {
      enabled: `${tuning}/modules/azimuth/enabled`,
      angle: `${tuning}/modules/azimuth/angle`,
      gain: (key: GainKey) => `${tuning}/modules/azimuth/${GAIN_PATHS[key]}`,
      measured: (module: string) => `${mechanisms}/modules/${module}/azimuth/mechanism/position`,
      voltageEnabled: `${tuning}/modules/azimuth/voltage/enabled`,
      voltage: `${tuning}/modules/azimuth/voltage/setpoint`,
      period: (module: string) => `${mechanisms}/modules/${module}/azimuth/closedloop/period`,
      measurementDelay: (module: string) => `${mechanisms}/modules/${module}/azimuth/closedloop/measurementDelay`,
    },
    drive: {
      enabled: `${tuning}/modules/drive/enabled`,
      velocity: `${tuning}/modules/drive/velocity`,
      inplace: `${tuning}/modules/drive/inplace`,
      gain: (key: GainKey) => `${tuning}/modules/drive/${GAIN_PATHS[key]}`,
      measured: (module: string) => `${mechanisms}/modules/${module}/drive/measurement/velocity`,
      voltageEnabled: `${tuning}/modules/drive/voltage/enabled`,
      voltage: `${tuning}/modules/drive/voltage/setpoint`,
      period: (module: string) => `${mechanisms}/modules/${module}/drive/closedloop/period`,
      measurementDelay: (module: string) => `${mechanisms}/modules/${module}/drive/closedloop/measurementDelay`,
    },
    autoalignEnabled: `${tuning}/autoalign/enabled`,
  }
}

export type GainKey = "p" | "i" | "d" | "s" | "v" | "a"
export const GAIN_KEYS: GainKey[] = ["p", "i", "d", "s", "v", "a"]
const GAIN_PATHS: Record<GainKey, string> = {
  p: "feedback/p",
  i: "feedback/i",
  d: "feedback/d",
  s: "feedforward/s",
  v: "feedforward/v",
  a: "feedforward/a",
}

export const CONTROL_WORD = "/DriverStation/ControlWord"

// The order YAGSL's generated config lists the modules in; any other names follow alphabetically.
const MODULE_ORDER = ["frontleft", "frontright", "backleft", "backright"]

interface LiveApi {
  /** Live mode is on: the guide shows its live controls. */
  enabled: boolean
  setEnabled: (enabled: boolean) => void
  /** Turn Live mode on, asking for the password if needed, then run `then` once it is on. */
  turnOn: (then?: () => void) => void
  nt: LiveNT
  status: ConnectionStatus
  host: string | null
  /** The SwerveDrive's telemetry name, "swerve" in the example project. */
  driveName: string
  setDriveName: (name: string) => void
  team: string
  setTeam: (team: string) => void
  /** Whether the person has gone through the safety checklist for this connection to a real robot. */
  safetyConfirmed: boolean
  setSafetyConfirmed: (confirmed: boolean) => void
  connect: (target: LiveTarget, host: string) => Promise<void>
  disconnect: () => void
  /** Turn every tuning mode off and stop the tuning command. */
  stopAll: () => void
  connectedTarget: LiveTarget | null
}

const LiveContext = createContext<LiveApi | null>(null)

function readStorage(key: string, fallback: string) {
  try {
    return window.localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Private windows can refuse storage; the setting just isn't remembered.
  }
}

export function LiveProvider({ children }: { children: ReactNode }) {
  const ntRef = useRef<LiveNT | null>(null)
  if (ntRef.current === null) ntRef.current = new LiveNT()
  const nt = ntRef.current

  const [enabled, setEnabledState] = useState(false)
  const [driveName, setDriveNameState] = useState("swerve")
  const [team, setTeamState] = useState("")
  const [safetyConfirmed, setSafetyConfirmed] = useState(false)
  const [connectedTarget, setConnectedTarget] = useState<LiveTarget | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  // What to do once the password is entered, for turnOn.
  const afterUnlock = useRef<(() => void) | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const isUnlocked = readStorage(UNLOCK_KEY, "") === LIVE_PASSWORD_SHA256
    setUnlocked(isUnlocked)
    const wanted = params.has("live") || readStorage(MODE_KEY, "") === "on"
    if (wanted && isUnlocked) setEnabledState(true)
    else if (params.has("live")) setPasswordOpen(true)
    setDriveNameState(readStorage(NAME_KEY, "swerve") || "swerve")
    setTeamState(readStorage(TEAM_KEY, ""))
  }, [])

  const status = useSyncExternalStore(nt.subscribe, () => nt.getStatus(), () => "idle" as ConnectionStatus)
  const host = useSyncExternalStore(nt.subscribe, () => nt.getHost(), () => null)

  const stopAll = useCallback(() => {
    const t = swerveTopics(driveName)
    nt.set(t.drive.voltage, 0)
    nt.set(t.drive.voltageEnabled, false)
    nt.set(t.azimuth.voltage, 0)
    nt.set(t.azimuth.voltageEnabled, false)
    nt.set(t.drive.velocity, 0)
    nt.set(t.drive.inplace, false)
    nt.set(t.drive.enabled, false)
    nt.set(t.azimuth.enabled, false)
    nt.set(t.autoalignEnabled, false)
    nt.set(t.command, false)
  }, [nt, driveName])

  const disconnect = useCallback(() => {
    stopAll()
    nt.disconnect()
    setConnectedTarget(null)
    setSafetyConfirmed(false)
  }, [nt, stopAll])

  const connect = useCallback(
    async (target: LiveTarget, targetHostName: string) => {
      setSafetyConfirmed(false)
      setConnectedTarget(target)
      const t = swerveTopics(driveName)
      await nt.connect(targetHostName, [t.tuningPrefix, t.mechanismsPrefix, CONTROL_WORD])
    },
    [nt, driveName],
  )

  const setEnabled = useCallback(
    (on: boolean) => {
      if (on && !unlocked) {
        setPasswordOpen(true)
        return
      }
      setEnabledState(on)
      writeStorage(MODE_KEY, on ? "on" : "off")
      if (!on) disconnect()
    },
    [disconnect, unlocked],
  )

  const onUnlocked = useCallback(() => {
    writeStorage(UNLOCK_KEY, LIVE_PASSWORD_SHA256)
    setUnlocked(true)
    setPasswordOpen(false)
    setEnabledState(true)
    writeStorage(MODE_KEY, "on")
    const then = afterUnlock.current
    afterUnlock.current = null
    then?.()
  }, [])

  const turnOn = useCallback(
    (then?: () => void) => {
      if (!unlocked) {
        afterUnlock.current = then ?? null
        setPasswordOpen(true)
        return
      }
      setEnabledState(true)
      writeStorage(MODE_KEY, "on")
      then?.()
    },
    [unlocked],
  )

  const onPasswordOpenChange = useCallback((open: boolean) => {
    setPasswordOpen(open)
    if (!open) afterUnlock.current = null
  }, [])

  const setDriveName = useCallback((name: string) => {
    setDriveNameState(name)
    writeStorage(NAME_KEY, name)
  }, [])

  const setTeam = useCallback((value: string) => {
    setTeamState(value)
    writeStorage(TEAM_KEY, value)
  }, [])

  // Leaving the page must not leave the modules spinning.
  useEffect(() => {
    const onLeave = () => stopAll()
    window.addEventListener("pagehide", onLeave)
    return () => window.removeEventListener("pagehide", onLeave)
  }, [stopAll])

  useEffect(() => () => nt.disconnect(), [nt])

  const api = useMemo<LiveApi>(
    () => ({
      enabled,
      setEnabled,
      turnOn,
      nt,
      status,
      host,
      driveName,
      setDriveName,
      team,
      setTeam,
      safetyConfirmed,
      setSafetyConfirmed,
      connect,
      disconnect,
      stopAll,
      connectedTarget,
    }),
    [enabled, setEnabled, turnOn, nt, status, host, driveName, setDriveName, team, setTeam, safetyConfirmed, connect, disconnect, stopAll, connectedTarget],
  )

  return (
    <LiveContext.Provider value={api}>
      {children}
      <LivePasswordDialog open={passwordOpen} onOpenChange={onPasswordOpenChange} onUnlocked={onUnlocked} />
    </LiveContext.Provider>
  )
}

export function useLive(): LiveApi {
  const api = useContext(LiveContext)
  if (!api) throw new Error("useLive must be used inside LiveProvider")
  return api
}

/** The latest value of a topic, re-rendering at most once per animation frame. */
export function useNtValue<T>(topic: string): T | undefined {
  const { nt } = useLive()
  return useSyncExternalStore(
    nt.subscribe,
    () => nt.get<T>(topic),
    () => undefined,
  )
}

/** Re-render whenever any subscribed value changes (at most once per animation frame). */
export function useNtVersion(): number {
  const { nt } = useLive()
  return useSyncExternalStore(nt.subscribe, () => nt.getVersion(), () => 0)
}

export function useRobotState(): RobotState | null {
  const raw = useNtValue<Uint8Array>(CONTROL_WORD)
  return useMemo(() => decodeControlWord(raw), [raw])
}

/** The module names published under /Mechanisms/<name>/modules/, in the usual order. */
export function useModuleNames(): string[] {
  const { nt, driveName } = useLive()
  const version = useSyncExternalStore(nt.subscribe, () => nt.getVersion(), () => 0)
  const prefix = swerveTopics(driveName).modulesPrefix
  const key = useMemo(() => {
    const names = new Set<string>()
    for (const topic of nt.topicNames()) {
      if (topic.startsWith(prefix)) names.add(topic.slice(prefix.length).split("/")[0])
    }
    return Array.from(names)
      .sort((a, b) => {
        const ia = MODULE_ORDER.indexOf(a)
        const ib = MODULE_ORDER.indexOf(b)
        return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b)
      })
      .join("|")
    // version changes whenever a topic arrives
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nt, prefix, version])
  return useMemo(() => (key ? key.split("|") : []), [key])
}
