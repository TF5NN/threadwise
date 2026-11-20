// Wire geometry for any symmetric thread with straight flanks, whatever its angle.
// The 60° numbers in threads.js are this with α = 60°.
//
// For a symmetric thread of included angle α and pitch P, measured over wires of diameter G:
//   M = E + G·(1 + 1/sin(α/2)) − (P/2)·cot(α/2)
// where E is the pitch (effective) diameter. Lead angle is left out, as in the usual tables.

const rad = (deg) => (deg * Math.PI) / 180;

/** The two constants in M = E + kG·G − kP·P for an included angle in degrees. */
export function wireConstants(angle) {
  const half = rad(angle / 2);
  return { kG: 1 + 1 / Math.sin(half), kP: 0.5 / Math.tan(half) };
}

/** Best wire (touches the flanks at the pitch diameter): G = P / (2·cos(α/2)). */
export const bestWire = (pitch, angle) => pitch / (2 * Math.cos(rad(angle / 2)));

/** Over-wire measurement for a pitch diameter. */
export function overWires(e, pitch, wire, angle) {
  const { kG, kP } = wireConstants(angle);
  return e + kG * wire - kP * pitch;
}

/** Pitch diameter behind an over-wire measurement. */
export function pitchDiameterFrom(m, pitch, wire, angle) {
  const { kG, kP } = wireConstants(angle);
  return m - kG * wire + kP * pitch;
}

/**
 * The included flank angle from two measurements over two different wire sizes on the same
 * spot of the same thread. M2 − M1 = (G2 − G1)·(1 + 1/sin(α/2)), so the pitch diameter and the
 * pitch drop out. Returns null when the readings cannot come from a real thread.
 * @returns {{ angle: number, k: number } | null} angle in degrees
 */
export function angleFromTwoWires(m1, g1, m2, g2) {
  if (g1 === g2) return null;
  const k = (m2 - m1) / (g2 - g1);
  if (!(k > 2)) return null; // k = 2 would be a flat (180°) thread
  return { angle: 2 * (Math.asin(1 / (k - 1)) * 180) / Math.PI, k };
}

/**
 * How precisely two-wire readings pin down the angle: one standard deviation, in degrees,
 * for a given spread of micrometer readings (σM) and of wire sizes (σG), all in mm.
 */
export function angleUncertainty(angle, g1, g2, sigmaM, sigmaG) {
  const { kG: k } = wireConstants(angle);
  const dG = Math.abs(g2 - g1);
  const sigmaK = Math.sqrt(2 * sigmaM ** 2 + 2 * k ** 2 * sigmaG ** 2) / dG;
  const half = rad(angle / 2);
  const dHalf = sigmaK / ((k - 1) ** 2 * Math.cos(half)); // from sin(α/2) = 1/(k − 1)
  return (2 * dHalf * 180) / Math.PI;
}
