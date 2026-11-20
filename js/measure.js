// Measure tab: what the micrometer should read over three wires, and whether a part is
// in tolerance. Works for every parallel family in the catalogue (tapered threads are gauged).

import { t, has } from './i18n.js';
import { CATALOGUE, FAMILIES, family, ownRow, profileOf, IN } from './catalogue.js';
import { limits, CLASS_LIST } from './tolerances.js';
import { wireRange, overWires, pitchDiameterFrom } from './geometry.js';
import { parseNumber, parseInch } from './threads.js';
import { num, len, other, toMm, local, DECIMALS, fillSelect, setSeg, wireSeg, MM_PER_INCH } from './format.js';
import * as hash from './hash.js';

const $ = (id) => document.getElementById(id);
export const MEASURE_FAMILIES = ['M', 'UN', 'BSW', 'BSF', 'G', 'Pg', 'Tr', 'S'];

/** Why a family has no standard tolerances in Threadwise yet. */
const noneKey = (fam) => (fam === 'Tr' ? 'status.noneTr' : fam === 'S' ? 'status.noneS' : 'status.noneBS84');

const DEFAULTS = { fam: 'M', size: 'M:M10', d: '10', p: '1.5', mode: 'standard', cls: '6g', es: '0', ei: '-0.1', g: '', gu: 'mm', ru: 'mm', m: '' };
const state = { ...DEFAULTS };

const unitOf = (fam) => FAMILIES[fam].unit;
const pitchAsTpi = (fam) => FAMILIES[fam].pitchAs === 'tpi';

/** The row in use: a catalogue size, or an own size for families that allow it. */
function currentRow() {
  if (state.size && state.size !== 'own') {
    const row = CATALOGUE.find((r) => r.id === state.size);
    if (row) return row;
  }
  if (!FAMILIES[state.fam].own) return null;
  const inch = unitOf(state.fam) === 'in';
  const d = inch ? parseInch(state.d) : parseNumber(state.d);
  const p = parseNumber(state.p);
  if (!(d > 0) || !(p > 0)) return null;
  const pitch = pitchAsTpi(state.fam) ? MM_PER_INCH / p : p;
  const dMm = inch ? d * MM_PER_INCH : d;
  if (0.65 * pitch >= dMm * 0.8) return null;
  return ownRow(state.fam, dMm, pitch);
}

function sizeOptions() {
  const rows = family(state.fam);
  const groups = {};
  for (const r of rows) (groups[r.series] ||= []).push([r.id, r.name]);
  const items = [];
  if (FAMILIES[state.fam].own) items.push(['own', t('preset.custom')]);
  for (const [series, options] of Object.entries(groups))
    items.push({ label: has('series.' + series) ? t('series.' + series) : series, options });
  return items;
}

function showFields() {
  const fam = state.fam;
  const inch = unitOf(fam) === 'in';
  $('fam').value = fam;
  fillSelect($('preset'), sizeOptions());
  $('preset').value = state.size || 'own';
  if (!$('preset').value) $('preset').value = $('preset').options[0].value;
  const row = currentRow();
  const editable = FAMILIES[fam].own && (state.size === 'own' || !state.size);
  // Diameter and pitch: typed for an own size, otherwise shown from the catalogue.
  if (row && !editable) {
    state.d = inch ? String(Math.round((row.d / IN) * 1e4) / 1e4) : String(row.d);
    state.p = pitchAsTpi(fam) ? String(Math.round((IN / row.pitch) * 100) / 100) : String(row.pitch);
  }
  $('d').readOnly = $('p').readOnly = !editable;
  $('d-unit').textContent = inch ? 'in' : 'mm';
  $('d-hint').hidden = !(inch && editable);
  $('p-label').textContent = t(pitchAsTpi(fam) ? 'tpi.label' : 'p.label');
  $('p-unit').textContent = pitchAsTpi(fam) ? 'TPI' : 'mm';

  // Tolerance: classes for the family; Whitworth has none yet.
  const classes = CLASS_LIST[fam] ? CLASS_LIST[fam].ext : [];
  const hasStandard = classes.length > 0;
  if (!hasStandard) state.mode = 'manual';
  $('tol-mode').querySelector('[data-value="standard"]').disabled = !hasStandard;
  fillSelect($('cls'), classes.map((c) => [c, c]));
  if (!classes.includes(state.cls)) state.cls = CLASS_LIST[fam]?.defExt || '';
  $('cls').value = state.cls;
  setSeg($('tol-mode'), state.mode);
  setSeg($('g-unit'), state.gu);
  setSeg($('r-unit'), state.ru);
  for (const el of document.querySelectorAll('.man-unit')) el.textContent = inch ? 'in' : 'mm';
  $('g-unit-text').textContent = state.gu;
  $('m-unit').textContent = state.ru;
  $('std-fields').hidden = state.mode !== 'standard';
  $('manual-fields').hidden = state.mode !== 'manual';
  for (const id of ['d', 'p', 'es', 'ei', 'g', 'm']) if ($(id) !== document.activeElement) $(id).value = local(state[id]);
}

