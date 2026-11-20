// The page: reads the fields, runs the maths in js/threads.js, and writes the results.
// Everything is kept in the address (after #), so a bookmark or a shared link opens
// the same thread again.

import { t, lang } from './i18n.js';
import {
  MM_PER_INCH,
  ISO_CLASSES,
  UN_CLASSES,
  isoTolerance,
  unifiedTolerance,
  wireSizes,
  solve,
  checkMeasurement,
  parseNumber,
  parseInch,
} from './threads.js';

const $ = (id) => document.getElementById(id);

// ---- Common sizes -----------------------------------------------------------------------

const METRIC = {
  coarse: [[1, 0.25], [1.2, 0.25], [1.6, 0.35], [2, 0.4], [2.5, 0.45], [3, 0.5], [4, 0.7], [5, 0.8], [6, 1], [8, 1.25], [10, 1.5], [12, 1.75], [14, 2], [16, 2], [18, 2.5], [20, 2.5], [22, 2.5], [24, 3], [27, 3], [30, 3.5], [36, 4], [42, 4.5], [48, 5], [56, 5.5], [64, 6]],
  fine: [[8, 1], [10, 1], [10, 1.25], [12, 1.25], [12, 1.5], [14, 1.5], [16, 1.5], [18, 1.5], [20, 1.5], [22, 1.5], [24, 2], [27, 2], [30, 2], [36, 3], [42, 3], [48, 3]],
};
// [how it is written, diameter as typed, TPI]
const INCH = {
  coarse: [['#4-40', '#4', 40], ['#6-32', '#6', 32], ['#8-32', '#8', 32], ['#10-24', '#10', 24], ['1/4-20', '1/4', 20], ['5/16-18', '5/16', 18], ['3/8-16', '3/8', 16], ['7/16-14', '7/16', 14], ['1/2-13', '1/2', 13], ['9/16-12', '9/16', 12], ['5/8-11', '5/8', 11], ['3/4-10', '3/4', 10], ['7/8-9', '7/8', 9], ['1-8', '1', 8], ['1-1/8-7', '1-1/8', 7], ['1-1/4-7', '1-1/4', 7], ['1-1/2-6', '1-1/2', 6]],
  fine: [['#4-48', '#4', 48], ['#6-40', '#6', 40], ['#8-36', '#8', 36], ['#10-32', '#10', 32], ['1/4-28', '1/4', 28], ['5/16-24', '5/16', 24], ['3/8-24', '3/8', 24], ['7/16-20', '7/16', 20], ['1/2-20', '1/2', 20], ['9/16-18', '9/16', 18], ['5/8-18', '5/8', 18], ['3/4-16', '3/4', 16], ['7/8-14', '7/8', 14], ['1-12', '1', 12], ['1-1/4-12', '1-1/4', 12], ['1-1/2-12', '1-1/2', 12]],
};

// ---- State --------------------------------------------------------------------------------

const DEFAULTS = {
  sys: 'metric',
  d: '10',
  p: '1.5',
  mode: 'standard',
  cls: '6g',
  es: '0',
  ei: '-0.1',
  g: '',
  gu: 'mm',
  ru: 'mm',
  m: '',
};
const state = { ...DEFAULTS };

function readHash() {
  const params = new URLSearchParams(location.hash.slice(1));
  for (const key of Object.keys(DEFAULTS)) if (params.has(key)) state[key] = params.get(key);
  if (!['metric', 'inch'].includes(state.sys)) state.sys = 'metric';
  if (!['standard', 'manual'].includes(state.mode)) state.mode = 'standard';
  for (const k of ['gu', 'ru']) if (!['mm', 'in'].includes(state[k])) state[k] = 'mm';
  const classes = state.sys === 'metric' ? ISO_CLASSES : UN_CLASSES;
  if (!classes.includes(state.cls)) state.cls = state.sys === 'metric' ? '6g' : '2A';
}

function writeHash() {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(state)) if (value !== DEFAULTS[key] && value !== '') params.set(key, value);
  const text = params.toString();
  history.replaceState(history.state, '', location.pathname + location.search + (text ? '#' + text : ''));
}

// ---- Number formatting --------------------------------------------------------------------

