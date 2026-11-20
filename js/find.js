// Find tab: measure an unknown thread, get a ranked list of what it could be.
// It ranks and flags look-alikes; it never says "this is it".

import { t } from './i18n.js';
import { CATALOGUE, FAMILIES } from './catalogue.js';
import { angleFromTwoWires, angleUncertainty, wireConstants } from './geometry.js';
import { parseNumber } from './threads.js';
import { num, len, toMm, local, setSeg, wireSeg, pitchBoth, MM_PER_INCH } from './format.js';
import * as hash from './hash.js';

const $ = (id) => document.getElementById(id);
const P = 'f.';
const DEFAULTS = {
  side: 'ext', d: '', du: 'mm', pm: 'mm', p: '', len: '', n: '10', angle: '', taper: 'any',
  wm: '', wp: '', pw: '', g1: '', m1: '', g2: '', m2: '', wu: 'mm',
  // Flank angle tool: three wires (the usual way) or one wire with the anvil on the thread tops.
  tw: '3',
  // Which threads to look among (all, metric, imperial) and how rough the thread is (the preset).
  sys: 'all', win: 'medium',
};
const state = { ...DEFAULTS };

// ---- The matching itself (no page code, so validation/find.test.mjs can run it) ------------

// Find answers two questions, and keeps them apart:
//   1. Could it be this thread at all?  The WINDOWS decide what gets on the list. They are
//      generous, because rejecting the right thread is worse than a longer list: a worn bolt
//      measures well under, scale or dirt on the crests can make it measure over.
//   2. How likely is it?  The ORDER comes from how real parts usually measure, whatever the
//      windows are set to. So widening a window lets more in, at the bottom, and never pushes
//      an unlikely thread above a likely one.

/**
 * How real parts usually sit against the basic size, in mm; used only for the order.
 * Bolts measure UNDER nominal: a new 6g M10 may already be 2.7 % under (9.732 mm), plus wear.
 * Bores measure OVER the basic minor diameter: tolerance, wear, tap oversize.
 */
export function typicalSpread(side, dMm) {
  if (side === 'ext') return { under: Math.max(0.2, 0.05 * dMm), over: Math.max(0.1, 0.01 * dMm) };
  return { under: Math.max(0.1, 0.01 * dMm), over: Math.max(0.3, 0.04 * dMm) };
}

/**
 * The three presets for "How close is close enough": how far off a reading may be and still
 * be listed. Each diameter window is [min, add, pct]: the larger of min and add + pct × size, in mm.
 * gauge is the pitch window for a gauge reading; caliper is how well a caliper reads a length
 * over N threads, in mm.
 *  - tight: new or clean threads in good condition. Still lists every new bolt and nut at the
 *    edge of its tolerance class (a new M4 6g can be 0.16 mm under, a new G 1/4 hole is the
 *    widest inside; validation/find.test.mjs checks them all).
 *  - medium: used fasteners, a little worn. The default.
 *  - loose: dirty, rusty or damaged threads: a rusty 3/8" bolt can read 9.7 mm over the scale,
 *    and a gauge on a few clean threads cannot tell 1.5 mm from 16 TPI (5.5 % apart).
 */
export const PRESETS = {
  tight: {
    ext: { minus: [0, 0.15, 0.015], plus: [0.05, 0, 0] },
    int: { minus: [0.05, 0, 0], plus: [0, 0.15, 0.025] },
    gauge: 0.02, caliper: 0.05,
  },
  medium: {
    ext: { minus: [0, 0.2, 0.025], plus: [0.1, 0, 0.01] },
    int: { minus: [0.15, 0, 0.01], plus: [0, 0.2, 0.03] },
    gauge: 0.04, caliper: 0.075,
  },
  loose: {
    ext: { minus: [0.3, 0, 0.06], plus: [0.25, 0, 0.025] },
    int: { minus: [0.25, 0, 0.025], plus: [0.4, 0, 0.06] },
    gauge: 0.06, caliper: 0.1,
  },
};
const presetOf = (name) => PRESETS[name] ?? PRESETS.medium;
const windowOf = ([min, add, pct], dMm) => Math.max(min, add + pct * dMm);

