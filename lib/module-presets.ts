// Gearing presets for COTS swerve modules. Picking one fills in the drive gear ratio, wheel diameter and angle gear
// ratio in Physical Properties.
//
// Ratios are motor rotations per output rotation (X in X:1). Where the gear train is published, the ratio is worked
// out from its tooth counts rather than rounded, and checked against the vendor's rounded value:
// - SDS: SDS's published ratios. MK4 L1 is 50/14 x 19/25 x 45/15 = 8.14:1; MK5i and MK5n from SDS's published values.
// - REV MAXSwerve: REV's speed ratio chart, spur / pinion x 45/15; steering 9424:203.
// - Thrifty Swerve: Thrifty's BOM gear train, 36/pinion x bevel shaft gear/24 x 45/15 (12T with 18T is 6.75:1);
//   steering 25:1 from Thrifty's product page.
// - WCP: WCP's ratio tables (docs.wcproducts.com), each from its tooth counts.

export interface ModulePreset {
  /** Unique id, also the select value. */
  id: string
  /** Name shown in the dropdown, without the vendor. */
  name: string
  driveGearRatio: number
  /** Wheel diameter in inches. */
  wheelDiameter: number
  angleGearRatio: number
}

export interface ModulePresetGroup {
  vendor: string
  presets: ModulePreset[]
}

// The 45:15 bevel every module here turns the wheel through.
const BEVEL = 45 / 15

function preset(id: string, name: string, driveGearRatio: number, wheelDiameter: number, angleGearRatio: number) {
  return { id, name, driveGearRatio, wheelDiameter, angleGearRatio }
}

// SDS MK4 family. L1/L2/L3 share the 50:14 first stage; L4 has a 48:16 first stage; the "+" ratios a 50:16 first stage.
const MK4_L1 = (50 / 14) * (19 / 25) * BEVEL
const MK4_L2 = (50 / 14) * (17 / 27) * BEVEL
const MK4_L3 = (50 / 14) * (16 / 28) * BEVEL
const MK4_L4 = (48 / 16) * (16 / 28) * BEVEL
const MK4_L1_PLUS = (50 / 16) * (19 / 25) * BEVEL
const MK4_L2_PLUS = (50 / 16) * (17 / 27) * BEVEL
const MK4_L3_PLUS = (50 / 16) * (16 / 28) * BEVEL

const MAXSWERVE_STEERING = 9424 / 203
const THRIFTY_STEERING = 25
const WCP_X2_STEERING = 12.1
const WCP_X2S_STEERING = 25.9
const WCP_X_STANDARD_STEERING = 396 / 35
const WCP_X_FLIPPED_STEERING = 468 / 35
const WCP_XS_STEERING = 165 / 4

