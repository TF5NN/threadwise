// Validation against the Töflubók (IÐNÚ, the Icelandic edition of Tabellenbuch Metall).
// Every table below is typed from Gunnar's photos of the book (pages in each test name),
// read from zoomed crops. The photos are slightly skewed, so rows were matched by counting.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOGUE, FORMS, family } from '../js/catalogue.js';
import { limits, isoInternal } from '../js/tolerances.js';
import { PIPE_G, TRAPEZ, TR_PRINTED, TAP_DRILL_COARSE, BUTTRESS, METRIC_TAPER, METRIC_TAPER_TEST_PRINTED } from '../js/data/catalogue-data.js';

const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} vs ${b} (±${tol})`);
const row = (n) => CATALOGUE.find((r) => r.name === n);

// ---- p. 265, DIN 13-1 (1999-11): profile formulas -------------------------------------------
test('p. 265: the ISO metric profile constants match DIN 13-1 as printed', () => {
  // h3 = 0.61343·P, H1 = 0.54127·P, d2 = d − 0.64952·P, d3 = d − 1.22687·P
  near(FORMS.iso.hExt, 0.61343, 6e-6, 'h3');
  near(FORMS.iso.hInt, 0.54127, 6e-6, 'H1');
  near(FORMS.iso.d2k, 0.64952, 6e-6, 'd2');
  near(2 * FORMS.iso.hExt, 1.22687, 6e-6, 'd3');
});

// p. 265, "Venjulegar gengjur": [d, P, d2, d3, D1, h3, H1]
const COARSE = [
  [3, 0.5, 2.675, 2.387, 2.459, 0.307, 0.271], [3.5, 0.6, 3.11, 2.764, 2.85, 0.368, 0.325],
  [4, 0.7, 3.545, 3.141, 3.242, 0.429, 0.379], [4.5, 0.75, 4.013, 3.58, 3.688, 0.46, 0.406],
  [5, 0.8, 4.48, 4.019, 4.134, 0.491, 0.433], [6, 1, 5.35, 4.773, 4.917, 0.613, 0.541],
  [8, 1.25, 7.188, 6.466, 6.647, 0.767, 0.677], [10, 1.5, 9.026, 8.16, 8.376, 0.92, 0.812],
  [12, 1.75, 10.863, 9.853, 10.106, 1.074, 0.947], [14, 2, 12.701, 11.546, 11.835, 1.227, 1.083],
  [16, 2, 14.701, 13.546, 13.835, 1.227, 1.083], [18, 2.5, 16.376, 14.933, 15.294, 1.534, 1.353],
  [20, 2.5, 18.376, 16.933, 17.294, 1.534, 1.353], [22, 2.5, 20.376, 18.933, 19.294, 1.534, 1.353],
  [24, 3, 22.051, 20.319, 20.752, 1.84, 1.624], [27, 3, 25.051, 23.319, 23.752, 1.84, 1.624],
  [30, 3.5, 27.727, 25.706, 26.211, 2.147, 1.894], [33, 3.5, 30.727, 28.706, 29.211, 2.147, 1.894],
  [36, 4, 33.402, 31.093, 31.67, 2.454, 2.165], [39, 4, 36.402, 34.093, 34.67, 2.454, 2.165],
  [42, 4.5, 39.077, 36.479, 37.129, 2.76, 2.436], [45, 4.5, 42.077, 39.479, 40.129, 2.76, 2.436],
  [48, 5, 44.752, 41.866, 42.587, 3.067, 2.706], [52, 5, 48.752, 45.866, 46.587, 3.067, 2.706],
  [56, 5.5, 52.428, 49.252, 50.046, 3.374, 2.977], [60, 5.5, 56.428, 53.252, 54.046, 3.374, 2.977],
];
test('p. 265: every coarse metric size matches the book (d2, d3, D1, h3, H1)', () => {
  for (const [d, P, d2, d3, D1, h3, H1] of COARSE) {
    const r = row(`M${d}`);
    assert.ok(r, `M${d} missing from the catalogue`);
    assert.equal(r.pitch, P, `M${d} pitch`);
    near(r.d2, d2, 0.0006, `M${d} d2`);
    near(r.d - 2 * FORMS.iso.hExt * P, d3, 0.0006, `M${d} d3`);
    near(r.d1, D1, 0.0006, `M${d} D1`);
    near(FORMS.iso.hExt * P, h3, 0.0006, `M${d} h3`);
    near(FORMS.iso.hInt * P, H1, 0.0006, `M${d} H1`);
  }
});

// p. 265, "Fínar gengjur": [name, d2, d3, D1] for the sizes in the catalogue
const FINE = [
  ['M3 × 0.35', 2.773, 2.571, 2.621], ['M4 × 0.5', 3.675, 3.387, 3.459], ['M5 × 0.5', 4.675, 4.387, 4.459],
  ['M6 × 0.75', 5.513, 5.08, 5.188], ['M8 × 1', 7.35, 6.773, 6.917], ['M10 × 0.75', 9.513, 9.08, 9.188],
  ['M10 × 1', 9.35, 8.773, 8.917], ['M12 × 1', 11.35, 10.773, 10.917], ['M14 × 1.5', 13.026, 12.16, 12.376],
  ['M16 × 1', 15.35, 14.773, 14.917], ['M16 × 1.5', 15.026, 14.16, 14.376], ['M20 × 1', 19.35, 18.773, 18.917],
  ['M20 × 1.5', 19.026, 18.16, 18.376], ['M24 × 1.5', 23.026, 22.16, 22.376], ['M24 × 2', 22.701, 21.546, 21.835],
  ['M30 × 1.5', 29.026, 28.16, 28.376], ['M30 × 2', 28.701, 27.546, 27.835], ['M36 × 1.5', 35.026, 34.16, 34.376],
  ['M36 × 2', 34.701, 33.546, 33.835], ['M42 × 2', 40.701, 39.546, 39.835], ['M48 × 2', 46.701, 45.546, 45.835],
  ['M56 × 2', 54.701, 53.546, 53.835], ['M64 × 2', 62.701, 61.546, 61.835],
];
test('p. 265: fine metric sizes match the book', () => {
  for (const [n, d2, d3, D1] of FINE) {
    const r = row(n);
    assert.ok(r, `${n} missing from the catalogue`);
    near(r.d2, d2, 0.0006, `${n} d2`);
    near(r.d - 2 * FORMS.iso.hExt * r.pitch, d3, 0.0006, `${n} d3`);
    near(r.d1, D1, 0.0006, `${n} D1`);
  }
});

// ---- p. 270, DIN ISO 965-2 (1999-11): 6H and 6g limits ------------------------------------------
// [name, D2 min, D2 max, D1 min, D1 max, d max, d min, d2 max, d2 min]
const LIMITS = [
  ['M3', 2.675, 2.775, 2.459, 2.599, 2.98, 2.874, 2.655, 2.58],
  ['M4', 3.545, 3.663, 3.242, 3.422, 3.978, 3.838, 3.523, 3.433],
  ['M5', 4.48, 4.605, 4.134, 4.334, 4.976, 4.826, 4.456, 4.361],
  ['M6', 5.35, 5.5, 4.917, 5.153, 5.974, 5.794, 5.324, 5.212],
  ['M8', 7.188, 7.348, 6.647, 6.912, 7.972, 7.76, 7.16, 7.042],
  ['M10', 9.026, 9.206, 8.376, 8.676, 9.968, 9.732, 8.994, 8.862],
  ['M12', 10.863, 11.063, 10.106, 10.441, 11.966, 11.701, 10.829, 10.679],
  ['M14', 12.701, 12.913, 11.835, 12.21, 13.962, 13.682, 12.663, 12.503],
  ['M16', 14.701, 14.913, 13.835, 14.21, 15.962, 15.682, 14.663, 14.503],
  ['M20', 18.376, 18.6, 17.294, 17.744, 19.958, 19.623, 18.334, 18.164],
  ['M24', 22.051, 22.316, 20.752, 21.252, 23.952, 23.577, 22.003, 21.803],
  ['M30', 27.727, 28.007, 26.211, 26.771, 29.947, 29.522, 27.674, 27.462],
  ['M8 × 1', 7.35, 7.5, 6.917, 7.153, 7.974, 7.794, 7.324, 7.212],
  ['M10 × 1', 9.35, 9.5, 8.917, 9.153, 9.974, 9.794, 9.324, 9.212],
  ['M14 × 1.5', 13.026, 13.216, 12.376, 12.676, 13.968, 13.732, 12.994, 12.854],
  ['M16 × 1.5', 15.026, 15.216, 14.376, 14.676, 15.968, 15.732, 14.994, 14.854],
  ['M20 × 1.5', 19.026, 19.216, 18.376, 18.676, 19.968, 19.732, 18.994, 18.854],
  ['M24 × 2', 22.701, 22.925, 21.835, 22.21, 23.962, 23.682, 22.663, 22.493],
  // The book prints 28.702 for D2 min of M30 × 2; the basic size is 28.701 (see DISCREPANCIES).
  ['M30 × 2', 28.701, 28.925, 27.835, 28.21, 29.962, 29.682, 28.663, 28.493],
];
for (const [n, D2min, D2max, D1min, D1max, dmax, dmin, d2max, d2min] of LIMITS) {
  test(`p. 270: 6H and 6g limits match the book: ${n}`, () => {
    const i = limits(row(n), 'int', '6H');
    const e = limits(row(n), 'ext', '6g');
    near(i.d2.min, D2min, 0.0006, 'D2 min');
    near(i.d2.max, D2max, 0.0006, 'D2 max');
    near(i.minor.min, D1min, 0.0006, 'D1 min');
    near(i.minor.max, D1max, 0.0006, 'D1 max');
    near(e.major.max, dmax, 0.0006, 'd max');
    near(e.major.min, dmin, 0.0006, 'd min');
    near(e.d2.max, d2max, 0.0006, 'd2 max');
    near(e.d2.min, d2min, 0.0006, 'd2 min');
  });
}

// ---- p. 265: tap drills --------------------------------------------------------------------------
test('p. 265: the book\'s tap drills sit inside the 6H minor-diameter limits (one exception logged)', () => {
  const outside = [];
  for (const r of family('M').filter((x) => x.tapDrill)) {
    const m = limits(r, 'int', '6H').minor;
    if (r.tapDrill < m.min - 1e-9 || r.tapDrill > m.max + 1e-9) outside.push(r.name);
  }
  // M60 was read as 55 mm from the photo of the book; the 6H limits are 54.046–54.796 mm and
  // tap makers (Walter, BAER) give 54.5 mm, so 54.5 is used. Logged in DISCREPANCIES.
  assert.deepEqual(outside, []);
  assert.equal(TAP_DRILL_COARSE[60], 54.5);
  assert.ok(55 > isoInternal(60, 5.5, '6H').minor.max, 'the printed 55 really is outside 6H');
});

// ---- p. 267, DIN ISO 228-1 (2001-04): G threads, a third source ----------------------------------
// The book lists these sizes (no 7/8, 1 1/8, 3 1/2, 4 1/2, 5 1/2); its values must equal ours.
const G_BOOK = ['1/16', '1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '1', '1-1/4', '1-1/2', '1-3/4', '2', '2-1/4', '2-1/2', '2-3/4', '3', '4', '5', '6'];
const G_BOOK_VALUES = {
  '2-1/2': [75.184, 73.705, 72.226], '3': [87.884, 86.405, 84.926], '1': [33.249, 31.77, 30.291], '6': [163.83, 162.351, 160.872],
};
test('p. 267: G sizes in the book match the catalogue, including the values the scan misread', () => {
  for (const size of G_BOOK) assert.ok(PIPE_G.find((g) => g[0] === size), `G ${size}`);
  for (const [size, [d, d2, d1]] of Object.entries(G_BOOK_VALUES)) {
    const g = PIPE_G.find((x) => x[0] === size);
    assert.deepEqual([g[2], g[3], g[4]], [d, d2, d1], `G ${size}`);
  }
});

test('p. 267: R threads exist only in the DIN 2999-1 / ISO 7-1 sizes, with gauge distance inside the useful length', () => {
  const r = family('R');
  assert.equal(r.length, 15);
  for (const x of r) assert.ok(x.gauge > 0 && x.gauge < x.useful, x.name);
  assert.ok(!r.find((x) => x.name === 'R 5/8'), 'R 5/8 does not exist');
});

// ---- p. 268, DIN 103-1 (1977-04): metric trapezoidal ----------------------------------------------
test('p. 268: every Tr size follows the book\'s own formulas (and the two misprints are caught)', () => {
  const ac = (P) => (P <= 1.5 ? 0.15 : P <= 5 ? 0.25 : P <= 12 ? 0.5 : 1);
  for (const [d, P, d2, d3, D1, D4, H4, b] of TRAPEZ) {
    const a = ac(P);
    near(d2, d - 0.5 * P, 1e-9, `Tr ${d}×${P} d2`);
    near(d3, d - (P + 2 * a), 1e-9, `Tr ${d}×${P} d3`);
    near(D1, d - P, 1e-9, `Tr ${d}×${P} D1`);
    near(D4, d + 2 * a, 1e-9, `Tr ${d}×${P} D4`);
    near(H4, 0.5 * P + a, 1e-9, `Tr ${d}×${P} H4`);
    near(b, 0.366 * P - 0.54 * a, 0.0011, `Tr ${d}×${P} b`);
  }
  // As printed: Tr 70 × 10 d3 59.5 and Tr 40 × 7 b 2.297 do NOT follow the formulas.
  assert.ok(Math.abs(TR_PRINTED.d3[70] - (70 - (10 + 2 * 0.5))) > 0.4);
  assert.ok(Math.abs(TR_PRINTED.b[40] - (0.366 * 7 - 0.54 * 0.5)) > 0.004);
});

// ---- p. 269: Whitworth (marked "óstaðlað" in the book), a third source for BSW --------------------
// [size, d, d1, d2, TPI] in mm, printed to 0.01
const BSW_BOOK = [
  ['1/4', 6.35, 4.72, 5.54, 20], ['5/16', 7.94, 6.13, 7.03, 18], ['3/8', 9.53, 7.49, 8.51, 16],
  ['1/2', 12.7, 9.99, 11.35, 12], ['5/8', 15.88, 12.92, 14.4, 11], ['3/4', 19.05, 15.8, 17.42, 10],
  ['7/8', 22.23, 18.61, 20.42, 9], ['1', 25.4, 21.34, 23.37, 8], ['1-1/4', 31.75, 27.1, 29.43, 7],
  ['1-1/2', 38.1, 32.68, 35.39, 6], ['1-3/4', 44.45, 37.95, 41.2, 5], ['2', 50.8, 43.57, 47.19, 4.5],
  // 3": the book prints d2 72.56, which contradicts its own d1 (66.91) and formula (71.55) and
  // the Engineers Edge value 2.817" = 71.55 mm. A misprint; checked separately below.
  ['2-1/4', 57.15, 49.02, 53.09, 4], ['2-1/2', 63.5, 55.37, 59.44, 4], ['3', 76.2, 66.91, 71.55, 3.5],
  ['3-1/2', 88.9, 78.89, 83.89, 3.25],
];
// The book computes with rounded constants (d1 = d − 1.28·P, d2 = d − 0.640·P, per its header),
// so its 0.01 mm figures may differ from the exact BS 84 values by up to about 0.006 mm.
test('p. 269: BSW sizes match the book to its printed 0.01 mm', () => {
  for (const [size, d, d1, d2, tpi] of BSW_BOOK) {
    const r = row(`${size} BSW`);
    assert.ok(r, `${size} BSW missing`);
    near(25.4 / r.pitch, tpi, 1e-9, `${size} TPI`);
    near(r.d, d, 0.0051, `${size} d`);
    near(r.d1, d1, 0.0081, `${size} d1`);
    near(r.d2, d2, 0.0071, `${size} d2`);
  }
});

test('p. 269: the 3" BSW pitch diameter as printed (72.56) is a misprint, caught by the formula', () => {
  const r = row('3 BSW');
  assert.ok(Math.abs(r.d2 - 72.56) > 1, 'printed value must not fit');
  near(76.2 - 0.64 * (25.4 / 3.5), 71.555, 0.001, 'book formula');
});

// ---- DIN 513-1 S buttress, Töflubók p. 268 -----------------------------------------------------
test('S (DIN 513): every printed size follows the DIN 513 formulas', () => {
  for (const [d, p, d3, h3, D1, H1, R] of BUTTRESS) {
    near(h3, 0.867767 * p, 6e-4, `S${d}×${p} h3`);
    near(d3, d - 2 * h3, 1e-9, `S${d}×${p} d3 = d − 2·h3 (from the rounded h3)`);
    near(D1, d - 1.5 * p, 1e-9, `S${d}×${p} D1`);
    near(H1, 0.75 * p, 1e-9, `S${d}×${p} H1`);
    near(R, 0.124271 * p, 6e-4, `S${d}×${p} R`);
  }
  assert.equal(family('S').length, 24);
});

// ---- DIN 158-1 metric taper, Töflubók p. 266 ---------------------------------------------------
test('DIN 158: printed test-plane diameters = gauge-plane ISO sizes + (b − a)/16', () => {
  for (const [key, [dT, d2T, d3T]] of Object.entries(METRIC_TAPER_TEST_PRINTED)) {
    const [p, d] = key.split(':').map(Number);
    const row = CATALOGUE.find((r) => r.id === `MK:${d}x${p}`);
    assert.ok(row, key);
    // The book adds the step to the rounded DIN 13 sizes (M12×1.5: 11.026 + 0.1875 = 11.2135 →
    // 11.214), so allow two roundings: 1 µm.
    near(row.dTest, dT, 6e-4, `${row.name} d′`);
    near(row.d2Test, d2T, 1.0001e-3, `${row.name} d2′`);
    near(row.d3Test, d3T, 1.0001e-3, `${row.name} d3′`);
  }
});

test('DIN 158: the short version is shorter and its planes nearer the end; h3 max is deeper than the ISO root', () => {
  for (const [p, l1, l1s, h3, h3s, a, as, b, bs] of METRIC_TAPER) {
    assert.ok(l1s < l1 && as < a && bs < b, `P ${p} short version`);
    assert.ok(h3 >= 0.613435 * p && h3s >= 0.613435 * p, `P ${p} h3 max ≥ h3 basic`);
    assert.ok(b - a > 0 && bs - as > 0, `P ${p} test plane further in than the gauge plane`);
  }
  assert.equal(family('MK').length, 52); // 26 sizes, normal and short
});