function mark(id, bad) {
  $(id).classList.toggle('invalid', bad && $(id).value.trim() !== '');
}

/** Upper and lower deviation of the pitch diameter in use, or an error/status key. */
function readTolerance(row) {
  if (state.mode === 'manual') {
    const inch = unitOf(state.fam) === 'in';
    const es = parseNumber(state.es);
    const ei = parseNumber(state.ei);
    mark('es', es === null);
    mark('ei', ei === null);
    if (es === null || ei === null) return { error: 'status.input' };
    if (ei >= es) return { error: 'status.order' };
    // Families without standard tolerances in Threadwise say why the deviations are typed.
    const why = CLASS_LIST[state.fam] ? 'status.manual' : noneKey(state.fam);
    return { es: toMm(es, inch ? 'in' : 'mm'), ei: toMm(ei, inch ? 'in' : 'mm'), status: why };
  }
  const l = limits(row, 'ext', state.cls);
  if (!l.d2) return { error: l.source === 'none' ? noneKey(state.fam) : 'status.' + l.source };
  const status =
    state.fam === 'M' ? (l.source === 'table' ? 'status.table' : 'status.formula')
    : state.fam === 'UN' ? 'status.unified'
    : state.fam === 'G' ? 'status.iso228'
    : 'status.maker';
  return { es: l.d2.max - row.d2, ei: l.d2.min - row.d2, status };
}