/** The diameter windows of a preset for a measured size, in mm. */
export function defaultWindows(side, dMm, preset = 'medium') {
  const w = presetOf(preset)[side];
  return { minus: windowOf(w.minus, dMm), plus: windowOf(w.plus, dMm) };
}

/**
 * Metric or imperial, for people who know which kind of machine they are working on. Pipe
 * threads G and R are in both: they are inch-sized, but found on metric machines too (on
 * Japanese cars as PF and PT), and on British and American ones.
 */
export const SYSTEMS = {
  metric: ['M', 'MK', 'Tr', 'S', 'Pg', 'G', 'R'],
  imperial: ['UN', 'BSW', 'BSF', 'NPT', 'G', 'R'],
};

/** How far a gauge reading usually is from the real pitch; used only for the order. */
export const GAUGE_PITCH_TYPICAL = 0.02;

/** The pitch window for a gauge reading when none is given: the default preset's. */
export const GAUGE_PITCH_TOL = PRESETS.medium.gauge;

/**
 * Look-alikes across standards: threads that are close in both size and pitch, so the wrong
 * one can start, or be forced in, and then strip or hold weakly (M10 and 3/8-16 UNC: 0.475 mm
 * and 5.5 % apart). Flagged whether or not the other one fits the measurement.
 */
export const LOOKALIKE = { pitch: 0.06, size: 0.06 };

/** Extra allowance on the diameter for tapered threads: it changes 1 mm per 16 mm of length. */
const TAPER_EXTRA = 1.0;

/**
 * Rank catalogue threads against measurements. All lengths in mm.
 * minus/plus and pitchTol are the windows (what gets listed); typical and pitchTypical are the
 * usual spread (the order), from typicalSpread and GAUGE_PITCH_TYPICAL unless given.
 * system ('metric' or 'imperial') leaves out the other kind; anything else looks among all.
 * @param {{ side: 'ext'|'int', d: number, pitch?: number, pitchTol?: number, pitchTypical?: number, system?: string,
 *           typical?: { under: number, over: number },
 *           minus: number, plus: number, angle?: number, angleTol?: number, taper?: 'any'|'parallel'|'taper' }} q
 * @returns {{ inside: object[], closest: object[] }}
 */
