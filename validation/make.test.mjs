// Validation of Make: tap-drill percentages against the classic charts, thread depths
// against the standard profiles, and the pass schedule.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOGUE } from '../js/catalogue.js';
import { percentThread, infeed, passes, drillChoices } from '../js/make.js';
import { limits } from '../js/tolerances.js';

const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} vs ${b}`);
const row = (n) => CATALOGUE.find((r) => r.name === n);

test('percentage of thread matches the classic tap-drill charts (about 75–77 %)', () => {
  // 1/4-20 with a #7 drill (0.201"), 1/2-13 with 27/64", DIN 336 M6 → 5.0, M10 → 8.5, M3 → 2.5.
  near(percentThread(row('1/4-20 UNC'), 0.201 * 25.4), 75, 1.5, '1/4-20 #7');
  near(percentThread(row('1/2-13 UNC'), (27 / 64) * 25.4), 78, 1.5, '1/2-13 27/64');
  near(percentThread(row('M6'), 5.0), 77, 1, 'M6 5.0');
  near(percentThread(row('M10'), 8.5), 77, 1, 'M10 8.5');
  near(percentThread(row('M3'), 2.5), 77, 1, 'M3 2.5');
});

test('the DIN 336 drills for M6, M8, M10, M12 fall inside the 6H minor-diameter limits', () => {
  for (const [n, drill] of [['M6', 5.0], ['M8', 6.8], ['M10', 8.5], ['M12', 10.2]]) {
    const minor = limits(row(n), 'int', '6H').minor;
    assert.ok(drill >= minor.min && drill <= minor.max, `${n} ${drill} not in ${minor.min}–${minor.max}`);
    const offered = drillChoices(row(n), minor).find((d) => d.sys === 'mm' && Math.abs(d.mm - drill) < 1e-9);
    assert.ok(offered && offered.inside, `${n}: ${drill} mm should be offered and marked inside`);
  }
});

test('thread depths follow the standard profiles', () => {
  near(infeed(row('M10'), 'ext').depth, 0.613435 * 1.5, 1e-5, 'ISO external h3 = 17/24·H');
  near(infeed(row('M10'), 'int').depth, 0.541266 * 1.5, 1e-5, 'ISO internal H1 = 5/8·H');
  near(infeed(row('1/2 BSW'), 'ext').depth, 0.640327 * (25.4 / 12), 1e-5, 'Whitworth 0.640327·P');
  near(infeed(row('Pg 7'), 'ext').depth, 0.61, 1e-9, 'Pg 7 thread height from the maker table');
});

test('compound angles: half the thread angle less ½°', () => {
  assert.equal(infeed(row('M10'), 'ext').compound, 29.5);
  assert.equal(infeed(row('1/2 BSW'), 'ext').compound, 27);
  assert.equal(infeed(row('Pg 9'), 'ext').compound, 39.5);
});

test('pass schedule ends exactly at full depth and the passes shrink', () => {
  const p = passes(0.92, 8);
  near(p[p.length - 1].cum, 0.92, 1e-12, 'last');
  for (let i = 1; i < p.length; i++) assert.ok(p[i].step < p[i - 1].step);
});

test('S buttress: depths from the DIN 513 table, straight-in only (no compound), 100 % thread at D1', () => {
  const s = row('S 40 × 7');
  const ext = infeed(s, 'ext');
  near(ext.depth, 6.074, 1e-9, 'h3');
  assert.equal(ext.compound, null, 'no compound setting until there is a source');
  near(infeed(s, 'int').depth, 5.25, 1e-9, 'H1');
  near(percentThread(s, 29.5), 100, 1e-9, 'drill at D1 = 100 %');
  // Drills are offered around 75 %, i.e. well above D1, for the nut.
  assert.ok(drillChoices(s, null).some((d) => d.sys === 'mm' && Math.abs(d.pct - 75) < 2));
});

test('DIN 158: infeed is the ISO 60° depth; the book h3 max is not exceeded', () => {
  const m = CATALOGUE.find((r) => r.id === 'MK:10x1');
  const f = infeed(m, 'ext');
  near(f.compound, 29.5, 1e-9, 'compound');
  assert.ok(f.depth <= m.h3max, `${f.depth} vs h3 max ${m.h3max}`);
});
