// Wire geometry for any thread with straight flanks, whatever its angle.
// The 60° numbers in threads.js are this with α = 60°.
//
// For a symmetric thread of included angle α and pitch P, measured over wires of diameter G:
//   M = E + G·(1 + 1/sin(α/2)) − (P/2)·cot(α/2)
// where E is the pitch (effective) diameter. Lead angle is left out, as in the usual tables.
//
// Asymmetric threads (the S buttress thread, flanks 3° and 30° from the radial) pass the angle
// as the two flank angles, [a1, a2]. The wire still sits on the bisector of the groove, so:
//   M = E + G·(1 + cos((a1 − a2)/2) / sin((a1 + a2)/2)) − P / (tan a1 + tan a2)
// With a1 = a2 = α/2 this is the symmetric formula; for 3°/30° it is the "unsymmetrical"
// formula in Thread Check's wire tables (validation/wire-geometry.test.mjs).

const rad = (deg) => (deg * Math.PI) / 180;

/** The two flank angles from the radial, in degrees: [α/2, α/2] for a symmetric thread. */
export const flanksOf = (angle) => (Array.isArray(angle) ? angle : [angle / 2, angle / 2]);

/** The two constants in M = E + kG·G − kP·P, for an included angle or two flank angles. */
export function wireConstants(angle) {
  const [a1, a2] = flanksOf(angle).map(rad);
  return { kG: 1 + Math.cos((a1 - a2) / 2) / Math.sin((a1 + a2) / 2), kP: 1 / (Math.tan(a1) + Math.tan(a2)) };
}

/**
 * Best wire. Symmetric: G = P / (2·cos(α/2)), touching both flanks at the pitch diameter.
 * Asymmetric: no wire can touch both flanks at the pitch line, so the usual choice (Thread
 * Check) is the wire that touches the shallower flank there: P·tan((a1+a2)/2)·sec(a_max)/(tan a1 + tan a2),
 * 0.5431·P for 3°/30°.
 */
export function bestWire(pitch, angle) {
  if (!Array.isArray(angle)) return pitch / (2 * Math.cos(rad(angle / 2)));
  const [a1, a2] = angle.map(rad);
  return (pitch * Math.tan((a1 + a2) / 2)) / Math.cos(Math.max(a1, a2)) / (Math.tan(a1) + Math.tan(a2));
}

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
 *
 * wires = 1 is the one-wire way: one wire in a groove, the micrometer's anvil on the thread
 * tops on the other side. Each side of a three-wire reading is half of it, so the one-wire
 * reading is (crest diameter + three-wire reading) / 2. The crests stay put between the two
 * readings and drop out too, leaving M2 − M1 = (G2 − G1)·(1 + 1/sin(α/2)) / 2.
 * @returns {{ angle: number, k: number } | null} angle in degrees; k is the three-wire ratio
 */
export function angleFromTwoWires(m1, g1, m2, g2, wires = 3) {
  if (g1 === g2) return null;
  const k = ((wires === 1 ? 2 : 1) * (m2 - m1)) / (g2 - g1);
  if (!(k > 2)) return null; // k = 2 would be a flat (180°) thread
  return { angle: 2 * (Math.asin(1 / (k - 1)) * 180) / Math.PI, k };
}

/** The symmetric angle that gives the same two-wire ratio (≈ 34° for the 3°/30° S thread). */
export function equivalentAngle(angle) {
  const { kG } = wireConstants(angle);
  return (2 * Math.asin(1 / (kG - 1)) * 180) / Math.PI;
}

/**
 * How precisely two-wire readings pin down the angle: one standard deviation, in degrees,
 * for a given spread of micrometer readings (σM) and of wire sizes (σG), all in mm.
 * With one wire the readings move half as much, so micrometer errors count double; wire
 * errors count the same.
 */
export function angleUncertainty(angle, g1, g2, sigmaM, sigmaG, wires = 3) {
  const { kG: k } = wireConstants(angle);
  const dG = Math.abs(g2 - g1);
  const f = wires === 1 ? 2 : 1;
  const sigmaK = Math.sqrt(2 * (f * sigmaM) ** 2 + 2 * k ** 2 * sigmaG ** 2) / dG;
  const half = rad(angle / 2);
  const dHalf = sigmaK / ((k - 1) ** 2 * Math.cos(half)); // from sin(α/2) = 1/(k − 1)
  return (2 * dHalf * 180) / Math.PI;
}

/**
 * The smallest and largest wire that measure correctly, for a thread profile.
 * - Smallest: the top of the wire must stand above the crest, or the micrometer touches the
 *   crest instead: (G/2)·(1 + 1/sin(α/2)) ≥ crestTop.
 * - Largest: the wire must touch the straight part of the flank, not the crest rounding:
 *   contact height (G/2)·cos²(α/2)/sin(α/2) ≤ flankTop.
 * crestTop and flankTop are heights above the sharp bottom of the groove, as multiples of P.
 */
export function wireRange(pitch, { angle, crestTop, flankTop, rootRadius = 0 }) {
  const [a1, a2] = flanksOf(angle).map(rad);
  // Height of the wire centre above the sharp groove bottom, per unit of wire radius.
  const centre = Math.cos((a1 - a2) / 2) / Math.sin((a1 + a2) / 2);
  // The wire touches the steeper flank (smaller angle) highest up: that contact must stay on
  // the straight flank. For a symmetric thread this is (G/2)·cos²(α/2)/sin(α/2).
  const contactHigh = centre - Math.sin(Math.min(a1, a2));
  return {
    // A rounded root (the S thread's R) also needs the wire to be at least as big as the
    // rounding, or it sits on the radius instead of the flanks.
    min: Math.max((2 * crestTop * pitch) / (1 + centre), 2 * rootRadius * pitch),
    best: bestWire(pitch, angle),
    max: (2 * flankTop * pitch) / contactHigh,
  };
}