export function rank(q) {
  const scored = [];
  const typ = q.typical ?? typicalSpread(q.side, q.d);
  const pTyp = q.pitchTypical ?? GAUGE_PITCH_TYPICAL;
  for (const row of CATALOGUE) {
    // DIN 158 short versions have the same diameters and pitch as the normal ones: list once.
    if (row.short) continue;
    // DIN 158 is external only; its fittings screw into ordinary parallel M holes.
    if (row.family === 'MK' && q.side === 'int') continue;
    if (SYSTEMS[q.system] && !SYSTEMS[q.system].includes(row.family)) continue;
    if (q.taper === 'parallel' && row.taper) continue;
    if (q.taper === 'taper' && !row.taper) continue;
    if (q.angle && Math.abs(row.angle - q.angle) > (q.angleTol ?? 2)) continue;
    // What the person measured: the crests outside, or the bore (minor diameter) inside.
    const ref = q.side === 'ext' ? row.d : row.d1;
    const dd = q.d - ref;
    // Tapered threads get a wider window to get IN the list (the diameter depends on where
    // along the taper it was measured), but are ranked on the same scale as everything else.
    const extra = row.taper ? TAPER_EXTRA : 0;
    // On the list? Against the windows.
    const zdIn = dd < 0 ? -dd / (q.minus + extra) : dd / (q.plus + extra);
    const pOff = q.pitch ? Math.abs(q.pitch - row.pitch) / row.pitch : 0;
    const zpIn = pOff / (q.pitchTol ?? GAUGE_PITCH_TOL);
    // Where on the list? Against the usual spread: 0.3 mm under is ordinary for a bolt,
    // 0.2 mm over is not, so the second ranks lower even when both are listed.
    const zd = dd < 0 ? -dd / typ.under : dd / typ.over;
    const zp = pOff / pTyp;
    const score = Math.hypot(zd, zp);
    // The small margin keeps a reading right on the edge inside: 10 − 9.7 comes out as
    // 0.3000000000000007 in the computer, which would just miss a 0.3 mm window.
    const EDGE = 1 + 1e-9;
    scored.push({ row, dd, dp: q.pitch ? q.pitch - row.pitch : null, zd, zp, score, inside: zdIn <= EDGE && zpIn <= EDGE });
  }
  scored.sort((a, b) => a.score - b.score);
  const inside = scored.filter((s) => s.inside);
  // Look-alikes: threads from other standards close enough in size and pitch to be mixed up
  // (M10 and 3/8-16 UNC, M10 × 1 and 3/8-24 UNF, M10 × 1.25 and 3/8 BSF, M12 × 1.25 and
  // 1/2-20 UNF ...). They are looked for among all threads, not only the ones that fit the
  // measurement, so the warning shows even when the other one is just outside the windows.
  // Same pitch and size is a twin (below), not a look-alike.
  const sizeOf = (row) => (q.side === 'ext' ? row.d : row.d1);
  const shown = inside.length ? inside : scored.slice(0, 3);
  for (const a of shown) {
    a.lookalikes = scored.filter((b) => {
      if (b === a || b.row.family === a.row.family) return false;
      const dp = Math.abs(b.row.pitch - a.row.pitch);
      return dp > 1e-6 && dp / a.row.pitch <= LOOKALIKE.pitch && Math.abs(sizeOf(b.row) - sizeOf(a.row)) <= LOOKALIKE.size * sizeOf(a.row);
    });
    // One warning per size, pitch and angle: M10 × 1 and the M10 × 1 grease-nipple taper say
    // the same, but 3/8-16 UNC and 3/8 BSW (55°) are both worth naming.
    const seen = new Set();
    a.lookalikes = a.lookalikes.filter((b) => {
      const key = `${sizeOf(b.row).toFixed(3)}|${b.row.pitch.toFixed(4)}|${b.row.angle}`;
      return !seen.has(key) && seen.add(key);
    });
  }
  // Twins: same size and pitch, only the flank angle differs (1/4-20 UNC and 1/4 BSW, both 20 TPI).
  for (const a of inside) {
    a.twins = inside.filter(
      (b) => b !== a && b.row.angle !== a.row.angle && Math.abs(b.row.pitch - a.row.pitch) / a.row.pitch < 0.002 && Math.abs(b.row.d - a.row.d) < 0.2,
    );
  }
  return { inside, closest: inside.length ? [] : scored.slice(0, 3) };
}

/** The angle as people write it: 60°, 27.5°, or 3°/30° for the S thread. */
export const angleText = (row) => (row.flanks ? `${row.flanks[0]}°/${row.flanks[1]}°` : `${num(row.angle, row.angle % 1 ? 1 : 0)}°`);

/**
 * The catalogue angles a two-wire result can snap to, by the ratio k = ΔM/ΔG that the two
 * wires really give: 30° Tr, 3°/30° S (k = 4.42, looks like 34°), 55°, 60°, 80°.
 * Snapping on k, not on the angle, keeps S and Tr apart where they are close.
 */
const SNAP = [[30, 30], [33, [3, 30]], [55, 55], [60, 60], [80, 80]].map(([value, a]) => ({ value, k: wireConstants(a).kG }));
export const snapTwoWire = (k) => SNAP.reduce((a, b) => (Math.abs(b.k - k) < Math.abs(a.k - k) ? b : a)).value;

/**
 * A look-alike, checked against a length measured over n threads (all in mm): what this
 * thread and the other one would measure over the same n threads, and which the reading is
 * closer to. Used to turn the look-alike warning into a check of the person's own reading.
 */
export function overThreadsCheck(pitch, otherPitch, length, n) {
  const here = n * pitch;
  const there = n * otherPitch;
  return { here, there, fitsHere: Math.abs(length - here) <= Math.abs(length - there) };
}

/** Over how many threads two pitches drift apart by half a pitch: where a gauge visibly rocks. */
export const threadsToTell = (p1, p2) => Math.ceil((0.5 * Math.min(p1, p2)) / Math.abs(p1 - p2));

// ---- The page ----------------------------------------------------------------------------------

