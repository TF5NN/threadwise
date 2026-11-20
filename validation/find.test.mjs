// Validation of Find with synthetic measurements: for every thread in the catalogue, make
// readings the way a real part would give them, and check the right thread comes out on top
// (or tied on top with threads that are genuinely indistinguishable from those readings).
import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOGUE } from '../js/catalogue.js';
import { rank, defaultWindows, typicalSpread, threadsToTell, snapTwoWire } from '../js/find.js';
import { overWires, angleFromTwoWires } from '../js/geometry.js';

// A small deterministic random generator, so the test gives the same result every run.
let seed = 12345;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);

/** Position of the true row, counting ties (same score) as the best place among them. */
function place(result, row) {
  const list = result.inside;
  const me = list.find((s) => s.row === row);
  if (!me) return Infinity;
  return list.filter((s) => s.score < me.score - 1e-9).length + 1;
}

for (const side of ['ext', 'int']) {
  test(`Find puts the right thread in the top three: ${side === 'ext' ? 'bolts' : 'holes'}, every catalogue thread, 5 noisy readings each`, () => {
    let total = 0;
    let top1 = 0;
    let top3 = 0;
    const misses = [];
    for (const row of CATALOGUE) {
      // Find lists DIN 158 once (not the short version) and only as a bolt.
      if (row.short || (row.family === 'MK' && side === 'int')) continue;
      for (let k = 0; k < 5; k++) {
        const base = side === 'ext' ? row.d : row.d1;
        const w = defaultWindows(side, base);
        const typ = typicalSpread(side, base);
        // Real parts: bolts up to 70 % of the usual spread under size, holes up to 70 % over.
        const d = side === 'ext' ? base - rnd() * 0.7 * typ.under : base + rnd() * 0.7 * typ.over;
        // A pitch gauge reads the nominal pitch; add up to ±0.5 % for a caliper over 10 threads.
        const pitch = row.pitch * (1 + (rnd() - 0.5) * 0.01);
        const r = rank({ side, d, pitch, minus: w.minus, plus: w.plus, pitchTol: 0.02, taper: row.taper ? 'taper' : 'parallel' });
        const pl = place(r, row);
        total++;
        if (pl === 1) top1++;
        if (pl <= 3) top3++;
        else misses.push(`${row.name} (${side}) d=${d.toFixed(3)} → place ${pl}`);
      }
    }
    console.log(`# ${side}: right thread first in ${top1}/${total}, in top three in ${top3}/${total}`);
    assert.ok(top3 / total >= 0.97, `top three only ${top3}/${total}: ${misses.slice(0, 8).join('; ')}`);
  });
}

test('twins are flagged: 1/4-20 UNC and 1/4 BSW differ only in the flank angle', () => {
  const r = rank({ side: 'ext', d: 6.3, pitch: 1.27, minus: 0.3, plus: 0.1, taper: 'parallel' });
  const unc = r.inside.find((s) => s.row.name === '1/4-20 UNC');
  assert.ok(unc.twins.some((s) => s.row.name === '1/4 BSW'));
  // With the angle known (e.g. from the two-wire tool), the twin drops out.
  const r60 = rank({ side: 'ext', d: 6.3, pitch: 1.27, minus: 0.3, plus: 0.1, angle: 60, taper: 'parallel' });
  assert.ok(!r60.inside.some((s) => s.row.name === '1/4 BSW'));
});

test('pipe threads: a 21 mm bolt with 14 TPI is G 1/2 or R 1/2, not something called "21"', () => {
  const r = rank({ side: 'ext', d: 20.85, pitch: 25.4 / 14, minus: 0.63, plus: 0.21, taper: 'any' });
  const names = r.inside.slice(0, 2).map((s) => s.row.name).sort();
  assert.deepEqual(names, ['G 1/2', 'R 1/2']);
});

test('look-alike pitch arithmetic: 1.5 mm vs 16 TPI drift half a pitch apart in 9 threads', () => {
  assert.equal(threadsToTell(1.5, 25.4 / 16), 9);
});

test('S and Tr of the same size are twins; the two-wire ratio tells them apart', () => {
  const r = rank({ side: 'ext', d: 39.8, pitch: 7, minus: 1.2, plus: 0.4, taper: 'parallel' });
  const s = r.inside.find((x) => x.row.name === 'S 40 × 7');
  assert.ok(s.twins.some((x) => x.row.name === 'Tr 40 × 7'));
  // Two wires over an S thread snap to S (33), over a Tr thread to Tr (30).
  const kOf = (angle) => angleFromTwoWires(overWires(34.75, 7, 3.6, angle), 3.6, overWires(34.75, 7, 4.2, angle), 4.2).k;
  assert.equal(snapTwoWire(kOf([3, 30])), 33);
  assert.equal(snapTwoWire(kOf(30)), 30);
  assert.equal(snapTwoWire(kOf(60)), 60);
  // With the angle set to S, Tr drops out.
  const rS = rank({ side: 'ext', d: 39.8, pitch: 7, minus: 1.2, plus: 0.4, angle: 33, taper: 'parallel' });
  assert.ok(!rS.inside.some((x) => x.row.family === 'Tr'));
});

