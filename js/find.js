// Find tab: measure an unknown thread, get a ranked list of what it could be.
// It ranks and flags look-alikes; it never says "this is it".

import { t } from './i18n.js';
import { CATALOGUE, FAMILIES } from './catalogue.js';
import { angleFromTwoWires, angleUncertainty } from './geometry.js';
import { parseNumber } from './threads.js';
import { num, len, toMm, local, setSeg, wireSeg, pitchBoth, MM_PER_INCH } from './format.js';
import * as hash from './hash.js';

const $ = (id) => document.getElementById(id);
const P = 'f.';
const DEFAULTS = {
  side: 'ext', d: '', du: 'mm', pm: 'mm', p: '', len: '', n: '10', angle: '', taper: 'any',
  wm: '', wp: '', pw: '', g1: '', m1: '', g2: '', m2: '', wu: 'mm',
};
const state = { ...DEFAULTS };

// ---- The matching itself (no page code, so validation/find.test.mjs can run it) ------------

/**
 * Default windows for the diameter, in mm: how far a real part may sit from the basic size.
 * External threads measure UNDER nominal (allowance, tolerance, wear); bores measure OVER
 * the basic minor diameter (tolerance, wear, tap oversize).
 */
export function defaultWindows(side, dMm) {
  if (side === 'ext') return { minus: Math.max(0.2, 0.03 * dMm), plus: Math.max(0.1, 0.01 * dMm) };
  return { minus: Math.max(0.1, 0.01 * dMm), plus: Math.max(0.3, 0.04 * dMm) };
}

/** Extra allowance on the diameter for tapered threads: it changes 1 mm per 16 mm of length. */
const TAPER_EXTRA = 1.0;

/**
 * Rank catalogue threads against measurements. All lengths in mm.
 * @param {{ side: 'ext'|'int', d: number, pitch?: number, pitchTol?: number,
 *           minus: number, plus: number, angle?: number, angleTol?: number, taper?: 'any'|'parallel'|'taper' }} q
 * @returns {{ inside: object[], closest: object[] }}
 */
export function rank(q) {
  const scored = [];
  for (const row of CATALOGUE) {
    if (q.taper === 'parallel' && row.taper) continue;
    if (q.taper === 'taper' && !row.taper) continue;
    if (q.angle && Math.abs(row.angle - q.angle) > (q.angleTol ?? 2)) continue;
    // What the person measured: the crests outside, or the bore (minor diameter) inside.
    const ref = q.side === 'ext' ? row.d : row.d1;
    const dd = q.d - ref;
    // Tapered threads get a wider window to get IN the list (the diameter depends on where
    // along the taper it was measured), but are ranked on the same scale as everything else.
    const extra = row.taper ? TAPER_EXTRA : 0;
    const zd = dd < 0 ? -dd / q.minus : dd / q.plus;
    const zdIn = dd < 0 ? -dd / (q.minus + extra) : dd / (q.plus + extra);
    let zp = 0;
    if (q.pitch) zp = Math.abs(q.pitch - row.pitch) / (row.pitch * (q.pitchTol ?? 0.02));
    const score = Math.hypot(zd, zp);
    scored.push({ row, dd, dp: q.pitch ? q.pitch - row.pitch : null, zd, zp, score, inside: zdIn <= 1 && zp <= 1 });
  }
  scored.sort((a, b) => a.score - b.score);
  const inside = scored.filter((s) => s.inside);
  // Look-alikes: candidates whose pitches are close enough to fool a gauge, from other families
  // (1.5 mm vs 16 TPI, 1.25 mm vs 20 TPI, 0.8 mm vs 32 TPI, 1.814 mm vs 14 TPI ...).
  for (const a of inside) {
    a.lookalikes = inside.filter(
      (b) => b !== a && b.row.family !== a.row.family && Math.abs(b.row.pitch - a.row.pitch) / a.row.pitch < 0.04 && Math.abs(b.row.pitch - a.row.pitch) > 1e-6,
    );
  }
  // Twins: same size and pitch, only the flank angle differs (1/4-20 UNC and 1/4 BSW, both 20 TPI).
  for (const a of inside) {
    a.twins = inside.filter(
      (b) => b !== a && b.row.angle !== a.row.angle && Math.abs(b.row.pitch - a.row.pitch) / a.row.pitch < 0.002 && Math.abs(b.row.d - a.row.d) < 0.2,
    );
  }
  return { inside, closest: inside.length ? [] : scored.slice(0, 3) };
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
    // A caliper reads to about 0.02–0.05 mm; over L that is the pitch uncertainty.
    return { pitch: Lmm / n, tol: Math.max(0.005, 0.05 / Lmm) };
  }
  const v = parseNumber(state.p);
  if (!(v > 0)) return null;
  return { pitch: state.pm === 'tpi' ? MM_PER_INCH / v : v, tol: 0.02 };
}

function readAngle() {
  if (state.angle) return { angle: Number(state.angle), tol: 2 };
  return null;
}