function readPitch() {
  if (state.pm === 'over') {
    const L = parseNumber(state.len);
    const n = parseNumber(state.n);
    if (!(L > 0) || !(n >= 1)) return null;
    const Lmm = toMm(L, state.du);
    // A caliper reads crests to about 0.05 mm on a clean thread, 0.1 mm over dirt or rust
    // (the preset says which): over L, that is the pitch window. The order uses 0.05 mm.
    const cal = presetOf(state.win).caliper;
    return { pitch: Lmm / n, tol: Math.max(cal / 10, cal / Lmm), typical: Math.max(0.005, 0.05 / Lmm) };
  }
  const v = parseNumber(state.p);
  if (!(v > 0)) return null;
  return { pitch: state.pm === 'tpi' ? MM_PER_INCH / v : v, tol: presetOf(state.win).gauge, typical: GAUGE_PITCH_TYPICAL };
}

function readAngle() {
  if (state.angle) return { angle: Number(state.angle), tol: 2 };
  return null;
}

/**
 * Flank angle from the two-wire readings. Over a real thread the reading grows 2.5 to 5 times
 * as much as the wire does (80° to 29° threads), or half that with one wire, so anything else
 * is a typing or measuring slip, and the message says which kind.
 */
function twoWire() {
  const vals = ['g1', 'm1', 'g2', 'm2'].map((k) => parseNumber(state[k]));
  if (vals.some((v) => v === null)) return null;
  const [g1, m1, g2, m2] = vals.map((v) => toMm(v, state.wu));
  if (g1 === g2) return { error: 'find.twSame' };
  const wires = state.tw === '1' ? 1 : 3;
  const half = wires === 1 ? 0.5 : 1; // one wire: the reading moves half as much
  const k = (m2 - m1) / (g2 - g1);
  if (k <= 0) return { error: 'find.twOrder' };
  const r = angleFromTwoWires(m1, g1, m2, g2, wires);
  const dg = Math.abs(g2 - g1);
  const ratio = { ratio: num(k, 2), dg: len(dg, state.wu), lo: len(2.5 * half * dg, state.wu), hi: len(5 * half * dg, state.wu) };
  if (!r) return { error: 'find.twRatio', ...ratio };
  const sigma = angleUncertainty(r.angle, g1, g2, 0.002, 0.001, wires);
  const odd = r.angle < 25 || r.angle > 90;
  return { ...r, sigma, odd, ...ratio };
}

