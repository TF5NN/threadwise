// Make tab: the figures for cutting a thread, outside or inside: sizes to turn or bore,
// tap drills with percentage of thread, and single-point infeed (radial or on the compound).

import { t, has } from './i18n.js';
import { CATALOGUE, FAMILIES, FORMS, family, profileOf, IN } from './catalogue.js';
import { limits, CLASS_LIST } from './tolerances.js';
import { parseNumber } from './threads.js';
import { num, len, other, fillSelect, setSeg, wireSeg, pitchBoth } from './format.js';
import * as hash from './hash.js';

const $ = (id) => document.getElementById(id);
const P = 'k.';
export const MAKE_FAMILIES = ['M', 'UN', 'BSW', 'BSF', 'G', 'R', 'NPT', 'Pg', 'Tr'];
const DEFAULTS = { fam: 'M', size: 'M:M10', side: 'ext', cls: '', u: 'mm', feed: 'flank', n: '' };
const state = { ...DEFAULTS };

// ---- The maths (no page code, so validation/make.test.mjs can run it) -------------------------

/**
 * Percentage of thread for a drill, the way tap-drill charts count it (Machinery's Handbook:
 * % = (D − drill) / (0.01299 / TPI) for 60° threads, i.e. 100 % is a drill of D − 1.299·P).
 * For Whitworth forms the same idea uses its own depth: 100 % is D − 1.2807·P.
 */
export function percentThread(row, drillMm) {
  // Tr: 100 % is the full flank overlap H1 = 0.5·P, i.e. a hole of D1 = d − P.
  const k = row.family === 'Pg' ? row.hInt / row.pitch : row.family === 'Tr' ? 0.5 : FORMS[FAMILIES[row.family].form].d2k;
  return ((row.d - drillMm) / (2 * k * row.pitch)) * 100;
}

/** Drill sizes to offer: metric (0.05 mm steps below 3 mm, 0.1 mm above) and fractional inch (1/64). */
export function drillChoices(row, minor) {
  const want = (pct) => pct >= 55 && pct <= 95;
  const out = [];
  const lo = row.d - 0.95 * 2 * 0.65 * row.pitch - 0.5;
  const hi = row.d;
  // Count in hundredths of a millimetre so the steps stay exactly on the drill grid:
  // every 0.05 mm below 3 mm, every 0.1 mm from 3 mm up.
  for (let h = Math.ceil(lo * 20) * 5; h <= hi * 100; h += 5) {
    if (h >= 300 && h % 10 !== 0) continue;
    const x = h / 100;
    const pct = percentThread(row, x);
    if (want(pct)) out.push({ sys: 'mm', label: `${num(x, x < 3 ? 2 : 1)} mm`, mm: x, pct, inside: minor ? x >= minor.min - 1e-9 && (minor.max === null || x <= minor.max + 1e-9) : null });
  }
  for (let n = Math.floor((lo / IN) * 64); n / 64 <= hi / IN; n++) {
    if (n <= 0) continue;
    const mm = (n / 64) * IN;
    const pct = percentThread(row, mm);
    if (!want(pct)) continue;
    let a = n;
    let b = 64;
    while (a % 2 === 0 && b > 1) { a /= 2; b /= 2; }
    const whole = Math.floor(a / b);
    const frac = a % b ? `${a % b}/${b}` : '';
    out.push({ sys: 'in', label: `${whole ? whole + (frac ? '-' : '') : ''}${frac}"`, mm, pct, inside: minor ? mm >= minor.min - 1e-9 && (minor.max === null || mm <= minor.max + 1e-9) : null });
  }
  // The drill printed in the Töflubók (DIN 13-1 table) is always offered, and marked.
  if (row.tapDrill) {
    const hit = out.find((d) => d.sys === 'mm' && Math.abs(d.mm - row.tapDrill) < 1e-9);
    if (hit) hit.book = true;
    else out.push({ sys: 'mm', label: `${num(row.tapDrill, 1)} mm`, mm: row.tapDrill, pct: percentThread(row, row.tapDrill), book: true, inside: minor ? row.tapDrill >= minor.min - 1e-9 && (minor.max === null || row.tapDrill <= minor.max + 1e-9) : null });
  }
  return out;
}

/** Infeed: compound angle is half the thread angle less ½°, so the trailing flank just shaves. */
export function infeed(row, side) {
  const prof = profileOf(row);
  const depth = (side === 'ext' ? prof.hExt : prof.hInt) * row.pitch;
  const compound = prof.angle / 2 - 0.5;
  return { depth, compound, travel: depth / Math.cos((compound * Math.PI) / 180) };
}

/** Pass schedule with roughly the same chip area each pass: cumulative depth a·√(i/n). */
export function passes(depth, n) {
  const out = [];
  let prev = 0;
  for (let i = 1; i <= n; i++) {
    const cum = depth * Math.sqrt(i / n);
    out.push({ i, cum, step: cum - prev });
    prev = cum;
  }
  return out;
}

