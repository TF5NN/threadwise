// Validation of Find with synthetic measurements: for every thread in the catalogue, make
// readings the way a real part would give them, and check the right thread comes out on top
// (or tied on top with threads that are genuinely indistinguishable from those readings).
import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOGUE } from '../js/catalogue.js';
import { rank, defaultWindows, threadsToTell } from '../js/find.js';

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
      for (let k = 0; k < 5; k++) {
        const base = side === 'ext' ? row.d : row.d1;
        const w = defaultWindows(side, base);
        // Real parts: bolts up to 70 % of the window under size, holes up to 70 % over.
        const d = side === 'ext' ? base - rnd() * 0.7 * w.minus : base + rnd() * 0.7 * w.plus;
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
