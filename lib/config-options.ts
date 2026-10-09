// Shared with the print worksheet's reference tables - keep these as the only place
// the valid dropdown values are listed, so the interactive form and the printout can
// never drift apart.
export const MOTOR_TYPES = [
  "talonfx_krakenx44",
  "talonfx_krakenx60",
  "talonfx_falcon",
  "talonfxs_neo",
  "talonfxs_neo2",
  "talonfxs_neo550",
  "talonfxs_vortex",
  "talonfxs_pulsar",
  "sparkmax_neo",
  "sparkmax_neo2",
  "sparkmax_neo550",
  "sparkmax_vortex",
  "sparkmax_pulsar",
  "sparkmax_minion",
  "talonfxs_minion",
  "sparkflex_neo",
  "sparkflex_neo2",
  "sparkflex_neo550",
  "sparkflex_vortex",
  "sparkflex_minion",
  "sparkflex_pulsar",
  "nova_neo",
  "nova_neo2",
  "nova_neo550",
  "nova_vortex",
  "nova_minion",
  "nova_pulsar",
]

export const ENCODER_TYPES = [
  "revthroughbore_attached",
  "revthroughbore_dio",
  "splineencoder_can",
  "cancoder_can",
  "canandmag_attached",
  "canandmag_dio",
  "canandmag_can",
  "srxmag_attached",
  "srxmag_analog",
  "andymarkhexbore_attached",
  "andymarkhexbore_dio",
  "andymarkhexbore_analog",
  "andymarkhexbore_can",
  "thrifty_attached",
  "thrifty_analog",
  "analog5v_attached",
  "analog_attached",
  "dutycycle_attached",
]

export const GYRO_TYPES = ["navx3_can", "pigeon2_can", "canandgyro_can", "systemcore_internal", "custom"]

export const GYRO_AXES = ["yaw", "pitch", "roll"]

export function isNova(motorType: string) {
  return motorType.startsWith("nova_")
}

// CTRE devices can also be on a CANivore, given by its name (or serial number) instead of a CAN bus number.
export function isCTRE(deviceType: string) {
  return /^(talonfx|talonfxs|cancoder|pigeon2)_/.test(deviceType)
}

// YAGSL reads every device's canbus the same way: empty for the Systemcore CAN bus can_s0, or the bus number, such as
// "1" for can_s1 ("5" to "24" are the Motioncore CAN buses can_d0 to can_d19). Only CTRE devices take anything else.
export function canbusPlaceholder(deviceType: string) {
  return isCTRE(deviceType) ? "Default (can_s0), bus number, or CANivore name" : "Default (can_s0), or bus number"
}

export function canbusError(deviceType: string, canbus: string): string | null {
  const value = canbus.trim()
  if (value === "") return null
  if (/^\d+$/.test(value)) {
    if (/^0\d/.test(value)) return `Write the bus number without leading zeros, such as "${value.replace(/^0+/, "") || "0"}".`
    if (value.length > 2 || Number(value) > 24) {
      return `CAN bus ${value} does not exist. The Systemcore CAN buses are 0 to 4 (can_s0 to can_s4).`
    }
    return null
  }
  if (isCTRE(deviceType)) return null
  return `Use the CAN bus number, such as "1" for can_s1, or leave it empty for can_s0.`
}

// Warns about attached absolute encoders the angle motor controller can't read: the Thrifty 10 pin encoder only
// plugs into a Nova, and the Nova has no 5V analog input.
export function attachedEncoderWarning(encoderType: string, angleMotorType: string): string | null {
  if (encoderType === "thrifty_attached" && !isNova(angleMotorType)) {
    return "thrifty_attached needs a Thrifty Nova angle motor."
  }
  if (encoderType === "analog5v_attached" && isNova(angleMotorType)) {
    return "A Thrifty Nova can't read analog5v_attached encoders. Use analog_attached instead."
  }
  return null
}