function render() {
  const row = currentRow();
  mark('d', !row && state.size === 'own');
  mark('p', !row && state.size === 'own');
  const tol = row ? readTolerance(row) : { error: 'status.input' };
  const status = $('status');
  status.className = 'note ' + (tol.error ? (tol.error === 'status.input' ? 'info' : 'warn') : ['status.formula', 'status.maker', 'status.noneTr', 'status.noneS', 'status.noneBS84'].includes(tol.status) ? 'warn' : 'info');
  status.textContent = t(tol.error || tol.status);

  // Wires
  const typed = parseNumber(state.g);
  mark('g', typed === null || typed <= 0);
  const wire = typed !== null && typed > 0 ? toMm(typed, state.gu) : null;
  $('g').classList.toggle('needed', !wire && !!row);
  const box = $('wire-fit');
  if (row) {
    const prof = profileOf(row);
    const w = wireRange(row.pitch, prof);
    $('w-min').textContent = len(w.min, state.gu);
    $('w-best').textContent = len(w.best, state.gu);
    $('w-max').textContent = len(w.max, state.gu);
    const pos = (x) => Math.max(0, Math.min(100, ((x - w.min * 0.85) / (w.max * 1.08 - w.min * 0.85)) * 100));
    document.querySelector('#tab-measure .wire-bar .range').style.cssText = `left:${pos(w.min)}%;right:${100 - pos(w.max)}%`;
    document.querySelector('#tab-measure .wire-bar .best-tick').style.left = pos(w.best) + '%';
    if (!wire) {
      $('w-mark').hidden = true;
      box.className = 'note info';
      box.textContent = t('wire.enter');
    } else {
      $('w-mark').hidden = false;
      $('w-mark').style.left = pos(wire) + '%';
      const fit = wire < w.min - 1e-9 ? 'small' : wire > w.max + 1e-9 ? 'large' : 'ok';
      const nearBest = Math.abs(wire - w.best) / w.best < 0.08;
      box.className = 'note ' + (fit === 'ok' ? (nearBest ? 'good' : 'info') : 'bad');
      box.textContent = fit === 'ok' ? t(nearBest ? 'wire.okBest' : 'wire.offBest') : t('wire.' + fit);
      $('w-mark').className = 'mark ' + fit;
    }
    // S has two flank angles (3° and 30°), so it gets its own note.
    const asym = Array.isArray(prof.angle);
    $('w-note').hidden = prof.angle === 60;
    $('w-note').textContent = asym ? t('wire.formS') : t('wire.form', { angle: num(prof.angle, prof.angle % 1 ? 1 : 0) });
  } else {
    for (const id of ['w-min', 'w-best', 'w-max']) $(id).textContent = '–';
    $('w-mark').hidden = true;
    box.textContent = '';
    box.className = 'note';
    $('w-note').hidden = true;
  }

  // Results
  const u = state.ru;
  const o = other(u);
  const overIds = ['m-max', 'm-mid', 'm-min', 'm-max-alt', 'm-mid-alt', 'm-min-alt'];
  const ok = row && !tol.error;
  $('need-wire').hidden = !ok || !!wire;
  $('over').classList.toggle('empty', !ok || !wire);
  if (!ok) {
    for (const id of [...overIds, 'r-d2', 'r-es', 'r-ei', 'r-td2', 'r-d2max', 'r-d2min']) $(id).textContent = '–';
    $('band').textContent = t('res.none');
    $('lead').textContent = '';
    $('verdict').hidden = true;
    hash.write();
    return;
  }
  // The wire maths takes the two flank angles for S, the included angle for the rest.
  const angle = row.flanks || row.angle;
  const d2max = row.d2 + tol.es;
  const d2min = row.d2 + tol.ei;
  const d2mid = (d2max + d2min) / 2;
  if (!wire) for (const id of overIds) $(id).textContent = '–';
  else {
    const M = (d2) => overWires(d2, row.pitch, wire, angle);
    $('m-max').textContent = len(M(d2max), u);
    $('m-mid').textContent = len(M(d2mid), u);
    $('m-min').textContent = len(M(d2min), u);
    $('m-max-alt').textContent = len(M(d2max), o);
    $('m-mid-alt').textContent = len(M(d2mid), o);
    $('m-min-alt').textContent = len(M(d2min), o);
  }
  $('band').textContent = t('res.band', { value: '± ' + len((tol.es - tol.ei) / 2, u) });
  const micro = (mm) => (u === 'mm' ? ` (${num(mm * 1000, 0, true)} µm)` : '');
  $('r-d2').textContent = len(row.d2, u);
  $('r-es').textContent = len(tol.es, u, true) + micro(tol.es);
  $('r-ei').textContent = len(tol.ei, u, true) + micro(tol.ei);
  $('r-td2').textContent = len(tol.es - tol.ei, u) + (u === 'mm' ? ` (${num((tol.es - tol.ei) * 1000, 0)} µm)` : '');
  $('r-d2max').textContent = len(d2max, u);
  $('r-d2min').textContent = len(d2min, u);
  const lead = (Math.atan(row.pitch / (Math.PI * row.d2)) * 180) / Math.PI;
  $('lead').textContent = t(lead > 5 ? 'res.leadHigh' : 'res.lead', { value: num(lead, 1) });
  $('lead').className = 'note ' + (lead > 5 ? 'warn' : 'quiet');

  // Checking a measurement
  const measured = parseNumber(state.m);
  mark('m', measured === null);
  const v = $('verdict');
  if (measured === null || !wire) v.hidden = true;
  else {
    const d2 = pitchDiameterFrom(toMm(measured, u), row.pitch, wire, angle);
    const verdict = d2 > d2max + 5e-7 ? 'large' : d2 < d2min - 5e-7 ? 'small' : 'in';
    const over = verdict === 'large' ? d2 - d2max : verdict === 'small' ? d2min - d2 : 0;
    const toMid = d2 - d2mid;
    v.hidden = false;
    v.className = 'verdict ' + verdict;
    $('v-head').textContent = t('check.' + verdict);
    $('v-pd').textContent = t('check.pd', { value: len(d2, u) });
    const half = 0.5 * 10 ** -DECIMALS[u] * (u === 'in' ? MM_PER_INCH : 1);
    $('v-text').textContent =
      verdict === 'large' ? t('check.largeBy', { over: len(over, u), mid: len(toMid, u) })
      : verdict === 'small' ? t('check.smallBy', { over: len(over, u) })
      : Math.abs(toMid) < half ? t('check.inMid')
      : t(toMid > 0 ? 'check.inAbove' : 'check.inBelow', { value: len(Math.abs(toMid), u) });
  }
  hash.write();
}