function render() {
  setSeg($('f-side'), state.side);
  setSeg($('f-sys'), state.sys);
  setSeg($('f-win-preset'), state.win);
  const sysHint = $('f-sys-hint');
  sysHint.hidden = state.sys === 'all';
  if (state.sys !== 'all') sysHint.textContent = t('find.sysHint');
  $('f-win-hint').textContent = t('find.win.' + (PRESETS[state.win] ? state.win : 'medium') + 'Hint');
  $('f-win-now').textContent = '· ' + t('find.win.' + (PRESETS[state.win] ? state.win : 'medium'));
  setSeg($('f-du'), state.du);
  setSeg($('f-pm'), state.pm);
  setSeg($('f-taper'), state.taper);
  setSeg($('f-wu'), state.wu);
  setSeg($('f-tw-way'), state.tw);
  $('f-tw-hint').textContent = t(state.tw === '1' ? 'find.twHint1' : 'find.twHint');
  $('f-d-label').textContent = t(state.side === 'ext' ? 'find.dExt' : 'find.dInt');
  $('f-d-hint').textContent = t(state.side === 'ext' ? 'find.dExtHint' : 'find.dIntHint');
  for (const el of document.querySelectorAll('.f-du-text')) el.textContent = state.du;
  $('f-wu-text').textContent = state.wu;
  $('f-p-single').hidden = state.pm === 'over';
  $('f-p-over').hidden = state.pm !== 'over';
  $('f-p-unit').textContent = state.pm === 'tpi' ? 'TPI' : 'mm';
  $('f-angle').value = state.angle;
  for (const id of ['d', 'p', 'len', 'n', 'wm', 'wp', 'pw', 'g1', 'm1', 'g2', 'm2'])
    if ($('f-' + id) !== document.activeElement) $('f-' + id).value = local(state[id]);

  // Two-wire angle
  const tw = twoWire();
  const twBox = $('f-tw-result');
  twBox.hidden = !tw;
  if (tw) {
    twBox.className = 'note ' + (tw.error || tw.odd ? 'warn' : 'info');
    twBox.textContent = tw.error
      ? t(tw.error, tw)
      : t('find.twResult', { angle: num(tw.angle, 1), sigma: num(tw.sigma, 1) }) + (tw.odd ? ' ' + t('find.twOdd') : '') +
        (!tw.odd && Math.abs(tw.angle - 33.97) < 2 ? ' ' + t('find.twS') : '');
    $('f-tw-use').hidden = !!tw.error || tw.odd;
  }

  const d = parseNumber(state.d);
  const pitch = readPitch();
  const list = $('f-results');
  list.replaceChildren();
  if (!(d > 0)) {
    $('f-summary').textContent = t('find.start');
    $('f-summary').className = 'note info';
    hash.write();
    return;
  }
  const dMm = toMm(d, state.du);
  const def = defaultWindows(state.side, dMm, state.win);
  // The window boxes are in the same unit as the diameter (their labels say so).
  const typedMm = (v) => (parseNumber(v) === null ? null : toMm(parseNumber(v), state.du));
  const inUnit = (mm) => (state.du === 'in' ? num(mm / MM_PER_INCH, 4) : num(mm, 2));
  const minus = typedMm(state.wm) ?? def.minus;
  const plus = typedMm(state.wp) ?? def.plus;
  const gauge = presetOf(state.win).gauge;
  const pTol = (parseNumber(state.pw) ?? (pitch ? pitch.tol * 100 : gauge * 100)) / 100;
  $('f-wm').placeholder = inUnit(def.minus);
  $('f-wp').placeholder = inUnit(def.plus);
  $('f-pw').placeholder = num(pitch ? pitch.tol * 100 : gauge * 100, 1);
  $('f-pitch-read').textContent = pitch ? pitchBoth(pitch.pitch) : '';

  const ang = readAngle();
  const { inside, closest } = rank({
    side: state.side, d: dMm, pitch: pitch?.pitch, pitchTol: pTol, pitchTypical: pitch?.typical, minus, plus, system: state.sys,
    angle: ang?.angle, angleTol: ang?.tol, taper: state.taper,
  });
  const shown = inside.length ? inside : closest;
  $('f-summary').className = 'note ' + (inside.length ? 'info' : 'warn');
  $('f-summary').textContent = inside.length
    ? t(inside.length === 1 ? (pitch ? 'find.countOne' : 'find.countOneNoPitch') : pitch ? 'find.count' : 'find.countNoPitch', { n: inside.length })
    : t('find.none');

  const unit = state.du;
  for (const [i, s] of shown.slice(0, 12).entries()) {
    const r = s.row;
    const li = document.createElement('li');
    li.className = 'cand' + (i === 0 && inside.length ? ' top' : '') + (s.inside ? '' : ' outside');
    const ref = state.side === 'ext' ? r.d : r.d1;
    const fam = FAMILIES[r.family];
    const head = document.createElement('div');
    head.className = 'cand-head';
    head.innerHTML = `<span class="badge">${t('famShort.' + r.family)}</span><strong></strong><span class="cand-angle">${angleText(r)}${r.taper ? ' · ' + t('find.tapered') : ''}</span>`;
    head.querySelector('strong').textContent = r.name + (r.alias ? ` (${r.alias})` : '');
    const body = document.createElement('div');
    body.className = 'cand-body';
    const dLabel = t(state.side === 'ext' ? 'find.basicMajor' : 'find.basicMinor');
    body.textContent = `${dLabel} ${len(ref, unit)} (${len(s.dd, unit, true)}) · ${t('find.pitch')} ${pitchBoth(r.pitch)}` +
      (s.dp !== null ? ` (${num((s.dp / r.pitch) * 100, 1, true)} %)` : '') + ` · ${fam.std}`;
    li.append(head, body);
    // Workshop order: what is it → make it. The button (or a click anywhere on the card)
    // opens this thread in Make, as a bolt or a hole like the one measured here.
    const go = document.createElement('button');
    go.type = 'button';
    go.className = 'cand-go';
    go.textContent = t('find.toMake');
    go.setAttribute('aria-label', t('find.toMakeLabel', { name: r.name }));
    const open = () => document.dispatchEvent(new CustomEvent('goto', { detail: { tab: 'make', fam: r.family, size: r.id, side: state.side } }));
    go.addEventListener('click', (e) => { e.stopPropagation(); open(); });
    li.addEventListener('click', () => { if (!window.getSelection().toString()) open(); });
    li.classList.add('go');
    // Measured over N threads? Then the warning checks that reading instead of asking for it.
    const over = state.pm === 'over' && pitch ? { length: toMm(parseNumber(state.len), unit), n: parseNumber(state.n) } : null;
    // Lengths over N threads as a caliper reads them: 0.01 mm (or 0.001 in).
    const cal = (mm) => (unit === 'mm' ? `${num(mm, 2)} mm` : len(mm, unit));
    for (const other of (s.lookalikes || []).slice(0, 2)) {
      const warn = document.createElement('div');
      warn.className = 'cand-warn';
      const gap = Math.abs((state.side === 'ext' ? other.row.d : other.row.d1) - ref);
      let text = t(gap < 0.05 ? 'find.laHead' : 'find.laHeadSize', { other: other.row.name, size: len(gap, unit) });
      const c = over && overThreadsCheck(r.pitch, other.row.pitch, over.length, over.n);
      // The risk of forcing the wrong bolt is worth saying unless the reading already settles it.
      if (gap >= 0.05 && !c?.fitsHere) text += ' ' + t('find.laRisk');
      if (c) {
        const v = { other: other.row.name, count: num(over.n, 0), len: cal(over.length), a: cal(c.here), b: cal(c.there) };
        // A reading that fits this thread confirms it (a calm note); closer to the other, a warning.
        if (c.fitsHere) warn.className = 'cand-note';
        text += ' ' + t(c.fitsHere ? 'find.laFits' : 'find.laCloser', v);
      } else {
        const n = Math.max(5, threadsToTell(r.pitch, other.row.pitch));
        text += ' ' + t('find.laGauge', { n, a: cal(n * r.pitch), b: cal(n * other.row.pitch) });
      }
      warn.textContent = text;
      li.append(warn);
    }
    for (const twin of (s.twins || []).slice(0, 2)) {
      const warn = document.createElement('div');
      warn.className = 'cand-warn';
      warn.textContent = t('find.twin', { other: twin.row.name, a: angleText(r), b: angleText(twin.row) });
      li.append(warn);
    }
    if (r.family === 'MK') {
      const note = document.createElement('div');
      note.className = 'cand-note';
      note.textContent = t('find.mkNote', { d: num(r.d, 0), p: num(r.pitch, r.pitch % 1 ? 1 : 0) });
      li.append(note);
    }
    if (r.family === 'G' || r.family === 'R' || r.family === 'NPT') {
      const note = document.createElement('div');
      note.className = 'cand-note';
      note.textContent = t('find.pipeNote', { size: r.name, d: len(r.d, 'mm') });
      li.append(note);
    }
    li.append(go);
    list.append(li);
  }
  hash.write();
}

