// The Quick Start Guide's Auto gains: a characterization like WPILib's SysId, run from the page.
//
// The motors are driven at a slowly rising voltage (quasistatic) and at a voltage step (dynamic) in each direction, and
// V = kS·sgn(v) + kV·v + kA·a is fit to what they do by least squares. The feedback gains then come from an LQR on the
// fitted system, discretized at the period the closed loop runs at, as SysId's feedback analysis does.

/** One measurement: when it was taken, the voltage applied, and how fast the mechanism moved. */
export interface Sample {
  /** Seconds. */
  t: number
  /** Volts. */
  voltage: number
  /** Mechanism rotations per second. */
  velocity: number
}

export interface Feedforward {
  ks: number
  kv: number
  ka: number
  /** How much of the voltage the fit explains, 0 to 1. */
  r2: number
  /** How many samples the fit used. */
  samples: number
}

/** Below this speed, in rotations per second, a sample is treated as not moving and left out of the fit. */
const MOVING = 0.05

/**
 * Fit V = kS·sgn(v) + kV·v + kA·a to the samples of each test. The acceleration is the central difference of the
 * velocity, so each test's samples must be in time order and from one run.
 */
export function fitFeedforward(tests: Sample[][]): Feedforward | null {
  const rows: { x: [number, number, number]; y: number }[] = []
  for (const test of tests) {
    for (let i = 1; i < test.length - 1; i++) {
      const prev = test[i - 1]
      const next = test[i + 1]
      const s = test[i]
      const dt = next.t - prev.t
      if (dt <= 0 || Math.abs(s.velocity) < MOVING) continue
      const a = (next.velocity - prev.velocity) / dt
      rows.push({ x: [Math.sign(s.velocity), s.velocity, a], y: s.voltage })
    }
  }
  if (rows.length < 10) return null
  // Normal equations, XᵀX β = Xᵀy.
  const xtx = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ]
  const xty = [0, 0, 0]
  for (const { x, y } of rows) {
    for (let r = 0; r < 3; r++) {
      xty[r] += x[r] * y
      for (let c = 0; c < 3; c++) xtx[r][c] += x[r] * x[c]
    }
  }
  const beta = solve3(xtx, xty)
  if (!beta) return null
  const mean = rows.reduce((sum, r) => sum + r.y, 0) / rows.length
  let ssRes = 0
  let ssTot = 0
  for (const { x, y } of rows) {
    const fit = beta[0] * x[0] + beta[1] * x[1] + beta[2] * x[2]
    ssRes += (y - fit) ** 2
    ssTot += (y - mean) ** 2
  }
  return { ks: beta[0], kv: beta[1], ka: beta[2], r2: ssTot > 0 ? 1 - ssRes / ssTot : 0, samples: rows.length }
}

function solve3(a: number[][], b: number[]): number[] | null {
  const m = a.map((row, i) => [...row, b[i]])
  for (let col = 0; col < 3; col++) {
    let pivot = col
    for (let r = col + 1; r < 3; r++) if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r
    if (Math.abs(m[pivot][col]) < 1e-12) return null
    ;[m[col], m[pivot]] = [m[pivot], m[col]]
    for (let r = 0; r < 3; r++) {
      if (r === col) continue
      const f = m[r][col] / m[col][col]
      for (let c = col; c < 4; c++) m[r][c] -= f * m[col][c]
    }
  }
  return [m[0][3] / m[0][0], m[1][3] / m[1][1], m[2][3] / m[2][2]]
}

/** The largest voltage the LQR expects the feedback to use, as SysId's default. */
const MAX_EFFORT_VOLTS = 7

/**
 * The proportional gain of a velocity loop, in volts per rotation per second, from an LQR on the fitted system
 * dv/dt = -kV/kA·v + 1/kA·u, discretized at the closed loop's period.
 *
 * @param velocityTolerance The velocity error, in rotations per second, worth the maximum effort.
 * @param delay How long the measurement takes to arrive, in seconds, such as the velocity filter's delay.
 */
export function velocityGain(ff: Feedforward, period: number, velocityTolerance: number, delay = 0): number {
  const { kv, ka } = ff
  if (!(kv > 0) || !(period > 0)) return 0
  // With no measurable kA the velocity follows the voltage at once: no feedback to work out.
  if (!(ka > 1e-6)) return 0
  const e = Math.exp((-kv / ka) * period)
  const a = e
  const b = (1 - e) / kv
  const q = 1 / velocityTolerance ** 2
  const r = 1 / MAX_EFFORT_VOLTS ** 2
  // Scalar discrete Riccati equation, iterated to convergence.
  let p = q
  for (let i = 0; i < 1_000_000; i++) {
    const next = q + a * a * p - (a * b * p) ** 2 / (r + b * b * p)
    if (Math.abs(next - p) <= 1e-12 * Math.max(1, Math.abs(p))) {
      p = next
      break
    }
    p = next
  }
  const k = (b * p * a) / (r + b * b * p)
  // A measurement that arrives late needs less feedback: compensate for the delay, as SysId does,
  // with K·(A − BK)^(delay / period).
  return k * Math.pow(a - b * k, Math.round(delay / period))
}