export const MODULE_PRESETS: ModulePresetGroup[] = [
  {
    vendor: "SDS",
    presets: [
      preset("sds-mk4-l1", "MK4 L1", MK4_L1, 4, 12.8),
      preset("sds-mk4-l2", "MK4 L2", MK4_L2, 4, 12.8),
      preset("sds-mk4-l3", "MK4 L3", MK4_L3, 4, 12.8),
      preset("sds-mk4-l4", "MK4 L4", MK4_L4, 4, 12.8),
      preset("sds-mk4i-l1", "MK4i L1", MK4_L1, 4, 150 / 7),
      preset("sds-mk4i-l2", "MK4i L2", MK4_L2, 4, 150 / 7),
      preset("sds-mk4i-l3", "MK4i L3", MK4_L3, 4, 150 / 7),
      preset("sds-mk4n-l1plus", "MK4n L1+", MK4_L1_PLUS, 4, 18.75),
      preset("sds-mk4n-l2plus", "MK4n L2+", MK4_L2_PLUS, 4, 18.75),
      preset("sds-mk4n-l3plus", "MK4n L3+", MK4_L3_PLUS, 4, 18.75),
      preset("sds-mk4c-l1plus", "MK4c L1+", MK4_L1_PLUS, 4, 12.8),
      preset("sds-mk4c-l2plus", "MK4c L2+", MK4_L2_PLUS, 4, 12.8),
      preset("sds-mk4c-l3plus", "MK4c L3+", MK4_L3_PLUS, 4, 12.8),
      preset("sds-mk5i-r1", "MK5i R1", 7.03, 4, 26),
      preset("sds-mk5i-r2", "MK5i R2", 6.03, 4, 26),
      preset("sds-mk5i-r3", "MK5i R3", 5.27, 4, 26),
      preset("sds-mk5n-r1", "MK5n R1", 7.03, 4, 287 / 11),
      preset("sds-mk5n-r2", "MK5n R2", 6.03, 4, 287 / 11),
      preset("sds-mk5n-r3", "MK5n R3", 5.27, 4, 287 / 11),
    ],
  },
  {
    vendor: "REV",
    presets: [
      preset("rev-maxswerve-low", "MAXSwerve Low (12T)", (22 / 12) * BEVEL, 3, MAXSWERVE_STEERING),
      preset("rev-maxswerve-medium", "MAXSwerve Medium (13T)", (22 / 13) * BEVEL, 3, MAXSWERVE_STEERING),
      preset("rev-maxswerve-high", "MAXSwerve High (14T)", (22 / 14) * BEVEL, 3, MAXSWERVE_STEERING),
      preset("rev-maxswerve-extra-high-1", "MAXSwerve Extra High 1", (21 / 14) * BEVEL, 3, MAXSWERVE_STEERING),
      preset("rev-maxswerve-extra-high-2", "MAXSwerve Extra High 2", (20 / 14) * BEVEL, 3, MAXSWERVE_STEERING),
      preset("rev-maxswerve-extra-high-3", "MAXSwerve Extra High 3", (20 / 15) * BEVEL, 3, MAXSWERVE_STEERING),
      preset("rev-maxswerve-extra-high-4", "MAXSwerve Extra High 4", (20 / 16) * BEVEL, 3, MAXSWERVE_STEERING),
      preset("rev-maxswerve-extra-high-5", "MAXSwerve Extra High 5", (19 / 16) * BEVEL, 3, MAXSWERVE_STEERING),
    ],
  },
  {
    vendor: "Thrifty Bot",
    presets: [12, 13, 14].flatMap((pinion) =>
      [18, 16].map((bevelShaft) =>
        preset(
          `thrifty-swerve-${pinion}t-${bevelShaft}t`,
          `Thrifty Swerve ${pinion}T pinion, ${bevelShaft}T bevel shaft gear`,
          (36 / pinion) * (bevelShaft / 24) * BEVEL,
          4,
          THRIFTY_STEERING,
        ),
      ),
    ),
  },
  {
    vendor: "WCP",
    presets: [
      ...[
        ["X1", 18, 38],
        ["X2", 16, 38],
        ["X3", 16, 40],
        ["X4", 14, 40],
      ].flatMap(([set, secondStage, central]) =>
        [10, 11, 12].map((pinion) =>
          preset(
            `wcp-x2-${String(set).toLowerCase()}-${pinion}`,
            `Swerve X2 / X2i / X2t ${set}-${pinion}`,
            (54 / pinion) * (Number(secondStage) / Number(central)) * BEVEL,
            4,
            WCP_X2_STEERING,
          ),
        ),
      ),
      ...[
        ["X1", 30, [15, 16, 17]],
        ["X2", 28, [17, 18, 19]],
        ["X3", 26, [19, 20, 21]],
      ].flatMap(([set, spur, pinions]) =>
        (pinions as number[]).map((pinion) =>
          preset(
            `wcp-x2s-${String(set).toLowerCase()}-${pinion}`,
            `Swerve X2S / X2St ${set}-${pinion}`,
            (Number(spur) / pinion) * BEVEL,
            3.5,
            WCP_X2S_STEERING,
          ),
        ),
      ),
      ...[
        ["X1", 34, 20 / 26, [10, 11, 12]],
        ["X2", 34, 18 / 28, [10, 11, 12]],
        ["X3", 32, 18 / 28, [12, 13, 14]],
      ].flatMap(([set, firstStage, secondStage, pinions]) =>
        (pinions as number[]).map((pinion) =>
          preset(
            `wcp-x-${String(set).toLowerCase()}-${pinion}`,
            `Swerve X ${set}-${pinion}`,
            (Number(firstStage) / pinion) * Number(secondStage) * BEVEL,
            4,
            WCP_X_STANDARD_STEERING,
          ),
        ),
      ),
      ...[
        ["X1", 18, 28],
        ["X2", 16, 30],
        ["X3", 14, 32],
      ].flatMap(([set, secondStage, central]) =>
        [10, 11, 12].map((pinion) =>
          preset(
            `wcp-x-flipped-${String(set).toLowerCase()}-${pinion}`,
            `Swerve X Flipped ${set}-${pinion}`,
            (42 / pinion) * (Number(secondStage) / Number(central)) * BEVEL,
            4,
            WCP_X_FLIPPED_STEERING,
          ),
        ),
      ),
      ...[
        ["X1", 24, [12, 13, 14]],
        ["X2", 22, [14, 15, 16]],
      ].flatMap(([set, firstStage, pinions]) =>
        (pinions as number[]).map((pinion) =>
          preset(
            `wcp-xs-${String(set).toLowerCase()}-${pinion}`,
            `Swerve XS ${set}-${pinion}`,
            (Number(firstStage) / pinion) * BEVEL,
            3,
            WCP_XS_STEERING,
          ),
        ),
      ),
    ],
  },
]

const ALL_PRESETS = MODULE_PRESETS.flatMap((group) => group.presets)

export function findModulePreset(id: string): ModulePreset | undefined {
  return ALL_PRESETS.find((p) => p.id === id)
}

/** The preset these gearing values came from, or undefined if they have been changed since. */
export function matchModulePreset(driveGearRatio: number, wheelDiameter: number, angleGearRatio: number) {
  const close = (a: number, b: number) => Math.abs(a - b) < 1e-9
  return ALL_PRESETS.find(
    (p) =>
      close(p.driveGearRatio, driveGearRatio) &&
      close(p.wheelDiameter, wheelDiameter) &&
      close(p.angleGearRatio, angleGearRatio),
  )
}
