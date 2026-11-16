// Gearing presets for COTS swerve modules. Picking a module type fills in its wheel diameter and angle gear ratio,
// and picking one of its configurations fills in the drive gear ratio, in Physical Properties.
//
// Ratios are motor rotations per output rotation (X in X:1). Where the gear train is published, the ratio is worked
// out from its tooth counts rather than rounded, and checked against the vendor's rounded value:
// - SDS: SDS's published ratios. MK4 L1 is 50/14 x 19/25 x 45/15 = 8.14:1; MK5i and MK5n from SDS's published values.
// - REV MAXSwerve: REV's speed ratio chart, spur / pinion x 45/15; steering 9424:203.
// - REV EasySwerve: REV's EasySwerve docs, 6.3:1 drive and 20:1 steering; the 4in Traction Wheel, or the 3.66in Spiky
//   Wheel.
// - Thrifty Swerve: Thrifty's BOM gear train, 36/pinion x bevel shaft gear/24 x 45/15 (12T with 18T is 6.75:1);
//   steering 25:1 from Thrifty's product page.
// - WCP: WCP's ratio tables (docs.wcproducts.com), each from its tooth counts.
// YAGSL's docs list the same values on the Standard Conversion Factors page; keep the two the same.

export interface ModuleConfiguration {
  /** Unique within its module type, also the select value. */
  id: string
  name: string
  driveGearRatio: number
}

export interface ModuleType {
  /** Unique id, also the select value. */
  id: string
  vendor: string
  name: string
  /** Wheel diameter in inches. */
  wheelDiameter: number
  angleGearRatio: number
  /**
   * The angle motor and absolute encoder inversions the vendor's own code uses for this module, where it publishes
   * any. Picking the module type sets them on every module. Left out where the vendor publishes none: the user works
   * them out with the guide's inversion steps.
   * - SDS MK4 and MK4i: SDS's swerve library (SdsModuleConfigurations), which inverts the MK4i's steer motor and not
   *   the MK4's, and leaves the CANcoder counterclockwise positive.
   * - REV MAXSwerve: REV's MAXSwerve template inverts the turning encoder, "since the output shaft rotates in the
   *   opposite direction of the steering motor", and not the motor.
   * - REV EasySwerve: REV's EasySwerve template inverts neither, since "the output shaft rotates in the same direction
   *   as the steering motor".
   * - SDS MK4n, MK4c, MK5i and MK5n, WCP Swerve X, Swerve X Flipped and Swerve X2S/X2St: what CTRE's Tuner X swerve
   *   generator writes, read from teams' public generated TunerConstants (9 to 12 files each, 1 for the MK4c). The
   *   same sampling gives the MK4 and MK4i the values SDS's library has. The Swerve X2/X2i/X2t is left out: its files
   *   are split, as the standard and inverted modules share a steering ratio.
   */
  inversion?: { angleMotor: boolean; absoluteEncoder: boolean; source: string }
  configurations: ModuleConfiguration[]
}

// The 45:15 bevel every module here turns the wheel through.
const BEVEL = 45 / 15

function config(id: string, name: string, driveGearRatio: number): ModuleConfiguration {
  return { id, name, driveGearRatio }
}

// SDS MK4 family. L1/L2/L3 share the 50:14 first stage; L4 has a 48:16 first stage; the "+" ratios a 50:16 first stage.
const MK4_L = [
  config("l1", "L1", (50 / 14) * (19 / 25) * BEVEL),
  config("l2", "L2", (50 / 14) * (17 / 27) * BEVEL),
  config("l3", "L3", (50 / 14) * (16 / 28) * BEVEL),
]
const MK4_L4 = config("l4", "L4", (48 / 16) * (16 / 28) * BEVEL)
const MK4_L_PLUS = [
  config("l1plus", "L1+", (50 / 16) * (19 / 25) * BEVEL),
  config("l2plus", "L2+", (50 / 16) * (17 / 27) * BEVEL),
  config("l3plus", "L3+", (50 / 16) * (16 / 28) * BEVEL),
]
const MK5_R = [config("r1", "R1", 7.03), config("r2", "R2", 6.03), config("r3", "R3", 5.27)]

// REV EasySwerve: one drive gearing, from REV's EasySwerve docs; 18.79 ft/s with a NEO Vortex on the 4in wheel.
const EASYSWERVE = [config("standard", "Standard (6.3:1)", 6.3)]

