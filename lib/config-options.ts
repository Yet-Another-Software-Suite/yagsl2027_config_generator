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

// A motor type is "<controller>_<motor>". The form picks the two separately; both lists come from MOTOR_TYPES.
const MOTOR_CONTROLLER_NAMES: Record<string, string> = {
  talonfx: "TalonFX",
  talonfxs: "TalonFXS",
  sparkmax: "SPARK MAX",
  sparkflex: "SPARK Flex",
  nova: "Thrifty Nova",
}

const MOTOR_NAMES: Record<string, string> = {
  krakenx44: "Kraken X44",
  krakenx60: "Kraken X60",
  falcon: "Falcon 500",
  neo: "NEO",
  neo2: "NEO 2.0",
  neo550: "NEO 550",
  vortex: "NEO Vortex",
  pulsar: "Thrifty Pulsar",
  minion: "Minion",
}

export function splitMotorType(motorType: string) {
  const i = motorType.indexOf("_")
  return { controller: motorType.slice(0, i), motor: motorType.slice(i + 1) }
}

/** Motor controllers in MOTOR_TYPES, in the order they first appear. */
export const MOTOR_CONTROLLERS = [...new Set(MOTOR_TYPES.map((type) => splitMotorType(type).controller))]

/** Motors the motor controller drives, in MOTOR_TYPES order. */
export function motorsFor(controller: string) {
  return MOTOR_TYPES.map(splitMotorType)
    .filter((t) => t.controller === controller)
    .map((t) => t.motor)
}

export const motorControllerName = (controller: string) => MOTOR_CONTROLLER_NAMES[controller] ?? controller
export const motorName = (motor: string) => MOTOR_NAMES[motor] ?? motor

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

// An encoder type is "<encoder>_<connection>". The form picks the connection, then the encoder; both lists come from
// ENCODER_TYPES. SmartIO takes digital (dio) and analog wiring, so an encoder that has both is listed twice there.
export const ENCODER_CONNECTIONS = [
  { id: "smartio", name: "SmartIO", suffixes: ["dio", "analog"] },
  { id: "attached", name: "Azimuth Motor Controller", suffixes: ["attached"] },
  { id: "can", name: "CAN", suffixes: ["can"] },
]

const ENCODER_NAMES: Record<string, string> = {
  revthroughbore: "REV Through Bore Encoder",
  splineencoder: "REV Spline Encoder",
  cancoder: "CTRE CANcoder",
  canandmag: "Redux Canandmag",
  srxmag: "CTRE Mag Encoder (SRX Mag)",
  andymarkhexbore: "AndyMark Hex Bore Encoder",
  thrifty: "Thrifty Absolute Encoder",
  analog5v: "Generic analog, 5 V",
  analog: "Generic analog, 3.3 V",
  dutycycle: "Generic duty cycle",
}

function splitEncoderType(encoderType: string) {
  const i = encoderType.lastIndexOf("_")
  return { encoder: encoderType.slice(0, i), suffix: encoderType.slice(i + 1) }
}

/** The connection id (from ENCODER_CONNECTIONS) of an encoder type. */
export function encoderConnection(encoderType: string) {
  const { suffix } = splitEncoderType(encoderType)
  return ENCODER_CONNECTIONS.find((c) => c.suffixes.includes(suffix))?.id ?? ENCODER_CONNECTIONS[0].id
}

/** Encoder types on this connection, in ENCODER_TYPES order. */
export function encodersFor(connection: string) {
  return ENCODER_TYPES.filter((type) => encoderConnection(type) === connection)
}

/** The encoder's name, with its wiring when it can be wired to SmartIO both ways. */
export function encoderName(encoderType: string) {
  const { encoder, suffix } = splitEncoderType(encoderType)
  const name = ENCODER_NAMES[encoder] ?? encoder
  const bothWays = ENCODER_TYPES.includes(`${encoder}_dio`) && ENCODER_TYPES.includes(`${encoder}_analog`)
  if (bothWays && suffix === "dio") return `${name} (digital)`
  if (bothWays && suffix === "analog") return `${name} (analog)`
  return name
}

/**
 * The encoder type after switching to another connection: the same encoder if it can be wired that way (digital
 * before analog on SmartIO), else the connection's first encoder.
 */
export function switchEncoderConnection(encoderType: string, connection: string) {
  const { encoder } = splitEncoderType(encoderType)
  const options = encodersFor(connection)
  return options.find((type) => splitEncoderType(type).encoder === encoder) ?? options[0]
}

export const GYRO_TYPES = ["navx3_can", "pigeon2_can", "canandgyro_can", "navx3_usb", "systemcore_internal", "custom"]

// A gyro type is "<gyro>_<connection>", or "custom" for a gyro the robot code supplies. The form picks the connection,
// then the gyro; both lists come from GYRO_TYPES.
export const GYRO_CONNECTIONS = [
  { id: "can", name: "CAN" },
  { id: "usb", name: "USB" },
  { id: "internal", name: "SystemCore" },
  { id: "custom", name: "Custom" },
]

const GYRO_NAMES: Record<string, string> = {
  navx3_can: "Studica NavX3",
  pigeon2_can: "CTRE Pigeon 2.0",
  canandgyro_can: "Redux Canandgyro",
  navx3_usb: "Studica NavX3",
  systemcore_internal: "SystemCore built-in IMU",
  custom: "Your own gyro, set in code",
}

/** The connection id (from GYRO_CONNECTIONS) of a gyro type. */
export function gyroConnection(gyroType: string) {
  return gyroType === "custom" ? "custom" : gyroType.slice(gyroType.lastIndexOf("_") + 1)
}

/** Gyro types on this connection, in GYRO_TYPES order. */
export function gyrosFor(connection: string) {
  return GYRO_TYPES.filter((type) => gyroConnection(type) === connection)
}

/** Systemcore USB ports a USB gyro can plug into: its channel, 0 for USB0. */
export const USB_PORTS = [0, 1, 2, 3]

export const gyroName = (gyroType: string) => GYRO_NAMES[gyroType] ?? gyroType

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
    return "The Thrifty Absolute Encoder only plugs into a Thrifty Nova angle motor controller."
  }
  if (encoderType === "analog5v_attached" && isNova(angleMotorType)) {
    return "A Thrifty Nova can't read a 5 V analog encoder. Use Generic analog, 3.3 V instead."
  }
  return null
}