const MINUS = '−';
/** A number with a fixed number of decimals, in the language's own way (comma in Icelandic). */
function num(x, decimals, signed = false) {
  if (!Number.isFinite(x)) return '–';
  let s = Math.abs(x).toFixed(decimals);
  if (Number(s) === 0) return (signed ? '±' : '') + s.replace('.', lang() === 'is' ? ',' : '.');
  if (lang() === 'is') s = s.replace('.', ',');
  return (x < 0 ? MINUS : signed ? '+' : '') + s;
}
const DECIMALS = { mm: 3, in: 4 };
/** A length (given in mm) in a unit, with the unit written after it. */
const len = (mm, unit, signed = false) => `${num(unit === 'in' ? mm / MM_PER_INCH : mm, DECIMALS[unit], signed)} ${unit}`;
const other = (unit) => (unit === 'mm' ? 'in' : 'mm');
/** A typed number in a field's unit, in mm. */
const toMm = (value, unit) => (unit === 'in' ? value * MM_PER_INCH : value);

/** A plain typed number shown with the language's decimal mark ("1.5" → "1,5" in Icelandic). */
const local = (text) =>
  /^[-+]?\d*[.,]\d+$/.test(text.trim()) ? text.trim().replace(/[.,]/, lang() === 'is' ? ',' : '.') : text;

// ---- Fields ---------------------------------------------------------------------------------

function fillSelects() {
  const preset = $('preset');
  preset.replaceChildren();
  preset.append(new Option(t('preset.custom'), ''));
  const table = state.sys === 'metric' ? METRIC : INCH;
  for (const kind of ['coarse', 'fine']) {
    const group = document.createElement('optgroup');
    group.label = t('preset.' + kind);
    for (const entry of table[kind]) {
      const [label, value] =
        state.sys === 'metric'
          ? [`M${entry[0]} × ${entry[1]}`.replace(/\./g, lang() === 'is' ? ',' : '.'), `${entry[0]}|${entry[1]}`]
          : [`${entry[0]} ${kind === 'coarse' ? 'UNC' : 'UNF'}`, `${entry[1]}|${entry[2]}`];
      group.append(new Option(label, value));
    }
    preset.append(group);
  }
  const cls = $('cls');
  cls.replaceChildren(...(state.sys === 'metric' ? ISO_CLASSES : UN_CLASSES).map((c) => new Option(c, c)));
}

function syncPreset() {
  const match = [...$('preset').options].find((o) => {
    if (!o.value) return false;
    const [d, p] = o.value.split('|');
    if (state.sys === 'metric') return Number(d) === parseNumber(state.d) && Number(p) === parseNumber(state.p);
    return Math.abs(parseInch(d) - (parseInch(state.d) ?? NaN)) < 1e-9 && Number(p) === parseNumber(state.p);
  });
  $('preset').value = match ? match.value : '';
}

function setSeg(id, value) {
  for (const b of $(id).querySelectorAll('button')) {
    const on = b.dataset.value === value;
    b.setAttribute('aria-checked', String(on));
    b.tabIndex = on ? 0 : -1;
  }
}

function showFields() {
  const inch = state.sys === 'inch';
  setSeg('system', state.sys);
  setSeg('tol-mode', state.mode);
  setSeg('g-unit', state.gu);
  setSeg('r-unit', state.ru);
  $('d-unit').textContent = inch ? 'in' : 'mm';
  $('d-hint').hidden = !inch;
  $('p-label').textContent = t(inch ? 'tpi.label' : 'p.label');
  $('p-unit').textContent = inch ? 'TPI' : 'mm';
  for (const el of document.querySelectorAll('.man-unit')) el.textContent = inch ? 'in' : 'mm';
  $('g-unit-text').textContent = state.gu;
  $('m-unit').textContent = state.ru;
  $('std-fields').hidden = state.mode !== 'standard';
  $('manual-fields').hidden = state.mode !== 'manual';
  for (const id of ['d', 'p', 'es', 'ei', 'g', 'm']) if ($(id) !== document.activeElement) $(id).value = local(state[id]);
  $('cls').value = state.cls;
  syncPreset();
}

// ---- Working it out -------------------------------------------------------------------------