export function init() {
  hash.register(P, state, DEFAULTS);
  const segs = [['f-side', 'side'], ['f-du', 'du'], ['f-pm', 'pm'], ['f-taper', 'taper'], ['f-wu', 'wu'], ['f-tw-way', 'tw'], ['f-sys', 'sys'], ['f-win-preset', 'win']];
  for (const [id, key] of segs) wireSeg($(id), () => state[key], (v) => { state[key] = v; render(); });
  for (const id of ['d', 'p', 'len', 'n', 'wm', 'wp', 'pw', 'g1', 'm1', 'g2', 'm2']) {
    $('f-' + id).addEventListener('input', () => {
      state[id] = $('f-' + id).value;
      render();
    });
  }
  $('f-angle').addEventListener('change', () => {
    state.angle = $('f-angle').value;
    render();
  });
  $('f-tw-use').addEventListener('click', () => {
    const tw = twoWire();
    if (!tw || tw.error) return;
    // Snap to the nearest standard angle the catalogue knows (by the wire ratio).
    state.angle = String(snapTwoWire(tw.k));
    render();
  });
  $('f-reset').addEventListener('click', () => {
    state.wm = state.wp = state.pw = '';
    state.win = DEFAULTS.win;
    render();
  });
  render();
}

export const refresh = render;
export function reread() {
  hash.read(P);
  render();
}