export const suggestedPasses = (depth) => Math.min(20, Math.max(4, Math.round(4 + 4 * depth)));

// ---- The page ----------------------------------------------------------------------------------

const currentRow = () => CATALOGUE.find((r) => r.id === state.size) || family(state.fam)[0];

function classes() {
  const c = CLASS_LIST[state.fam];
  return c ? c[state.side] : [];
}

function row3(label, value, alt) {
  const div = document.createElement('div');
  div.innerHTML = '<dt></dt><dd></dd>';
  div.querySelector('dt').textContent = label;
  div.querySelector('dd').textContent = value + (alt ? `  ·  ${alt}` : '');
  return div;
}

function render() {
  const row = currentRow();
  const fam = state.fam;
  const u = state.u;
  const o = other(u);
  $('k-fam').value = fam;
  const groups = {};
  for (const r of family(fam)) (groups[r.series] ||= []).push([r.id, r.name]);
  fillSelect($('k-size'), Object.entries(groups).map(([label, options]) => ({ label: has('series.' + label) ? t('series.' + label) : label, options })));
  $('k-size').value = row.id;
  setSeg($('k-side'), state.side);
  setSeg($('k-u'), state.u);
  setSeg($('k-feed'), state.feed);
  const cls = classes();
  $('k-cls-wrap').hidden = cls.length === 0;
  fillSelect($('k-cls'), cls.map((c) => [c, c]));
  if (!cls.includes(state.cls)) state.cls = (CLASS_LIST[fam] || {})[state.side === 'ext' ? 'defExt' : 'defInt'] || '';
  $('k-cls').value = state.cls;

  const l = cls.length ? limits(row, state.side, state.cls) : limits(row, state.side, '');
  const both = (mm) => [len(mm, u), len(mm, o)];

  // Sizes
  const dl = $('k-sizes');
  dl.replaceChildren();
  $('k-pitch').textContent = pitchBoth(row.pitch) + ` · ${num(row.angle, row.angle % 1 ? 1 : 0)}°`;
  if (row.taper) {
    dl.append(row3(t('make.taper'), t('make.taperValue')));
    if (row.family === 'NPT') {
      dl.append(row3(t('make.od'), ...both(row.d)));
      dl.append(row3('E0 ' + t('make.e0'), ...both(row.E0)));
      dl.append(row3('E1 ' + t('make.e1'), ...both(row.E1)));
      dl.append(row3('L1 ' + t('make.l1'), ...both(row.L1)));
      dl.append(row3('L2 ' + t('make.l2'), ...both(row.L2)));
    } else {
      dl.append(row3(t('make.gaugeMajor'), ...both(row.d)));
      dl.append(row3(t('make.gaugePitch'), ...both(row.d2)));
      dl.append(row3(t('make.gaugeMinor'), ...both(row.d1)));
      dl.append(row3('a ' + t('make.gaugeDist'), ...both(row.gauge)));
      dl.append(row3('l1 ' + t('make.useful'), ...both(row.useful)));
      dl.append(row3(t('make.dn'), `DN ${row.dn}`));
    }
  } else if (state.side === 'ext') {
    if (l.major) {
      dl.append(row3(t('make.majorMax'), ...both(l.major.max)));
      dl.append(row3(t('make.majorMin'), ...both(l.major.min)));
    } else dl.append(row3(t('make.majorBasic'), ...both(row.d)));
    if (l.d2) {
      dl.append(row3(t('make.d2max'), ...both(l.d2.max)));
      dl.append(row3(t('make.d2min'), ...both(l.d2.min)));
    } else dl.append(row3(t('make.d2basic'), ...both(row.d2)));
    dl.append(row3(t(row.family === 'M' || row.family === 'Tr' ? 'make.root' : 'make.rootApprox'), ...both(row.d3 ?? row.d - 2 * profileOf(row).hExt * row.pitch)));
    if (row.toolWidth) dl.append(row3('b ' + t('make.toolWidth'), ...both(row.toolWidth)));
  } else {
    if (l.minor) {
      dl.append(row3(t('make.minorMin'), ...both(l.minor.min)));
      if (l.minor.max !== null) dl.append(row3(t('make.minorMax'), ...both(l.minor.max)));
    } else dl.append(row3(t('make.minorBasic'), ...both(row.d1)));
    if (l.d2) {
      dl.append(row3(t('make.D2min'), ...both(l.d2.min)));
      dl.append(row3(t('make.D2max'), ...both(l.d2.max)));
    } else dl.append(row3(t('make.d2basic'), ...both(row.d2)));
    if (row.D4) dl.append(row3('D4 ' + t('make.D4'), ...both(row.D4)));
    else dl.append(row3(t('make.majorMinInt'), ...both(l.major ? l.major.min : row.d)));
    if (row.toolWidth) dl.append(row3('b ' + t('make.toolWidth'), ...both(row.toolWidth)));
  }
  const src = $('k-source');
  const key = row.family === 'Tr' && l.source === 'none' ? 'make.srcTr' : { table: 'make.srcTable', formula: 'make.srcFormula', maker: 'make.srcMaker', none: 'make.srcNone', gauge: 'make.srcGauge', undefined: 'status.undefined', range: 'status.range' }[l.source];
  if (row.tapDrill && state.side === 'int') src.dataset.book = '1';
  src.textContent = t(key || 'make.srcNone') + (l.note === 'unMinor' ? ' ' + t('make.unMinor') : '');
  src.className = 'note ' + (['table'].includes(l.source) ? 'info' : 'warn');

  // Drilling (inside, parallel threads)
  const drillPanel = $('k-drill-panel');
  drillPanel.hidden = state.side !== 'int' || row.taper;
  if (!drillPanel.hidden) {
    const list = drillChoices(row, l.minor || null);
    const tbody = $('k-drills');
    tbody.replaceChildren();
    const pick = (sys) => {
      const near75 = list.filter((d) => d.sys === sys).sort((a, b) => Math.abs(a.pct - 75) - Math.abs(b.pct - 75)).slice(0, 5);
      const book = list.find((d) => d.sys === sys && d.book && !near75.includes(d));
      return (book ? [...near75, book] : near75).sort((a, b) => a.mm - b.mm);
    };
    const order = FAMILIES[fam].unit === 'in' ? ['in', 'mm'] : ['mm', 'in'];
    for (const sys of order) {
      for (const d of pick(sys)) {
        const tr = document.createElement('tr');
        const status = d.inside === null ? '' : d.inside ? t('make.inside') : d.mm < l.minor.min ? t('make.tooSmall') : t('make.tooBig');
        tr.className = d.inside === false ? 'off' : d.inside ? 'in' : '';
        if (d.book) tr.classList.add('book');
        for (const text of [d.label + (d.book ? ' ★' : ''), len(d.mm, d.sys === 'in' ? 'in' : 'mm'), num(d.pct, 0) + ' %', status]) {
          const td = document.createElement('td');
          td.textContent = text;
          tr.append(td);
        }
        tbody.append(tr);
      }
    }
  }
  $('k-taper-drill').hidden = !(state.side === 'int' && row.taper);

  // Single-point threading
  const f = infeed(row, state.side);
  const n = parseNumber(state.n) || suggestedPasses(f.depth);
  $('k-n').placeholder = String(suggestedPasses(f.depth));
  $('k-depth').textContent = `${len(f.depth, u)}  ·  ${len(f.depth, o)}`;
  $('k-compound').textContent = `${num(f.compound, 1)}°`;
  $('k-compound-row').hidden = state.feed !== 'flank';
  $('k-travel').textContent = `${len(f.travel, u)}  ·  ${len(f.travel, o)}`;
  $('k-travel-row').hidden = state.feed !== 'flank';
  const tb = $('k-passes');
  tb.replaceChildren();
  const k = state.feed === 'flank' ? 1 / Math.cos((f.compound * Math.PI) / 180) : 1;
  for (const p of passes(f.depth, Math.min(40, Math.max(1, Math.round(n))))) {
    const tr = document.createElement('tr');
    for (const text of [String(p.i), len(p.step * k, u), len(p.cum * k, u), len(p.cum, u)]) {
      const td = document.createElement('td');
      td.textContent = text;
      tr.append(td);
    }
    tb.append(tr);
  }
  $('k-pass-head-feed').textContent = t(state.feed === 'flank' ? 'make.onCompound' : 'make.onCross');
  hash.write();
}