/** WCP names a ratio by its ratio set and pinion: X2-11 is the X2 set with the 11T pinion. */
function wcpRatios(sets: [string, number[], (pinion: number) => number][]): ModuleConfiguration[] {
  return sets.flatMap(([set, pinions, ratio]) =>
    pinions.map((pinion) => config(`${set.toLowerCase()}-${pinion}`, `${set}-${pinion}`, ratio(pinion))),
  )
}

export const MODULE_TYPES: ModuleType[] = [
  { id: "sds-mk4", inversion: { angleMotor: false, absoluteEncoder: false, source: "the vendor's own code" }, vendor: "SDS", name: "MK4", wheelDiameter: 4, angleGearRatio: 12.8, configurations: [...MK4_L, MK4_L4] },
  { id: "sds-mk4i", inversion: { angleMotor: true, absoluteEncoder: false, source: "the vendor's own code" }, vendor: "SDS", name: "MK4i", wheelDiameter: 4, angleGearRatio: 150 / 7, configurations: MK4_L },
  { id: "sds-mk4n", inversion: { angleMotor: true, absoluteEncoder: false, source: "CTRE's swerve generator" }, vendor: "SDS", name: "MK4n", wheelDiameter: 4, angleGearRatio: 18.75, configurations: MK4_L_PLUS },
  { id: "sds-mk4c", inversion: { angleMotor: false, absoluteEncoder: false, source: "CTRE's swerve generator" }, vendor: "SDS", name: "MK4c", wheelDiameter: 4, angleGearRatio: 12.8, configurations: MK4_L_PLUS },
  { id: "sds-mk5i", inversion: { angleMotor: false, absoluteEncoder: false, source: "CTRE's swerve generator" }, vendor: "SDS", name: "MK5i", wheelDiameter: 4, angleGearRatio: 26, configurations: MK5_R },
  { id: "sds-mk5n", inversion: { angleMotor: false, absoluteEncoder: false, source: "CTRE's swerve generator" }, vendor: "SDS", name: "MK5n", wheelDiameter: 4, angleGearRatio: 287 / 11, configurations: MK5_R },
  {
    id: "rev-maxswerve",
    inversion: { angleMotor: false, absoluteEncoder: true, source: "the vendor's own code" },
    vendor: "REV",
    name: "MAXSwerve",
    wheelDiameter: 3,
    angleGearRatio: 9424 / 203,
    configurations: [
      config("low", "Low (12T pinion)", (22 / 12) * BEVEL),
      config("medium", "Medium (13T pinion)", (22 / 13) * BEVEL),
      config("high", "High (14T pinion)", (22 / 14) * BEVEL),
      config("extra-high-1", "Extra High 1", (21 / 14) * BEVEL),
      config("extra-high-2", "Extra High 2", (20 / 14) * BEVEL),
      config("extra-high-3", "Extra High 3", (20 / 15) * BEVEL),
      config("extra-high-4", "Extra High 4", (20 / 16) * BEVEL),
      config("extra-high-5", "Extra High 5", (19 / 16) * BEVEL),
    ],
  },
  {
    id: "rev-easyswerve",
    inversion: { angleMotor: false, absoluteEncoder: false, source: "the vendor's own code" },
    vendor: "REV",
    name: "EasySwerve",
    wheelDiameter: 4,
    angleGearRatio: 20,
    configurations: EASYSWERVE,
  },
  {
    id: "rev-easyswerve-spiky",
    inversion: { angleMotor: false, absoluteEncoder: false, source: "the vendor's own code" },
    vendor: "REV",
    name: "EasySwerve, Spiky Wheel",
    wheelDiameter: 3.66,
    angleGearRatio: 20,
    configurations: EASYSWERVE,
  },
  {
    id: "thrifty-swerve",
    vendor: "Thrifty Bot",
    name: "Thrifty Swerve",
    wheelDiameter: 4,
    angleGearRatio: 25,
    configurations: [12, 13, 14].flatMap((pinion) =>
      [18, 16].map((bevelShaft) =>
        config(
          `${pinion}t-${bevelShaft}t`,
          `${pinion}T pinion, ${bevelShaft}T bevel shaft gear`,
          (36 / pinion) * (bevelShaft / 24) * BEVEL,
        ),
      ),
    ),
  },
  {
    id: "wcp-swerve-x2",
    vendor: "WCP",
    name: "Swerve X2 / X2i / X2t",
    wheelDiameter: 4,
    angleGearRatio: 12.1,
    configurations: wcpRatios([
      ["X1", [10, 11, 12], (p) => (54 / p) * (18 / 38) * BEVEL],
      ["X2", [10, 11, 12], (p) => (54 / p) * (16 / 38) * BEVEL],
      ["X3", [10, 11, 12], (p) => (54 / p) * (16 / 40) * BEVEL],
      ["X4", [10, 11, 12], (p) => (54 / p) * (14 / 40) * BEVEL],
    ]),
  },
  {
    id: "wcp-swerve-x2s",
    inversion: { angleMotor: false, absoluteEncoder: true, source: "CTRE's swerve generator" },
    vendor: "WCP",
    name: "Swerve X2S / X2St",
    wheelDiameter: 3.5,
    angleGearRatio: 25.9,
    configurations: wcpRatios([
      ["X1", [15, 16, 17], (p) => (30 / p) * BEVEL],
      ["X2", [17, 18, 19], (p) => (28 / p) * BEVEL],
      ["X3", [19, 20, 21], (p) => (26 / p) * BEVEL],
    ]),
  },
  {
    id: "wcp-swerve-x",
    inversion: { angleMotor: true, absoluteEncoder: false, source: "CTRE's swerve generator" },
    vendor: "WCP",
    name: "Swerve X",
    wheelDiameter: 4,
    angleGearRatio: 396 / 35,
    configurations: wcpRatios([
      ["X1", [10, 11, 12], (p) => (34 / p) * (20 / 26) * BEVEL],
      ["X2", [10, 11, 12], (p) => (34 / p) * (18 / 28) * BEVEL],
      ["X3", [12, 13, 14], (p) => (32 / p) * (18 / 28) * BEVEL],
    ]),
  },
  {
    id: "wcp-swerve-x-flipped",
    inversion: { angleMotor: true, absoluteEncoder: false, source: "CTRE's swerve generator" },
    vendor: "WCP",
    name: "Swerve X Flipped",
    wheelDiameter: 4,
    angleGearRatio: 468 / 35,
    configurations: wcpRatios([
      ["X1", [10, 11, 12], (p) => (42 / p) * (18 / 28) * BEVEL],
      ["X2", [10, 11, 12], (p) => (42 / p) * (16 / 30) * BEVEL],
      ["X3", [10, 11, 12], (p) => (42 / p) * (14 / 32) * BEVEL],
    ]),
  },
  {
    id: "wcp-swerve-xs",
    vendor: "WCP",
    name: "Swerve XS",
    wheelDiameter: 3,
    angleGearRatio: 165 / 4,
    configurations: wcpRatios([
      ["X1", [12, 13, 14], (p) => (24 / p) * BEVEL],
      ["X2", [14, 15, 16], (p) => (22 / p) * BEVEL],
    ]),
  },
]