/**
 * Flank angle from the two-wire readings. Over a real thread the reading grows 2.5 to 5 times
 * as much as the wire does (80° to 29° threads), so anything else is a typing or measuring
 * slip, and the message says which kind.
 */
function twoWire() {
  const vals = ['g1', 'm1', 'g2', 'm2'].map((k) => parseNumber(state[k]));
  if (vals.some((v) => v === null)) return null;
  const [g1, m1, g2, m2] = vals.map((v) => toMm(v, state.wu));
  if (g1 === g2) return { error: 'find.twSame' };
  const k = (m2 - m1) / (g2 - g1);
  if (k <= 0) return { error: 'find.twOrder' };
  const r = angleFromTwoWires(m1, g1, m2, g2);
  const ratio = { ratio: num(k, 2), dg: len(Math.abs(g2 - g1), state.wu), lo: len(2.5 * Math.abs(g2 - g1), state.wu), hi: len(5 * Math.abs(g2 - g1), state.wu) };
  if (!r) return { error: 'find.twRatio', ...ratio };
  const sigma = angleUncertainty(r.angle, g1, g2, 0.002, 0.001);
  const odd = r.angle < 25 || r.angle > 90;
  return { ...r, sigma, odd, ...ratio };
}

function render() {
  setSeg($('f-side'), state.side);
  setSeg($('f-du'), state.du);
  setSeg($('f-pm'), state.pm);
  setSeg($('f-taper'), state.taper);
  setSeg($('f-wu'), state.wu);
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
      : t('find.twResult', { angle: num(tw.angle, 1), sigma: num(tw.sigma, 1) }) + (tw.odd ? ' ' + t('find.twOdd') : '');
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
  const def = defaultWindows(state.side, dMm);
  const minus = parseNumber(state.wm) ?? def.minus;
  const plus = parseNumber(state.wp) ?? def.plus;
  const pTol = (parseNumber(state.pw) ?? (pitch ? pitch.tol * 100 : 2)) / 100;
  $('f-wm').placeholder = num(def.minus, 2);
  $('f-wp').placeholder = num(def.plus, 2);
  $('f-pw').placeholder = num(pitch ? pitch.tol * 100 : 2, 1);
  $('f-pitch-read').textContent = pitch ? pitchBoth(pitch.pitch) : '';

  const ang = readAngle();
  const { inside, closest } = rank({
    side: state.side, d: dMm, pitch: pitch?.pitch, pitchTol: pTol, minus, plus,
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
    head.innerHTML = `<span class="badge">${t('famShort.' + r.family)}</span><strong></strong><span class="cand-angle">${num(r.angle, r.angle % 1 ? 1 : 0)}°${r.taper ? ' · ' + t('find.tapered') : ''}</span>`;
    head.querySelector('strong').textContent = r.name + (r.alias ? ` (${r.alias})` : '');
    const body = document.createElement('div');
    body.className = 'cand-body';
    const dLabel = t(state.side === 'ext' ? 'find.basicMajor' : 'find.basicMinor');
    body.textContent = `${dLabel} ${len(ref, unit)} (${len(s.dd, unit, true)}) · ${t('find.pitch')} ${pitchBoth(r.pitch)}` +
      (s.dp !== null ? ` (${num((s.dp / r.pitch) * 100, 1, true)} %)` : '') + ` · ${fam.std}`;
    li.append(head, body);
    for (const other of (s.lookalikes || []).slice(0, 2)) {
      const warn = document.createElement('div');
      warn.className = 'cand-warn';
      const n = Math.max(5, threadsToTell(r.pitch, other.row.pitch));
      warn.textContent = t('find.lookalike', {
        other: other.row.name, n,
        a: num(n * r.pitch, 2), b: num(n * other.row.pitch, 2),
      });
      li.append(warn);
    }
    for (const twin of (s.twins || []).slice(0, 2)) {
      const warn = document.createElement('div');
      warn.className = 'cand-warn';
      warn.textContent = t('find.twin', { other: twin.row.name, a: num(r.angle, r.angle % 1 ? 1 : 0), b: num(twin.row.angle, twin.row.angle % 1 ? 1 : 0) });
      li.append(warn);
    }
    if (r.family === 'G' || r.family === 'R' || r.family === 'NPT') {
      const note = document.createElement('div');
      note.className = 'cand-note';
      note.textContent = t('find.pipeNote', { size: r.name, d: len(r.d, 'mm') });
      li.append(note);
    }
    list.append(li);
  }
  hash.write();
}

export function init() {
  hash.register(P, state, DEFAULTS);
  const segs = [['f-side', 'side'], ['f-du', 'du'], ['f-pm', 'pm'], ['f-taper', 'taper'], ['f-wu', 'wu']];
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
    // Snap to the nearest standard angle the catalogue knows.
    const angles = [55, 60, 80];
    state.angle = String(angles.reduce((a, b) => (Math.abs(b - tw.angle) < Math.abs(a - tw.angle) ? b : a)));
    render();
  });
  $('f-reset').addEventListener('click', () => {
    state.wm = state.wp = state.pw = '';
    render();
  });
  render();
}

export const refresh = render;
export function reread() {
  hash.read(P);
  render();
}