export function init() {
  hash.register(P, state, DEFAULTS);
  if (!MAKE_FAMILIES.includes(state.fam)) state.fam = 'M';
  fillSelect($('k-fam'), MAKE_FAMILIES.map((f) => [f, t('fam.' + f)]));
  $('k-fam').addEventListener('change', () => {
    state.fam = $('k-fam').value;
    const first = family(state.fam).find((r) => ['M10', '1/2-13 UNC', '1/2 BSW', '1/2 BSF', 'G 1/2', 'R 1/2', '1/2 NPT', 'Pg 9', 'Tr 20 × 4'].includes(r.name)) || family(state.fam)[0];
    state.size = first.id;
    state.u = FAMILIES[state.fam].unit;
    state.cls = '';
    state.n = '';
    render();
  });
  $('k-size').addEventListener('change', () => { state.size = $('k-size').value; state.n = ''; render(); });
  $('k-cls').addEventListener('change', () => { state.cls = $('k-cls').value; render(); });
  $('k-n').addEventListener('input', () => { state.n = $('k-n').value; render(); });
  wireSeg($('k-side'), () => state.side, (v) => { state.side = v; state.cls = ''; render(); });
  wireSeg($('k-u'), () => state.u, (v) => { state.u = v; render(); });
  wireSeg($('k-feed'), () => state.feed, (v) => { state.feed = v; render(); });
  render();
}

export function refresh() {
  fillSelect($('k-fam'), MAKE_FAMILIES.map((f) => [f, t('fam.' + f)]));
  render();
}
export function reread() {
  hash.read(P);
  render();
}