/** The thread in mm from the fields, or an error key. */
function readThread() {
  const inch = state.sys === 'inch';
  const dRaw = inch ? parseInch(state.d) : parseNumber(state.d);
  const pRaw = parseNumber(state.p);
  mark('d', dRaw === null || dRaw <= 0);
  mark('p', pRaw === null || pRaw <= 0);
  if (dRaw === null || dRaw <= 0 || pRaw === null || pRaw <= 0) return { error: 'status.input' };
  const d = inch ? dRaw * MM_PER_INCH : dRaw;
  const pitch = inch ? MM_PER_INCH / pRaw : pRaw;
  if (0.649519 * pitch >= d * 0.8) return { error: 'status.pitch' };

  let tol;
  if (state.mode === 'manual') {
    const es = parseNumber(state.es);
    const ei = parseNumber(state.ei);
    mark('es', es === null);
    mark('ei', ei === null);
    if (es === null || ei === null) return { error: 'status.input', d, pitch };
    if (ei >= es) return { error: 'status.order', d, pitch };
    tol = { es: toMm(es, inch ? 'in' : 'mm'), ei: toMm(ei, inch ? 'in' : 'mm'), status: 'manual' };
  } else if (inch) {
    const u = unifiedTolerance(dRaw, pRaw, state.cls);
    tol = { es: u.es * MM_PER_INCH, ei: u.ei * MM_PER_INCH, status: 'unified' };
  } else {
    tol = isoTolerance(d, pitch, state.cls);
    if (tol.es === null) return { error: 'status.' + tol.status, d, pitch };
  }
  return { d, pitch, ...tol };
}

function mark(id, bad) {
  $(id).classList.toggle('invalid', bad && $(id).value.trim() !== '');
}

/** The wire in mm, as typed. Never assumed: the reading depends on the wire actually used. */
function readWire() {
  const typed = parseNumber(state.g);
  mark('g', typed === null || typed <= 0);
  return typed !== null && typed > 0 ? toMm(typed, state.gu) : null;
}

function render() {
  const thread = readThread();
  const wire = readWire();
  $('g').classList.toggle('needed', !wire && !thread.error);

  // Status of the tolerance
  const status = $('status');
  status.className = 'note';
  if (thread.error) {
    status.textContent = t(thread.error);
    status.classList.add(thread.error === 'status.input' ? 'info' : 'warn');
  } else {
    status.textContent = t('status.' + thread.status);
    status.classList.add(thread.status === 'formula' ? 'warn' : 'info');
  }

  // Wire sizes (they need only the pitch)
  if (thread.pitch) {
    const w = wireSizes(thread.pitch);
    $('w-min').textContent = len(w.min, state.gu);
    $('w-best').textContent = len(w.best, state.gu);
    $('w-max').textContent = len(w.max, state.gu);
    const pos = (x) => Math.max(0, Math.min(100, ((x - w.min * 0.85) / (w.max * 1.08 - w.min * 0.85)) * 100));
    document.querySelector('.wire-bar .range').style.cssText = `left:${pos(w.min)}%;right:${100 - pos(w.max)}%`;
    document.querySelector('.wire-bar .best-tick').style.left = pos(w.best) + '%';
    const box = $('wire-fit');
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
  } else {
    $('w-mark').hidden = true;
    for (const id of ['w-min', 'w-best', 'w-max']) $(id).textContent = '–';
    $('wire-fit').textContent = '';
    $('wire-fit').className = 'note';
  }

  // Results. The pitch diameter needs only the thread; the reading over the wires needs the wire.
  const u = state.ru;
  const o = other(u);
  const overIds = ['m-max', 'm-mid', 'm-min', 'm-max-alt', 'm-mid-alt', 'm-min-alt'];
  $('need-wire').hidden = !!(thread.error || wire);
  $('over').classList.toggle('empty', !!(thread.error || !wire));
  if (thread.error) {
    for (const id of [...overIds, 'r-d2', 'r-es', 'r-ei', 'r-td2', 'r-d2max', 'r-d2min']) $(id).textContent = '–';
    $('band').textContent = t('res.none');
    $('lead').textContent = '';
    $('verdict').hidden = true;
    writeHash();
    return;
  }
  // Without a wire, solve() still gives the pitch diameter; its over-wire figures are not shown.
  const r = solve({ d: thread.d, pitch: thread.pitch, es: thread.es, ei: thread.ei, wire: wire ?? 0 });
  if (!wire) for (const id of overIds) $(id).textContent = '–';
  else {
  $('m-max').textContent = len(r.mMax, u);
  $('m-mid').textContent = len(r.mMid, u);
  $('m-min').textContent = len(r.mMin, u);
  $('m-max-alt').textContent = len(r.mMax, o);
  $('m-mid-alt').textContent = len(r.mMid, o);
  $('m-min-alt').textContent = len(r.mMin, o);
  }
  $('band').textContent = t('res.band', { value: '± ' + len(r.half, u) });
  const micro = (mm) => (u === 'mm' ? ` (${num(mm * 1000, 0, true)} µm)` : '');
  $('r-d2').textContent = len(r.d2, u, false);
  $('r-es').textContent = len(thread.es, u, true) + micro(thread.es);
  $('r-ei').textContent = len(thread.ei, u, true) + micro(thread.ei);
  $('r-td2').textContent = len(thread.es - thread.ei, u) + (u === 'mm' ? ` (${num((thread.es - thread.ei) * 1000, 0)} µm)` : '');
  $('r-d2max').textContent = len(r.d2max, u);
  $('r-d2min').textContent = len(r.d2min, u);
  const lead = $('lead');
  lead.textContent = t(r.lead > 5 ? 'res.leadHigh' : 'res.lead', { value: num(r.lead, 1) });
  lead.className = 'note ' + (r.lead > 5 ? 'warn' : 'quiet');

  // Checking a measurement
  const measured = parseNumber(state.m);
  mark('m', measured === null);
  const v = $('verdict');
  if (measured === null || !wire) {
    v.hidden = true;
  } else {
    const c = checkMeasurement(r, toMm(measured, u), thread.pitch, wire);
    v.hidden = false;
    v.className = 'verdict ' + c.verdict;
    $('v-head').textContent = t('check.' + c.verdict);
    $('v-pd').textContent = t('check.pd', { value: len(c.d2, u) });
    const half = 0.5 * 10 ** -DECIMALS[u] * (u === 'in' ? MM_PER_INCH : 1);
    $('v-text').textContent =
      c.verdict === 'large'
        ? t('check.largeBy', { over: len(c.over, u), mid: len(c.toMid, u) })
        : c.verdict === 'small'
          ? t('check.smallBy', { over: len(c.over, u) })
          : Math.abs(c.toMid) < half
            ? t('check.inMid')
            : t(c.toMid > 0 ? 'check.inAbove' : 'check.inBelow', { value: len(Math.abs(c.toMid), u) });
  }
  writeHash();
}

