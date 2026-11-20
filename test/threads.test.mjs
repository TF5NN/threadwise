// Checks the maths against the original spreadsheet and against published table values.
// Run with: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  solve,
  wireSizes,
  isoTolerance,
  isoEs,
  isoTd2,
  unifiedTolerance,
  parseInch,
  parseNumber,
  checkMeasurement,
  MM_PER_INCH,
} from '../js/threads.js';

const near = (actual, expected, within, what) =>
  assert.ok(Math.abs(actual - expected) <= within, `${what}: got ${actual}, expected ${expected} ± ${within}`);

test('matches the spreadsheet: M10 × 2, manual es −0.05 / ei −0.5, wire 1.1 mm', () => {
  const r = solve({ d: 10, pitch: 2, es: -0.05, ei: -0.5, wire: 1.1 });
  near(r.d2, 8.700962, 1e-6, 'd2');
  near(r.d2max, 8.650962, 1e-6, 'd2 max');
  near(r.d2min, 8.200962, 1e-6, 'd2 min');
  near(r.mMid, 9.993912, 2e-6, 'M');
  near(r.mMax, 10.218912, 2e-6, 'M max');
  near(r.mMin, 9.768912, 2e-6, 'M min');
  near(r.half, 0.225, 1e-9, '±');
});

test('wire sizes match the spreadsheet (2 mm pitch)', () => {
  const w = wireSizes(2);
  near(w.best, 1.1547, 1e-4, 'best');
  near(w.max, 2.020726, 1e-5, 'max');
  near(w.min, 1.010364, 1e-5, 'min');
});

test('ISO 965-1 table values: M10 × 1.5 6g', () => {
  const t = isoTolerance(10, 1.5, '6g');
  assert.equal(t.status, 'table');
  near(t.es, -0.032, 1e-9, 'es');
  near(t.td2, 0.132, 1e-9, 'Td2');
  near(t.ei, -0.164, 1e-9, 'ei');
});

test('ISO 965-1: M6 × 1 6g and M6 × 1 6h', () => {
  near(isoTolerance(6, 1, '6g').es, -0.026, 1e-9, 'es g');
  near(isoTolerance(6, 1, '6g').td2, 0.112, 1e-9, 'Td2');
  near(isoTolerance(6, 1, '6h').es, 0, 1e-9, 'es h');
});

test('ISO 965-1: 5g6g uses grade 5 on the pitch diameter', () => {
  const t = isoTolerance(10, 1.5, '5g6g');
  near(t.td2, 0.106, 1e-9, 'Td2 grade 5');
});

test('ISO 965-1: a pitch outside the tables falls back to the formulas', () => {
  const t = isoTolerance(10, 2, '6g');
  assert.equal(t.status, 'formula');
  assert.ok(t.td2 > 0.13 && t.td2 < 0.18, 'Td2 ' + t.td2);
  near(t.es, -0.038, 1e-9, 'es from the table');
  // A pitch not in the es table: −(15 + 11·2.25) = −39.75 µm → preferred number 40
  const e = isoEs('g', 2.25);
  assert.equal(e.source, 'formula');
  assert.equal(e.value, -40);
});

test('ISO 965-1: positions and grades the standard leaves out are undefined', () => {
  assert.equal(isoEs('e', 0.3).source, 'undefined'); // '-' in the table
  assert.equal(isoTd2(7, 1.2, 0.2).source, 'undefined');
  assert.equal(isoTolerance(0.5, 0.2, '6g').status, 'range');
  assert.equal(isoTolerance(400, 4, '6g').status, 'range');
});

// Published ASME B1.1 values for UNC class 2A (pitch diameter max / min, inches).
const UNC = [
  ['1/4-20 2A', 0.25, 20, '2A', 0.2164, 0.2127],
  ['3/8-16 2A', 0.375, 16, '2A', 0.3331, 0.3287],
  ['1/2-13 2A', 0.5, 13, '2A', 0.4485, 0.4435],
  ['1/4-20 1A', 0.25, 20, '1A', 0.2164, 0.2108],
  ['1/4-20 3A', 0.25, 20, '3A', 0.2175, 0.2147],
];
for (const [name, d, tpi, cls, max, min] of UNC) {
  test(`ASME B1.1: ${name}`, () => {
    const t = unifiedTolerance(d, tpi, cls);
    const basic = d - 0.649519 / tpi;
    near(basic + t.es, max, 0.00006, 'PD max');
    near(basic + t.ei, min, 0.00006, 'PD min');
  });
}

test('an inch thread solved in millimetres gives the same over-wire figure', () => {
  const t = unifiedTolerance(0.25, 20, '2A');
  const wire = 0.0289 * MM_PER_INCH;
  const r = solve({ d: 0.25 * MM_PER_INCH, pitch: MM_PER_INCH / 20, es: t.es * MM_PER_INCH, ei: t.ei * MM_PER_INCH, wire });
  // In inches: M = E − 0.866025·P + 3G, with E the middle of the PD band
  const e = (0.25 - 0.649519 / 20) + (t.es + t.ei) / 2;
  near(r.mMid / MM_PER_INCH, e - 0.866025 / 20 + 3 * 0.0289, 1e-6, 'M');
});

test('reading typed diameters and numbers', () => {
  near(parseInch('1/4'), 0.25, 1e-12, '1/4');
  near(parseInch('1-1/4'), 1.25, 1e-12, '1-1/4');
  near(parseInch('1 1/4"'), 1.25, 1e-12, '1 1/4"');
  near(parseInch('#10'), 0.19, 1e-12, '#10');
  near(parseInch('0,375'), 0.375, 1e-12, '0,375');
  assert.equal(parseNumber('1,5'), 1.5);
  assert.equal(parseNumber('-0.05'), -0.05);
  assert.equal(parseNumber('abc'), null);
});

test('checking a measurement', () => {
  const t = isoTolerance(10, 1.5, '6g');
  const wire = 0.866;
  const r = solve({ d: 10, pitch: 1.5, es: t.es, ei: t.ei, wire });
  assert.equal(checkMeasurement(r, r.mMid, 1.5, wire).verdict, 'in');
  near(checkMeasurement(r, r.mMid, 1.5, wire).toMid, 0, 1e-9, 'at the middle');
  const big = checkMeasurement(r, r.mMax + 0.02, 1.5, wire);
  assert.equal(big.verdict, 'large');
  near(big.over, 0.02, 1e-9, 'over');
  assert.equal(checkMeasurement(r, r.mMin - 0.001, 1.5, wire).verdict, 'small');
});

test('a wire outside the usable range is flagged', () => {
  assert.equal(solve({ d: 10, pitch: 1.5, es: 0, ei: -0.1, wire: 0.5 }).wireFit, 'small');
  assert.equal(solve({ d: 10, pitch: 1.5, es: 0, ei: -0.1, wire: 1.6 }).wireFit, 'large');
  assert.equal(solve({ d: 10, pitch: 1.5, es: 0, ei: -0.1, wire: 0.866 }).wireFit, 'ok');
});
