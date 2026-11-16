import type { PIDFPropertiesConfig } from "./types"

type PID = { p: number; i: number; d: number }

// Starting PID gains for every motor type in MOTOR_TYPES, checked in YAGSL's simulation on 5.36:1 and 6.75:1 drive
// gearing and 12.8:1, 18.75:1 and 21.43:1 azimuth gearing (SimGainsTest in the YAGSL repository keeps a copy of these
// numbers). They are PID only: the feedforward (s, v, a) is left for the user to tune, and with drive v at 0 YAGSL
// derives the drive's kV from the motor's free speed and the gearing. TalonFX and TalonFXS steer from the CANcoder,
// which lags a loop in simulation, so their angle gains are gentler than the SPARKs' and Nova's.
//
// talonfxs_pulsar has the TalonFXS NEO gains, unchecked: YAMS's TalonFXS simulation of the Pulsar does not drive.
//
// Drive gains are volts per wheel rotation per second of error, angle gains are volts per rotation of error.
const DRIVE_DEFAULTS: Record<string, PID> = {
  talonfx_krakenx44: { p: 1, i: 0, d: 0 },
  talonfx_krakenx60: { p: 1, i: 0, d: 0 },
  talonfx_falcon: { p: 1, i: 0, d: 0 },
  talonfxs_neo: { p: 2, i: 0, d: 0 },
  talonfxs_neo2: { p: 2, i: 0, d: 0 },
  talonfxs_neo550: { p: 2, i: 0, d: 0 },
  talonfxs_vortex: { p: 2, i: 0, d: 0 },
  talonfxs_pulsar: { p: 2, i: 0, d: 0 },
  sparkmax_neo: { p: 1, i: 0, d: 0 },
  sparkmax_neo2: { p: 1, i: 0, d: 0 },
  sparkmax_neo550: { p: 4, i: 0, d: 0 },
  sparkmax_vortex: { p: 1, i: 0, d: 0 },
  sparkmax_pulsar: { p: 1, i: 0, d: 0 },
  sparkmax_minion: { p: 1, i: 0, d: 0 },
  talonfxs_minion: { p: 2, i: 0, d: 0 },
  sparkflex_neo: { p: 1, i: 0, d: 0 },
  sparkflex_neo2: { p: 1, i: 0, d: 0 },
  sparkflex_neo550: { p: 4, i: 0, d: 0 },
  sparkflex_vortex: { p: 1, i: 0, d: 0 },
  sparkflex_minion: { p: 1, i: 0, d: 0 },
  sparkflex_pulsar: { p: 1, i: 0, d: 0 },
  nova_neo: { p: 2, i: 0, d: 0 },
  nova_neo2: { p: 2, i: 0, d: 0 },
  nova_neo550: { p: 4, i: 0, d: 0 },
  nova_vortex: { p: 2, i: 0, d: 0 },
  nova_minion: { p: 2, i: 0, d: 0 },
  nova_pulsar: { p: 2, i: 0, d: 0 },
}

const ANGLE_DEFAULTS: Record<string, PID> = {
  talonfx_krakenx44: { p: 15, i: 0, d: 0.3 },
  talonfx_krakenx60: { p: 15, i: 0, d: 0.3 },
  talonfx_falcon: { p: 15, i: 0, d: 0.3 },
  talonfxs_neo: { p: 15, i: 0, d: 0.3 },
  talonfxs_neo2: { p: 15, i: 0, d: 0.3 },
  talonfxs_neo550: { p: 12, i: 0, d: 1 },
  talonfxs_vortex: { p: 15, i: 0, d: 0.6 },
  talonfxs_pulsar: { p: 15, i: 0, d: 0.3 },
  sparkmax_neo: { p: 40, i: 0, d: 0.3 },
  sparkmax_neo2: { p: 40, i: 0, d: 0.3 },
  sparkmax_neo550: { p: 12, i: 0, d: 0.6 },
  sparkmax_vortex: { p: 40, i: 0, d: 0.3 },
  sparkmax_pulsar: { p: 30, i: 0, d: 0.3 },
  sparkmax_minion: { p: 30, i: 0, d: 0.3 },
  talonfxs_minion: { p: 15, i: 0, d: 0.3 },
  sparkflex_neo: { p: 40, i: 0, d: 0.3 },
  sparkflex_neo2: { p: 40, i: 0, d: 0.3 },
  sparkflex_neo550: { p: 12, i: 0, d: 0.6 },
  sparkflex_vortex: { p: 40, i: 0, d: 0.3 },
  sparkflex_minion: { p: 30, i: 0, d: 0.3 },
  sparkflex_pulsar: { p: 30, i: 0, d: 0.3 },
  nova_neo: { p: 40, i: 0, d: 0.3 },
  nova_neo2: { p: 40, i: 0, d: 0.3 },
  nova_neo550: { p: 12, i: 0, d: 0.6 },
  nova_vortex: { p: 40, i: 0, d: 0.3 },
  nova_minion: { p: 30, i: 0, d: 0.3 },
  nova_pulsar: { p: 30, i: 0, d: 0.3 },
}

// Gains earlier versions of the generator started with. They count as untouched defaults, so picking a motor still
// fills in its gains.
const LEGACY_DRIVE: PID[] = [{ p: 0.1, i: 0, d: 0 }]
const LEGACY_ANGLE: PID[] = [{ p: 0.01, i: 0, d: 0 }]

export type GainSide = "drive" | "angle"

export function defaultGains(side: GainSide, motorType: string): PID | undefined {
  return (side === "drive" ? DRIVE_DEFAULTS : ANGLE_DEFAULTS)[motorType]
}

function samePID(a: PID, b: PID) {
  return a.p === b.p && a.i === b.i && a.d === b.d
}

/** True when these PID gains are a default the generator filled in, not ones the user typed. */
export function isDefaultGains(side: GainSide, gains: PID) {
  const defaults = side === "drive" ? DRIVE_DEFAULTS : ANGLE_DEFAULTS
  const legacy = side === "drive" ? LEGACY_DRIVE : LEGACY_ANGLE
  return [...Object.values(defaults), ...legacy].some((d) => samePID(d, gains))
}

/**
 * The PIDF properties after a motor type is picked: the motor's default PID gains, unless the user already typed their
 * own. Feedforward values are kept as they are.
 */
export function withMotorDefaults(
  pidf: PIDFPropertiesConfig,
  side: GainSide,
  motorType: string,
): PIDFPropertiesConfig {
  const defaults = defaultGains(side, motorType)
  if (!defaults || !isDefaultGains(side, pidf[side])) {
    return pidf
  }
  return { ...pidf, [side]: { ...pidf[side], ...defaults } }
}