// ---- Wiring up --------------------------------------------------------------------------------

function onSeg(id, key, after) {
  const group = $(id);
  group.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-value]');
    if (!b || state[key] === b.dataset.value) return;
    state[key] = b.dataset.value;
    after?.();
    showFields();
    render();
  });
  // Arrow keys move between the options, as in any radio group.
  group.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    const buttons = [...group.querySelectorAll('button')];
    const i = buttons.findIndex((b) => b.dataset.value === state[key]);
    const next = buttons[(i + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? buttons.length - 1 : 1)) % buttons.length];
    next.click();
    next.focus();
    e.preventDefault();
  });
}

/** Convert a typed value from one unit to the other, when a unit is switched. */
function convert(text, from, to) {
  const v = parseNumber(text);
  if (v === null || from === to) return text;
  const out = from === 'mm' ? v / MM_PER_INCH : v * MM_PER_INCH;
  return String(Number(out.toFixed(to === 'in' ? 5 : 4)));
}

function start() {
  readHash();
  fillSelects();
  showFields();

  onSeg('system', 'sys', () => {
    const inch = state.sys === 'inch';
    Object.assign(state, inch ? { d: '1/4', p: '20', cls: '2A', es: '0', ei: '-0.004' } : { d: '10', p: '1.5', cls: '6g', es: '0', ei: '-0.1' });
    const unit = inch ? 'in' : 'mm';
    state.g = convert(state.g, state.gu, unit);
    state.gu = state.ru = lastGu = lastRu = unit;
    state.m = '';
    fillSelects();
  });
  onSeg('tol-mode', 'mode');
  let lastGu = state.gu;
  onSeg('g-unit', 'gu', () => {
    state.g = convert(state.g, lastGu, state.gu);
    lastGu = state.gu;
  });
  let lastRu = state.ru;
  onSeg('r-unit', 'ru', () => {
    state.m = convert(state.m, lastRu, state.ru);
    lastRu = state.ru;
  });

  for (const id of ['d', 'p', 'es', 'ei', 'g', 'm']) {
    $(id).addEventListener('input', () => {
      state[id] = $(id).value;
      if (id === 'd' || id === 'p') syncPreset();
      render();
    });
  }
  $('preset').addEventListener('change', () => {
    if (!$('preset').value) return;
    const [d, p] = $('preset').value.split('|');
    state.d = d;
    state.p = p;
    showFields();
    render();
  });
  $('cls').addEventListener('change', () => {
    state.cls = $('cls').value;
    render();
  });

  // About
  const about = $('about');
  $('about-open').addEventListener('click', () => about.showModal());
  $('about-close').addEventListener('click', () => about.close());
  about.addEventListener('click', (e) => {
    if (e.target === about) about.close();
  });

  document.addEventListener('langchange', () => {
    fillSelects();
    showFields();
    render();
  });
  window.addEventListener('hashchange', () => {
    readHash();
    fillSelects();
    showFields();
    render();
  });
  render();
}

start();