/**
 * The proportional and derivative gains of a position loop, in volts per rotation and volts per rotation per second,
 * from an LQR on the fitted system with states position and velocity, discretized at the closed loop's period.
 *
 * @param positionTolerance The position error, in rotations, worth the maximum effort.
 * @param velocityTolerance The velocity error, in rotations per second, worth the maximum effort.
 * @param delay How long the measurement takes to arrive, in seconds, such as the velocity filter's delay.
 */
export function positionGains(
  ff: Feedforward,
  period: number,
  positionTolerance: number,
  velocityTolerance: number,
  delay = 0,
): { kp: number; kd: number } {
  const { kv, ka } = ff
  if (!(kv > 0) || !(period > 0)) return { kp: 0, kd: 0 }
  let ad: number[][]
  let bd: number[]
  if (ka > 1e-6) {
    const k = kv / ka
    const e = Math.exp(-k * period)
    ad = [
      [1, (1 - e) / k],
      [0, e],
    ]
    bd = [(period - (1 - e) / k) / kv, (1 - e) / kv]
  } else {
    // The velocity follows the voltage at once: position integrates u / kV.
    ad = [
      [1, 0],
      [0, 0],
    ]
    bd = [period / kv, 1 / kv]
  }
  const q = [1 / positionTolerance ** 2, 1 / velocityTolerance ** 2]
  const r = 1 / MAX_EFFORT_VOLTS ** 2
  // 2×2 discrete Riccati equation, P = Q + AᵀPA − AᵀPB (R + BᵀPB)⁻¹ BᵀPA, iterated to convergence.
  let p = [
    [q[0], 0],
    [0, q[1]],
  ]
  for (let i = 0; i < 2_000_000; i++) {
    const pa = mul(p, ad)
    const atpa = mul(transpose(ad), pa)
    const pb = [p[0][0] * bd[0] + p[0][1] * bd[1], p[1][0] * bd[0] + p[1][1] * bd[1]]
    const btpb = bd[0] * pb[0] + bd[1] * pb[1]
    // BᵀPA, a row.
    const btpa = [bd[0] * pa[0][0] + bd[1] * pa[1][0], bd[0] * pa[0][1] + bd[1] * pa[1][1]]
    const s = r + btpb
    const next = [
      [q[0] + atpa[0][0] - (btpa[0] * btpa[0]) / s, atpa[0][1] - (btpa[0] * btpa[1]) / s],
      [atpa[1][0] - (btpa[1] * btpa[0]) / s, q[1] + atpa[1][1] - (btpa[1] * btpa[1]) / s],
    ]
    const change = Math.max(...next.flat().map((v, j) => Math.abs(v - p.flat()[j])))
    p = next
    if (change <= 1e-12 * Math.max(1, ...p.flat().map(Math.abs))) break
  }
  const pa = mul(p, ad)
  const pb = [p[0][0] * bd[0] + p[0][1] * bd[1], p[1][0] * bd[0] + p[1][1] * bd[1]]
  const s = r + bd[0] * pb[0] + bd[1] * pb[1]
  let kp = (bd[0] * pa[0][0] + bd[1] * pa[1][0]) / s
  let kd = (bd[0] * pa[0][1] + bd[1] * pa[1][1]) / s
  // A measurement that arrives late needs less feedback: compensate for the delay, as SysId does,
  // with K·(A − BK)^(delay / period).
  const closed = [
    [ad[0][0] - bd[0] * kp, ad[0][1] - bd[0] * kd],
    [ad[1][0] - bd[1] * kp, ad[1][1] - bd[1] * kd],
  ]
  let power = [
    [1, 0],
    [0, 1],
  ]
  for (let i = 0; i < Math.round(delay / period); i++) power = mul(power, closed)
  ;[kp, kd] = [kp * power[0][0] + kd * power[1][0], kp * power[0][1] + kd * power[1][1]]
  return { kp, kd }
}

function mul(a: number[][], b: number[][]): number[][] {
  return [
    [a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]],
    [a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]],
  ]
}

function transpose(a: number[][]): number[][] {
  return [
    [a[0][0], a[1][0]],
    [a[0][1], a[1][1]],
  ]
}