test('DIN 158 shows up once, as a tapered bolt, and never as a hole', () => {
  const ext = rank({ side: 'ext', d: 9.95, pitch: 1, minus: 0.3, plus: 0.1, taper: 'taper' });
  assert.equal(ext.inside.filter((x) => x.row.family === 'MK' && x.row.d === 10).length, 1);
  const int = rank({ side: 'int', d: 9.0, pitch: 1, minus: 0.1, plus: 0.4, taper: 'any' });
  assert.ok(!int.inside.some((x) => x.row.family === 'MK'));
});

// ---- Edge of the window, and look-alikes across standards ------------------------------------

import { GAUGE_PITCH_TOL } from '../js/find.js';

test('a worn M10 at 9.7 mm fits the default window (a new 6g M10 can already be 9.732)', () => {
  const w = defaultWindows('ext', 9.7);
  const r = rank({ side: 'ext', d: 9.7, pitch: 1.5, minus: w.minus, plus: w.plus, taper: 'parallel' });
  assert.ok(r.inside.some((s) => s.row.name === 'M10'), r.inside.map((s) => s.row.name).join(', '));
});

test('a reading exactly on the edge of a typed window counts as inside (10 − 9.7 vs 0.3)', () => {
  const r = rank({ side: 'ext', d: 9.7, pitch: 1.5, minus: 0.3, plus: 0.1, taper: 'parallel' });
  assert.ok(r.inside.some((s) => s.row.name === 'M10'));
});

test('M10 and 3/8" look-alikes are flagged both ways (the JCB mix-up), even outside the windows', () => {
  const lookalikes = (d, pitch, name) => {
    const w = defaultWindows('ext', d);
    const r = rank({ side: 'ext', d, pitch, minus: w.minus, plus: w.plus, taper: 'parallel' });
    const me = [...r.inside, ...r.closest].find((s) => s.row.name === name);
    assert.ok(me, `${name} not listed`);
    return me.lookalikes.map((s) => s.row.name);
  };
  assert.ok(lookalikes(9.8, 1.5, 'M10').includes('3/8-16 UNC'));
  assert.ok(lookalikes(9.8, 1.0, 'M10 × 1').includes('3/8-24 UNF'));
  assert.ok(lookalikes(9.8, 1.25, 'M10 × 1.25').includes('3/8 BSF'));
  assert.ok(lookalikes(9.45, 25.4 / 24, '3/8-24 UNF').includes('M10 × 1'));
  assert.ok(lookalikes(9.45, 25.4 / 16, '3/8-16 UNC').includes('M10'));
  // Not every neighbour is a look-alike: M10 and 3/8-24 UNF are 30 % apart in pitch.
  assert.ok(!lookalikes(9.8, 1.5, 'M10').includes('3/8-24 UNF'));
});

test('a pitch gauge on a dirty bolt: 1.5 mm keeps 3/8-16 UNC in the list, and M10 stays on top', () => {
  assert.ok(GAUGE_PITCH_TOL >= 0.056); // 1.5 mm vs 16 TPI is 5.5 % apart
  // 9.6 mm could be a worn M10 or a 3/8" that measures a little over (dirt on the crests).
  const w = defaultWindows('ext', 9.6);
  const r = rank({ side: 'ext', d: 9.6, pitch: 1.5, minus: w.minus, plus: w.plus, taper: 'parallel' });
  const names = r.inside.map((s) => s.row.name);
  assert.equal(names[0], 'M10');
  assert.ok(names.includes('3/8-16 UNC'), names.join(', '));
});

test('wider windows list more, but never push an unlikely thread above a likely one', () => {
  // 9.6 mm, 1.5 mm gauge: a worn M10 (0.4 under) or a 3/8-16 UNC reading 0.075 over.
  const narrow = rank({ side: 'ext', d: 9.6, pitch: 1.5, minus: 0.5, plus: 0.1, pitchTol: 0.06, taper: 'parallel' });
  const wide = rank({ side: 'ext', d: 9.6, pitch: 1.5, minus: 2, plus: 2, pitchTol: 0.2, taper: 'parallel' });
  assert.ok(wide.inside.length > narrow.inside.length);
  // Same order for what both lists have in common.
  const common = narrow.inside.map((s) => s.row.name);
  assert.deepEqual(wide.inside.map((s) => s.row.name).filter((n) => common.includes(n)), common);
  assert.equal(wide.inside[0].row.name, 'M10');
});

test('a rusty 3/8" bolt reading over size is listed (9.7 mm, 16 TPI)', () => {
  const w = defaultWindows('ext', 9.7);
  const r = rank({ side: 'ext', d: 9.7, pitch: 25.4 / 16, minus: w.minus, plus: w.plus, taper: 'parallel' });
  const names = r.inside.map((s) => s.row.name);
  assert.ok(names.includes('3/8-16 UNC') && names.includes('3/8 BSW'), names.join(', '));
});

import { overThreadsCheck } from '../js/find.js';

test('measured over 10 threads, the look-alike warning checks the reading (15.00 mm: M10, not 3/8-16)', () => {
  const m10 = overThreadsCheck(1.5, 25.4 / 16, 15.0, 10);
  assert.ok(m10.fitsHere);
  assert.ok(Math.abs(m10.there - 15.875) < 1e-9);
  // Seen from the 3/8-16 UNC card, the same reading points the other way.
  assert.ok(!overThreadsCheck(25.4 / 16, 1.5, 15.0, 10).fitsHere);
});
