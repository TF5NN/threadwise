// Validation of the thread catalogue: every published diameter against the profile formula,
// every metric size against the ISO 965-1 tables, NPT against the standard's own formulas.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOGUE, family, IN } from '../js/catalogue.js';
import { TD2_TABLE, ES_TABLE } from '../js/iso965-data.js';
import { PIPE_G, NPT } from '../js/data/catalogue-data.js';

const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} vs ${b} (±${tol})`);

test('every metric size is a standard ISO combination (it has an ISO 965-1 Td2 row and es row)', () => {
  for (const r of family('M')) {
    const row = TD2_TABLE.find((t) => t[0] < r.d && r.d <= t[1] && Math.abs(t[2] - r.pitch) < 1e-9);
    assert.ok(row, `${r.name}: no Td2 row for d=${r.d}, P=${r.pitch}`);
    assert.ok(ES_TABLE.find((e) => Math.abs(e[0] - r.pitch) < 1e-9), `${r.name}: pitch not in es table`);
  }
});

test('metric basic diameters follow ISO 724 (spot checks against published values)', () => {
  // M10 × 1.5: d2 9.026, D1 8.376; M6: d2 5.350, D1 4.917; M12: d2 10.863, D1 10.106 (6H/6g tables)
  const get = (n) => CATALOGUE.find((r) => r.name === n);
  near(get('M10').d2, 9.026, 0.0005, 'M10 d2');
  near(get('M10').d1, 8.376, 0.0005, 'M10 D1');
  near(get('M6').d2, 5.35, 0.0005, 'M6 d2');
  near(get('M6').d1, 4.917, 0.0005, 'M6 D1');
  near(get('M12').d2, 10.863, 0.0005, 'M12 d2');
  near(get('M12').d1, 10.106, 0.0005, 'M12 D1');
});

test('Whitworth BSW/BSF: d2 = d − 0.640327·P matches every published effective diameter', () => {
  for (const r of [...family('BSW'), ...family('BSF')]) near(r.d2 / IN, r.d2Published / IN, 0.00006, r.name);
});

test('G (ISO 228-1): published d2 and d1 match the Whitworth formulas for every size', () => {
  // The standard builds its table from the rounded thread height h (to 0.001 mm), e.g.
  // G 1: d1 = 31.770 − 1.479 = 30.291 where the exact formula gives 30.2919. So the table
  // and the formula may differ by up to 1 µm; anything more would be a misread value.
  for (const [size, tpi, d, d2, d1] of PIPE_G) {
    const p = IN / tpi;
    near(d - 0.640327 * p, d2, 0.0011, `G ${size} d2`);
    near(d - 1.280654 * p, d1, 0.0011, `G ${size} d1`);
    near(d2 - (d - d2), d1, 0.0011, `G ${size} symmetric profile`);
  }
});

test('G: the scanned IS 2643 misreads are caught by the formulas', () => {
  // The scan read G 2 1/2 as 75.164 and G 3 as 87.864; the second source says 75.184 and
  // 87.884. Only the second agrees with the tabled d2 (73.705, 86.405) through d2 = d − 0.640327·P.
  const p = IN / 11;
  near(75.184 - 0.640327 * p, 73.705, 0.0011, 'G 2 1/2 with 75.184');
  assert.ok(Math.abs(75.164 - 0.640327 * p - 73.705) > 0.015, '75.164 must not fit');
  near(87.884 - 0.640327 * p, 86.405, 0.0011, 'G 3 with 87.884');
});

test('G (ISO 228-1): tolerances follow the pitch groups of the standard', () => {
  const byPitch = { 28: [0.107, 0.282], 19: [0.125, 0.445], 14: [0.142, 0.541] };
  for (const [size, tpi, d, , , td2A, td1] of PIPE_G) {
    if (tpi === 11) {
      assert.equal(td2A, d <= 59.614 ? 0.18 : 0.217, `G ${size} Td2`);
      assert.equal(td1, 0.64, `G ${size} TD1`);
    } else assert.deepEqual([td2A, td1], byPitch[tpi], `G ${size}`);
  }
});

test('NPT: E0 and E1 follow ASME B1.20.1 formulas for every size', () => {
  for (const [size, tpi, D, E0, L1, E1] of NPT) {
    const p = 1 / tpi;
    near(D - (0.05 * D + 1.1) * p, E0, 0.000006, `${size} E0`);
    near(E0 + 0.0625 * L1, E1, 0.000011, `${size} E1`);
  }
});

test('Pg: the maker\'s basic sizes are consistent (d − d2 = d2 − d1, and 2 × thread height)', () => {
  for (const r of family('Pg')) {
    near(r.d - r.d2, r.d2 - r.d1, 0.0011, r.name);
    near(r.hExt * 2, r.d - r.d1, 1e-9, r.name);
  }
});

test('every row has a source and sensible numbers', () => {
  for (const r of CATALOGUE) {
    assert.ok(r.src && r.src.length, r.id + ' has no source');
    assert.ok(r.d > r.d2 && r.d2 > r.d1 && r.d1 > 0, r.id + ' diameters out of order');
    assert.ok(r.pitch > 0 && r.angle > 0, r.id);
  }
  assert.ok(CATALOGUE.length > 200, 'catalogue size ' + CATALOGUE.length);
});
