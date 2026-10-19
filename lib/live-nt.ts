// NetworkTables 4 connection for the Quick Start Guide's Live mode.
//
// The protocol client is FRC Web Components' NT4 client (the same one its dashboards use). This file adds what a
// hosted HTTPS page needs to reach a robot on the local network, and the few helpers the guide uses.

import type { Nt4Client as Nt4ClientLike } from "@frc-web-components/fwc/source-providers/nt4"

export type LiveTarget = { kind: "sim" } | { kind: "robot"; team: string } | { kind: "custom"; host: string }

export type ConnectionStatus = "idle" | "connecting" | "connected"

export type RobotMode = "unknown" | "autonomous" | "teleoperated" | "utility"

export interface RobotState {
  mode: RobotMode
  enabled: boolean
  eStop: boolean
  dsAttached: boolean
}

const APP_NAME = "YAGSL_QuickStart"
/** How far ahead of the newest server timestamp received a write is stamped, in microseconds. */
const WRITE_LEAD_US = 100_000

/** The address of the robot for a team number, 10.TE.AM.2. */
export function teamAddress(team: string): string | null {
  const digits = team.trim()
  if (!/^\d{1,5}$/.test(digits)) return null
  const n = Number.parseInt(digits, 10)
  return `10.${Math.floor(n / 100)}.${n % 100}.2`
}

export function targetHost(target: LiveTarget): string | null {
  switch (target.kind) {
    case "sim":
      return "localhost"
    case "robot":
      return teamAddress(target.team)
    case "custom":
      return target.host.trim() || null
  }
}

export function isLoopbackHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "")
  return h === "localhost" || h.endsWith(".localhost") || h === "::1" || /^127\.\d+\.\d+\.\d+$/.test(h)
}

/**
 * Decode the WPILib ControlWord struct published at /DriverStation/ControlWord:
 * `uint64 opModeHash:56; enum{unknown=0,autonomous=1,teleoperated=2,utility=3} uint64 robotMode:2;
 * bool enabled:1; bool eStop:1; bool fmsAttached:1; bool dsAttached:1;`, little endian.
 */
export function decodeControlWord(value: unknown): RobotState | null {
  if (!(value instanceof Uint8Array) || value.length < 8) return null
  const flags = value[7]
  const modes: RobotMode[] = ["unknown", "autonomous", "teleoperated", "utility"]
  return {
    mode: modes[flags & 0b11],
    enabled: (flags & 0b100) !== 0,
    eStop: (flags & 0b1000) !== 0,
    dsAttached: (flags & 0b100000) !== 0,
  }
}

/**
 * A page served over HTTPS may only open a plain ws:// connection to the robot when the browser knows the
 * connection goes to the local network. Chrome treats private IP literals and .local names that way on its own; for
 * any other host name it needs `targetAddressSpace: "local"` (Chrome 154+). Older browsers reject the options
 * argument, so fall back to the plain constructor there. Loopback (the simulator) never needs it.
 */
function installLocalNetworkWebSocket() {
  const w = window as unknown as { WebSocket: typeof WebSocket; __yagslLocalNetworkWebSocket?: boolean }
  if (w.__yagslLocalNetworkWebSocket) return
  const NativeWebSocket = w.WebSocket
  class LocalNetworkWebSocket extends NativeWebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      let host = ""
      try {
        host = new URL(String(url)).hostname
      } catch {
        // Let the native constructor report the bad URL.
      }
      if (host && !isLoopbackHost(host)) {
        try {
          const list = protocols === undefined ? [] : Array.isArray(protocols) ? protocols : [protocols]
          super(url, { protocols: list, targetAddressSpace: "local" } as unknown as string[])
          return
        } catch {
          // This browser does not take an options argument.
        }
      }
      super(url, protocols)
    }
  }
  w.WebSocket = LocalNetworkWebSocket
  w.__yagslLocalNetworkWebSocket = true
}

type Listener = () => void