/** Vendors in the order their module types are listed. */
export const MODULE_VENDORS = [...new Set(MODULE_TYPES.map((t) => t.vendor))]

// Within the vendors' rounding, so a config with SDS's 6.75 still matches L2's 6.746. No two configurations of one
// module type are closer than 0.014 apart, and no two angle gear ratios closer than 0.09.
const close = (a: number, b: number) => Math.abs(a - b) <= 0.005

export function findModuleType(id: string | undefined): ModuleType | undefined {
  return MODULE_TYPES.find((t) => t.id === id)
}

/** Whether these gearing values have the module type's wheel diameter and angle gear ratio. */
export function fitsModuleType(type: ModuleType, wheelDiameter: number, angleGearRatio: number) {
  return close(type.wheelDiameter, wheelDiameter) && close(type.angleGearRatio, angleGearRatio)
}

/** The module type's configuration with this drive gear ratio, if any. */
export function matchModuleConfiguration(type: ModuleType, driveGearRatio: number) {
  return type.configurations.find((c) => close(c.driveGearRatio, driveGearRatio))
}

/**
 * The module type these gearing values came from: the first whose wheel diameter, angle gear ratio and one of its
 * configurations all match, else the first whose wheel diameter and angle gear ratio match.
 */
export function matchModuleType(driveGearRatio: number, wheelDiameter: number, angleGearRatio: number) {
  const fitting = MODULE_TYPES.filter((t) => fitsModuleType(t, wheelDiameter, angleGearRatio))
  return fitting.find((t) => matchModuleConfiguration(t, driveGearRatio)) ?? fitting[0]
}
