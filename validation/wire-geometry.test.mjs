// Validation: the general wire formula in js/geometry.js against published constants.
//
// Reference: Thread Check Inc., "Thread Measuring Wire Formulas", product catalogue p. 30
// (the sheet embedded in the original spreadsheet, tab "Formúlublað"). Those constants were
// published independently of this code, so agreement here checks the derivation itself.
import test from 'node:test';
import assert from 'node:assert/strict';
import { wireConstants, bestWire, angleFromTwoWires, angleUncertainty, overWires } from '../js/geometry.js';

const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} vs ${b}`);

// [thread form, included angle, best-wire factor, kG (multiplier on G), kP (multiplier on P)]
// kP for Unified/ISO is 0.866025 (written ".86603/n"); BA is written 1.13634p; Acme 1.933357.
const THREAD_CHECK = [
  ['Unified / ISO metric 60°', 60, 0.57735, 3.0, 0.86603],
  ['Whitworth 55°', 55, 0.56369, 3.16568, 0.96049],
  ['British Association 47½°', 47.5, 0.54626, 3.4829, 1.13634],
  ['Acme 29°', 29, 0.51645, 4.9939, 1.933357],
  ['40° worm', 40, 0.53208, null, null],
];

for (const [name, angle, best, kG, kP] of THREAD_CHECK) {
  test(`wire constants match Thread Check: ${name}`, () => {
    near(bestWire(1, angle), best, 6e-5, 'best wire factor');
    const c = wireConstants(angle);
    if (kG !== null) near(c.kG, kG, 6e-5, 'kG');
    if (kP !== null) near(c.kP, kP, 6e-6, 'kP');
  });
}

test('80° (Pg) constants follow the same geometry', () => {
  const c = wireConstants(80);
  near(c.kG, 1 + 1 / Math.sin((40 * Math.PI) / 180), 1e-12, 'kG');
  near(c.kG, 2.55572, 1e-5, 'kG value');
  near(bestWire(1, 80), 0.6527, 1e-4, 'best wire');
});

test('two wire sizes give back the flank angle exactly (noise-free)', () => {
  for (const angle of [29, 47.5, 55, 60, 80]) {
    const e = 9.0;
    const p = 1.5;
    const g1 = bestWire(p, angle) * 0.85;
    const g2 = bestWire(p, angle) * 1.25;
    const r = angleFromTwoWires(overWires(e, p, g1, angle), g1, overWires(e, p, g2, angle), g2);
    near(r.angle, angle, 1e-9, `angle ${angle}`);
  }
});

test('two-wire method separates 55° from 60° with ordinary bench equipment', () => {
  // A 1/2" BSW (12 TPI, P = 2.1167 mm) measured with two wire sizes 0.4 mm apart,
  // micrometer repeatability 2 µm, wires known to 1 µm: about ±0.4° on the angle (1σ),
  // while 55° and 60° are 5° apart.
  const s = angleUncertainty(55, 1.0, 1.4, 0.002, 0.001);
  assert.ok(s < 0.6, 'σ = ' + s);
  // Even sloppy readings (5 µm micrometer, 3 µm wires) keep 55° and 60° well apart.
  assert.ok(angleUncertainty(55, 1.0, 1.4, 0.005, 0.003) < 1.5);
});

test('impossible readings are refused', () => {
  assert.equal(angleFromTwoWires(10, 1, 10, 1), null);
  assert.equal(angleFromTwoWires(10, 1, 10.5, 1.5), null); // k = 1
});

import { wireRange } from '../js/geometry.js';
import { FORMS } from '../js/catalogue.js';

test('wire range from the profile reproduces the published 60° limits (0.505182·P and 1.010363·P)', () => {
  const r = wireRange(1, FORMS.iso);
  near(r.min, 0.505182, 2e-6, 'min');
  near(r.max, 1.010363, 2e-6, 'max');
});

test('Whitworth wire range: the rounded form narrows it, and the best wire sits inside', () => {
  // Worked out from the BS 84 profile (radius 0.137329·P); no published value to compare with,
  // so this checks the result is consistent rather than equal to a table.
  const r = wireRange(1, FORMS.whitworth);
  assert.ok(r.min < r.best && r.best < r.max, JSON.stringify(r));
  near(r.min, 0.5057, 1e-4, 'min'); // top of wire level with the rounded crest
  near(r.max, 0.8527, 1e-4, 'max'); // contact where the crest rounding starts
});

// ---- Asymmetric flanks: the S buttress thread (DIN 513, 3° and 30° from the radial) --------

/**
 * An independent check: put a wire in a 3°/30° groove by solving "touches both flanks"
 * numerically (bisection), then read the height of its top. No closed formula used.
 */
function wireByBisection(e, pitch, wire, a1deg, a2deg) {
  const a1 = (a1deg * Math.PI) / 180;
  const a2 = (a2deg * Math.PI) / 180;
  const r = wire / 2;
  // Pitch line at y = 0; the groove spans x = 0 … P/2 there and widens outwards (y up).
  // Left flank: x = −y·tan a1. Right flank: x = P/2 + y·tan a2.
  const gapRight = (cy) => {
    const cx = r / Math.cos(a1) - cy * Math.tan(a1); // distance r from the left flank
    return (pitch / 2 + cy * Math.tan(a2) - cx) * Math.cos(a2) - r; // distance from the right one, minus r
  };
  let lo = -10 * pitch;
  let hi = 10 * pitch;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (gapRight(mid) > 0) hi = mid; else lo = mid;
  }
  return e + 2 * ((lo + hi) / 2 + r);
}

test('S thread: the asymmetric wire formula agrees with a wire placed by bisection', () => {
  for (const [pitch, wire] of [[2, 1.0], [7, 3.8], [10, 5.5], [12, 6.0]]) {
    const e = 40;
    near(overWires(e, pitch, wire, [3, 30]), wireByBisection(e, pitch, wire, 3, 30), 1e-9, `P ${pitch}, G ${wire}`);
  }
  // And it falls back to the symmetric formula when both flanks are equal.
  near(overWires(10, 1.5, 0.866, [30, 30]), overWires(10, 1.5, 0.866, 60), 1e-12, 'symmetric case');
});

test('S thread: best wire 0.5431·P, as in Thread Check, and it touches the 30° flank on the pitch line', () => {
  near(bestWire(1, [3, 30]), 0.5431, 5e-5, 'best wire factor');
  const r = bestWire(1, [3, 30]) / 2;
  const { kG, kP } = wireConstants([3, 30]);
  const centre = r * (kG - 1); // above the sharp groove bottom
  near(centre - r * Math.sin(Math.PI / 6), 0.5 * kP, 1e-9, 'contact height = pitch line');
});

test('S thread: the profile numbers match DIN 513 (profile width w, root position)', () => {
  const t = Math.tan((3 * Math.PI) / 180) + Math.tan((30 * Math.PI) / 180);
  // Thread width at the crest: w = 0.26384·P (DIN 513-1).
  near(0.5 - 0.375 * t, 0.26384, 1e-5, 'w');
  // The root radius R = 0.12427·P, tangent to both flanks, bottoms out at h3 = 0.86777·P below the crest.
  const R = 0.124271;
  const { kG } = wireConstants([3, 30]);
  const bottom = 0.5 / t - R * (kG - 1 - 1); // pitch line to the bottom of the rounding
  near(0.375 + bottom, 0.867767, 2e-5, 'h3');
});

test('S thread: two wires give the equivalent angle of about 34° (ratio 4.4237)', () => {
  const p = 7;
  const m1 = overWires(34.75, p, 3.5, [3, 30]);
  const m2 = overWires(34.75, p, 4.2, [3, 30]);
  const r = angleFromTwoWires(m1, 3.5, m2, 4.2);
  near(r.k, 4.42365, 1e-4, 'ratio');
  near(r.angle, 33.966, 2e-3, 'equivalent angle');
});

// ---- One wire, anvil on the thread tops ------------------------------------------------------
// Checked without the wire formula: a wire is dropped into a modelled groove point by point
// (it settles where it first touches the profile), and the anvil rests on the flat crests on
// the other side. If the one-wire maths in geometry.js is right, it gets the angle back.

/** Height of the wire's top above the axis, found by brute force over the profile. */
function wireTop(G, P, E, D, angle) {
  const t = Math.tan(((angle / 2) * Math.PI) / 180);
  const surface = (x) => Math.min(E / 2 - (P / 4 - Math.abs(x)) / t, D / 2); // V groove, crests cut flat at D
  let centre = -Infinity;
  const N = 200000;
  for (let i = 0; i <= N; i++) {
    const x = (-G / 2) + (G * i) / N;
    centre = Math.max(centre, surface(x) + Math.sqrt(Math.max(0, (G / 2) ** 2 - x * x)));
  }
  return centre + G / 2;
}

test('one wire against the crests gives the angle back (modelled groove, no wire formula)', () => {
  for (const [angle, P, E, D, g1, g2] of [
    [60, 1.5, 9.026, 10, 0.8, 1.0],      // M10 x 1.5
    [55, 2.1167, 11.43, 12.7, 1.0, 1.4], // 1/2" BSW
    [30, 4, 18, 20, 1.8, 2.4],           // Tr 20 x 4
  ]) {
    const one = (g) => wireTop(g, P, E, D, angle) + D / 2; // spindle on the wire, anvil on the crests
    const r = angleFromTwoWires(one(g1), g1, one(g2), g2, 1);
    near(r.angle, angle, 0.01, `one-wire angle ${angle}°`);
    // The same model over three wires agrees with the published formula.
    near(2 * wireTop(g1, P, E, D, angle), overWires(E, P, g1, angle), 1e-5, `three-wire ${angle}°`);
  }
});

test('one wire is less precise than three, but still tells 55° from 60°', () => {
  const three = angleUncertainty(55, 1.0, 1.4, 0.002, 0.001, 3);
  const one = angleUncertainty(55, 1.0, 1.4, 0.002, 0.001, 1);
  assert.ok(one > three, `${one} > ${three}`);
  assert.ok(one < 0.7, 'σ = ' + one); // the ±0.6° in the hint
  assert.ok(angleUncertainty(55, 1.0, 1.8, 0.002, 0.001, 1) < 0.35); // the ±0.3° in the hint
});