/** One live NetworkTables connection, with the latest value of every subscribed topic. */
export class LiveNT {
  private client: Nt4ClientLike | null = null
  private values = new Map<string, unknown>()
  private types = new Map<string, string>()
  private listeners = new Set<Listener>()
  private notifyScheduled = false
  private version = 0
  private status: ConnectionStatus = "idle"
  private host: string | null = null
  private connectedAt: number | null = null
  private attemptStartedAt: number | null = null
  /** The newest server timestamp seen on any topic, in microseconds. */
  private newestServerTimeUs = 0

  getStatus(): ConnectionStatus {
    return this.status
  }

  getHost(): string | null {
    return this.host
  }

  getVersion(): number {
    return this.version
  }

  /** When the connection attempt started, in ms, or null when not connecting. */
  getAttemptStartedAt(): number | null {
    return this.attemptStartedAt
  }

  getConnectedAt(): number | null {
    return this.connectedAt
  }

  get<T = unknown>(topic: string): T | undefined {
    return this.values.get(topic) as T | undefined
  }

  has(topic: string): boolean {
    return this.values.has(topic)
  }

  topicNames(): string[] {
    return Array.from(this.values.keys())
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    if (this.notifyScheduled) return
    this.notifyScheduled = true
    // Topics update up to 50 times a second each; tell React about all of them once per frame.
    const flush = () => {
      this.notifyScheduled = false
      this.version++
      this.listeners.forEach((l) => l())
    }
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(flush)
    else setTimeout(flush, 16)
  }

  private setStatus(status: ConnectionStatus) {
    this.status = status
    this.notify()
  }

  async connect(host: string, prefixes: string[]): Promise<void> {
    this.disconnect()
    installLocalNetworkWebSocket()
    const { Nt4Client } = await import("@frc-web-components/fwc/source-providers/nt4")
    this.host = host
    this.attemptStartedAt = Date.now()
    this.setStatus("connecting")
    const client: Nt4ClientLike = new Nt4Client(
      host,
      APP_NAME,
      (topic) => {
        if (this.client !== client) return
        this.types.set(topic.name, topic.type)
      },
      (topic) => {
        if (this.client !== client) return
        this.types.delete(topic.name)
        this.values.delete(topic.name)
        this.notify()
      },
      (topic, timestampUs, value) => {
        if (this.client !== client) return
        if (timestampUs > this.newestServerTimeUs) this.newestServerTimeUs = timestampUs
        this.values.set(topic.name, value)
        this.notify()
      },
      () => {
        if (this.client !== client) return
        this.connectedAt = Date.now()
        this.attemptStartedAt = null
        this.setStatus("connected")
      },
      () => {
        if (this.client !== client) return
        // The client keeps retrying on its own.
        this.values.clear()
        this.types.clear()
        this.connectedAt = null
        this.attemptStartedAt = this.attemptStartedAt ?? Date.now()
        this.setStatus("connecting")
      },
    )
    this.client = client
    client.subscribePeriodic(prefixes, true, 0.02)
    client.connect()
  }

  disconnect() {
    if (this.client) {
      this.client.disconnect()
      this.client = null
    }
    this.values.clear()
    this.types.clear()
    this.host = null
    this.newestServerTimeUs = 0
    this.connectedAt = null
    this.attemptStartedAt = null
    if (this.status !== "idle") this.setStatus("idle")
  }

  /** Publish a value. Does nothing unless connected. */
  set(topic: string, value: boolean | number | string) {
    if (!this.client || this.status !== "connected") return false
    const type = this.types.get(topic) ?? (typeof value === "boolean" ? "boolean" : typeof value === "number" ? "double" : "string")
    this.client.publishNewTopic(topic, type)
    // The server drops a value stamped older than the one it has. The robot republishes some of these topics every
    // loop, and unchanged values are not sent on, so the server's copy can be newer than anything seen here. The
    // client's own clock estimate can be hundreds of milliseconds off, so stamp the value ahead of the newest
    // server timestamp received instead. The robot writes these topics again every loop, so its updates still land.
    const base = this.newestServerTimeUs > 0 ? this.newestServerTimeUs : (this.client.getServerTime_us() ?? 0)
    const timestamp = base + WRITE_LEAD_US
    this.client.addTimestampedSample(topic, timestamp, value)
    this.values.set(topic, value)
    this.notify()
    return true
  }
}