/**
 * Switch to a family, and to one of its sizes (or the usual first size). The wire stays, in
 * the family's unit, so the wire check can say whether it suits the new thread.
 */
function setFamily(fam, size) {
  const unit = unitOf(fam);
  state.g = convert(state.g, state.gu, unit);
  state.m = '';
  Object.assign(state, { fam, gu: unit, ru: unit, cls: CLASS_LIST[fam]?.defExt || '', mode: CLASS_LIST[fam] ? 'standard' : 'manual' });
  const first = family(fam).find((r) => ['M10', '1/2-13 UNC', '1/2 BSW', '1/2 BSF', 'G 1/2', 'Pg 9', 'Tr 20 × 4', 'S 40 × 7'].includes(r.name)) || family(fam)[0];
  state.size = size && CATALOGUE.some((r) => r.id === size && r.family === fam) ? size : first.id;
}

/** Take a thread handed over from Make: its family, size and (if it has one) class. */
export function load({ fam, size, cls }) {
  if (!MEASURE_FAMILIES.includes(fam)) return;
  setFamily(fam, size);
  if (cls && CLASS_LIST[fam]?.ext.includes(cls)) state.cls = cls;
  showFields();
  render();
}

/** Convert a typed value from one unit to the other, when a unit is switched. */
function convert(text, from, to) {
  const v = parseNumber(text);
  if (v === null || from === to) return text;
  const out = from === 'mm' ? v / MM_PER_INCH : v * MM_PER_INCH;
  return String(Number(out.toFixed(to === 'in' ? 5 : 4)));
}

export function init() {
  hash.register('', state, DEFAULTS);
  if (!MEASURE_FAMILIES.includes(state.fam)) state.fam = 'M';
  fillSelect($('fam'), MEASURE_FAMILIES.map((f) => [f, t('fam.' + f)]));

  $('fam').addEventListener('change', () => {
    setFamily($('fam').value);
    showFields();
    render();
  });
  $('preset').addEventListener('change', () => {
    state.size = $('preset').value;
    showFields();
    render();
  });
  wireSeg($('tol-mode'), () => state.mode, (v) => { state.mode = v; showFields(); render(); });
  wireSeg($('g-unit'), () => state.gu, (v) => { state.g = convert(state.g, state.gu, v); state.gu = v; showFields(); render(); });
  wireSeg($('r-unit'), () => state.ru, (v) => { state.m = convert(state.m, state.ru, v); state.ru = v; showFields(); render(); });
  for (const id of ['d', 'p', 'es', 'ei', 'g', 'm']) {
    $(id).addEventListener('input', () => {
      state[id] = $(id).value;
      if (id === 'd' || id === 'p') state.size = 'own';
      render();
    });
  }
  $('cls').addEventListener('change', () => {
    state.cls = $('cls').value;
    render();
  });
  refresh();
}

/** Redraw after a language change or when the address changes. */
export function refresh() {
  fillSelect($('fam'), MEASURE_FAMILIES.map((f) => [f, t('fam.' + f)]));
  showFields();
  render();
}

export function reread() {
  hash.read('');
  refresh();
}
