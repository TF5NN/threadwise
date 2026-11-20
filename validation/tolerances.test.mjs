// Validation of tolerances for Measure and Make: cross-source checks and published limits.
import test from 'node:test';
import assert from 'node:assert/strict';
import { limits, isoInternal, isoTd } from '../js/tolerances.js';
import { CATALOGUE } from '../js/catalogue.js';
import { ES_TABLE } from '../js/iso965-data.js';
import { EI_G_TABLE, ES_CHECK, TD1_TABLE, TD2_INT_TABLE } from '../js/data/iso965-internal.js';
import { nearestPreferred } from '../js/threads.js';

const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} vs ${b} (±${tol})`);
const row = (name) => CATALOGUE.find((r) => r.name === name);

test('two independent copies of ISO 965-1 agree: internal-table source vs the spreadsheet (es e/f/g)', () => {
  for (const [p, e, f, g] of ES_CHECK) {
    const s = ES_TABLE.find((r) => r[0] === p);
    assert.deepEqual([s[1], s[2], s[3]], [e, f, g], `pitch ${p}`);
  }
});

test('EI for position G equals −es for position g at every pitch (ISO 965-1 uses the same values)', () => {
  for (const [p, ei] of EI_G_TABLE) {
    const s = ES_TABLE.find((r) => r[0] === p);
    if (s) assert.equal(ei, -s[3], `pitch ${p}`);
  }
});

// Widely published limits for 6H nuts and 6g bolts (ISO 965-2), in mm.
const NUT_6H = [
  ['M5', 4.48, 4.605, 4.134, 4.334],
  ['M6', 5.35, 5.5, 4.917, 5.153],
  ['M8', 7.188, 7.348, 6.647, 6.912],
  ['M10', 9.026, 9.206, 8.376, 8.676],
  ['M12', 10.863, 11.063, 10.106, 10.441],
];
for (const [n, d2min, d2max, d1min, d1max] of NUT_6H) {
  test(`6H internal limits match published values: ${n}`, () => {
    const t = limits(row(n), 'int', '6H');
    near(t.d2.min, d2min, 0.0006, 'D2 min');
    near(t.d2.max, d2max, 0.0006, 'D2 max');
    near(t.minor.min, d1min, 0.0006, 'D1 min');
    near(t.minor.max, d1max, 0.0006, 'D1 max');
  });
}

const BOLT_6G_MAJOR = [['M6', 5.794, 5.974], ['M8', 7.76, 7.972], ['M10', 9.732, 9.968], ['M12', 11.701, 11.966]];
for (const [n, min, max] of BOLT_6G_MAJOR) {
  test(`6g major-diameter limits from the ISO formula match published values: ${n}`, () => {
    const t = limits(row(n), 'ext', '6g');
    near(t.major.max, max, 0.0006, 'max');
    near(t.major.min, min, 0.0006, 'min');
  });
}

test('ISO formula for Td matches the table values it should (grade 6)', () => {
  // ISO 965-1 Td grade 6 (µm) for common pitches.
  for (const [p, td] of [[0.5, 106], [0.8, 150], [1, 180], [1.25, 212], [1.5, 236], [1.75, 265], [2, 280], [3, 375]]) {
    assert.equal(Math.round(isoTd(p, 6) * 1000), td, `P ${p}`);
  }
});

test('ISO formulas fill table gaps sensibly: how often do they agree with the tables?', () => {
  // Not a pass/fail on equality: the standard itself says its tables are rounded from the
  // formulas. We require close agreement (within one preferred-number step) everywhere and
  // record the exact-match rate in validation/README.md.
  let exact = 0;
  let total = 0;
  const factor = { 4: 0.63, 5: 0.8, 6: 1, 7: 1.25, 8: 1.6 };
  for (const [p, ...g] of TD1_TABLE) {
    g.forEach((v, i) => {
      if (v === null) return;
      const grade = i + 4;
      const t6 = p < 1 ? 433 * p - 190 * p ** 1.22 : 230 * p ** 0.7;
      const f = nearestPreferred(t6 * factor[grade]);
      total++;
      if (f === v) exact++;
      assert.ok(Math.abs(f - v) / v < 0.08, `TD1 P${p} grade ${grade}: formula ${f} vs table ${v}`);
    });
  }
  assert.ok(exact / total > 0.6, `TD1 exact ${exact}/${total}`);
  console.log(`# TD1 formula equals table in ${exact} of ${total} cases`);
  void TD2_INT_TABLE;
});

// ASME B1.1 published limits, class 2B internal pitch diameter and 2A major diameter (inches).
test('ASME B1.1: 2B pitch diameters and 2A major diameters match published limits', () => {
  const IN = 25.4;
  for (const [n, min, max] of [['1/4-20 UNC', 0.2175, 0.2224], ['3/8-16 UNC', 0.3344, 0.3401], ['1/2-13 UNC', 0.45, 0.4565]]) {
    const t = limits(row(n), 'int', '2B');
    near(t.d2.min / IN, min, 0.00006, n + ' PD min');
    near(t.d2.max / IN, max, 0.00006, n + ' PD max');
  }
  for (const [n, max, min] of [['1/4-20 UNC', 0.2489, 0.2408], ['1/2-13 UNC', 0.4985, 0.4876]]) {
    const t = limits(row(n), 'ext', '2A');
    near(t.major.max / IN, max, 0.00006, n + ' major max');
    near(t.major.min / IN, min, 0.00006, n + ' major min');
  }
});

test('ISO 228-1 G: limits match the second source (Engineers Edge) for class A and B', () => {
  const g = row('G 1/2');
  const a = limits(g, 'ext', 'A');
  const b = limits(g, 'ext', 'B');
  near(a.d2.min, 19.651, 0.0006, 'A d2 min');
  near(b.d2.min, 19.509, 0.0006, 'B d2 min');
  near(a.major.min, 20.671, 0.0006, 'major min');
  const g2 = limits(row('G 2-1/2'), 'ext', 'B');
  near(g2.d2.min, 73.271, 0.0006, 'G 2 1/2 B d2 min');
});

test('Pg: maker limits are used as published', () => {
  const t = limits(row('Pg 7'), 'ext', 'DIN 40430');
  assert.equal(t.source, 'maker');
  near(t.d2.min, 11.69, 1e-9, 'd2 min');
  near(t.d2.max, 11.89, 1e-9, 'd2 max');
});

test('Whitworth BSW/BSF has no tolerance until BS 84 is sourced, and the app says so', () => {
  assert.equal(limits(row('1/2 BSW'), 'ext', '').source, 'none');
});

test('internal isoInternal handles G positions and formula gaps without crashing', () => {
  const t = isoInternal(1.2, 0.25, '6H'); // not in the internal TD2 table → formula
  assert.equal(t.source, 'formula');
  assert.ok(t.d2.max > t.d2.min);
});
