// Shared with the print worksheet's reference tables - keep these as the only place
// the valid dropdown values are listed, so the interactive form and the printout can
// never drift apart.
export const MOTOR_TYPES = [
  "talonfx_krakenx44",
  "talonfx_krakenx60",
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

export const GYRO_TYPES = ["navx3_can", "pigeon2_can", "canandgyro_can", "systemcore_internal"]

export const GYRO_AXES = ["yaw", "pitch", "roll"]
