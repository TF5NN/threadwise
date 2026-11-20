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
