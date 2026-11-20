// The thread catalogue: every size of every family, with its diameters worked out, in mm.
// All three tabs read from here. Raw lists and their sources are in js/data/catalogue-data.js.

import { METRIC_COARSE, METRIC_FINE, UNIFIED, BSW, BSF, PIPE_G, PIPE_R, NPT, PG, TRAPEZ, TAP_DRILL_COARSE } from './data/catalogue-data.js';
import { parseInch } from './threads.js';

export const IN = 25.4;

// ---- Thread forms -------------------------------------------------------------------------
// Each form gives the profile numbers the tabs need. Heights are multiples of the pitch P.
//   d2k      basic pitch diameter = d − d2k·P
//   d1k      basic minor diameter of the internal thread = d − d1k·P
//   hExt     radial depth of an external thread, crest to root (single-point threading)
//   hInt     radial depth of an internal thread
//   crestTop, flankTop: for wire sizes, height of the crest and of the top of the straight
//            flank, measured from the sharp bottom of the groove (see js/geometry.js)
const H60 = 0.8660254038; // height of the sharp 60° triangle
const H55 = 0.9604910034; // height of the sharp 55° triangle
// Whitworth: crests and roots rounded off by H/6, radius 0.137329·P (BS 84). The rounding
// meets the flank where the arc is tangent: ρ·cos²(27.5°)/sin(27.5°) from the sharp corner.
const WR = 0.137329;
const W_TANGENT = (WR * Math.cos((27.5 * Math.PI) / 180) ** 2) / Math.sin((27.5 * Math.PI) / 180);

export const FORMS = {
  // ISO 68-1 / ASME B1.1 basic profile: crest flat at H/8, internal height 5H/8,
  // external depth to the rounded root h3 = 17H/24 (ISO 965-1, external threads).
  iso: {
    angle: 60,
    d2k: (3 / 4) * H60,
    d1k: (5 / 4) * H60,
    hExt: (17 / 24) * H60,
    hInt: (5 / 8) * H60,
    crestTop: (7 / 8) * H60,
    flankTop: (7 / 8) * H60,
  },
  whitworth: {
    angle: 55,
    d2k: (2 / 3) * H55,
    d1k: (4 / 3) * H55,
    hExt: (2 / 3) * H55,
    hInt: (2 / 3) * H55,
    crestTop: (5 / 6) * H55,
    flankTop: H55 - W_TANGENT,
  },
  // NPT: truncated 60° form, thread height 0.8·P, crest truncated at least 0.033·P
  // (ASME B1.20.1). Not used by Measure (tapered threads are gauged, not wire-measured).
  npt: { angle: 60, d2k: 0.8, d1k: 1.6, hExt: 0.8, hInt: 0.8, crestTop: H60 - 0.033, flankTop: H60 - 0.033 },
  // Pg: 80°, rounded crests and roots; heights come from each size's own table values.
  pg: { angle: 80 },
  // Metric trapezoidal (DIN 103): 30°, pitch diameter d − 0.5·P, so the crest stands 0.25·P
  // above the pitch line; the sharp groove bottom is H/2 = P/(4·tan 15°) below it.
  // The crest corners have a small radius (≤ 0.5·ac), left out here.
  tr: {
    angle: 30,
    d2k: 0.5,
    d1k: 1,
    crestTop: 1 / (4 * Math.tan((15 * Math.PI) / 180)) + 0.25,
    flankTop: 1 / (4 * Math.tan((15 * Math.PI) / 180)) + 0.25,
  },
};

// ---- Families ------------------------------------------------------------------------------
// unit: how the size is written; pitchAs: 'mm' or 'tpi'; tol: which tolerance system Measure uses.
export const FAMILIES = {
  M: { form: 'iso', unit: 'mm', pitchAs: 'mm', taper: false, tol: 'iso965', std: 'ISO 261 / ISO 965-1', own: true },
  UN: { form: 'iso', unit: 'in', pitchAs: 'tpi', taper: false, tol: 'asme', std: 'ASME B1.1', own: true },
  BSW: { form: 'whitworth', unit: 'in', pitchAs: 'tpi', taper: false, tol: 'none', std: 'BS 84', own: true },
  BSF: { form: 'whitworth', unit: 'in', pitchAs: 'tpi', taper: false, tol: 'none', std: 'BS 84', own: true },
  G: { form: 'whitworth', unit: 'mm', pitchAs: 'tpi', taper: false, tol: 'iso228', std: 'ISO 228-1', own: false },
  R: { form: 'whitworth', unit: 'mm', pitchAs: 'tpi', taper: true, tol: 'gauge', std: 'ISO 7-1', own: false },
  NPT: { form: 'npt', unit: 'in', pitchAs: 'tpi', taper: true, tol: 'gauge', std: 'ASME B1.20.1', own: false },
  Pg: { form: 'pg', unit: 'mm', pitchAs: 'mm', taper: false, tol: 'din40430', std: 'DIN 40430', own: false },
  Tr: { form: 'tr', unit: 'mm', pitchAs: 'mm', taper: false, tol: 'none', std: 'DIN 103', own: false },
};

const fmt = (x) => String(x).replace(/\.0+$/, '');

function rowFromForm(family, series, name, d, pitch, extra = {}) {
  const f = FORMS[FAMILIES[family].form];
  return {
    id: `${family}:${name}`,
    family,
    series,
    name,
    d,
    pitch,
    tpi: FAMILIES[family].pitchAs === 'tpi' ? Math.round((IN / pitch) * 100) / 100 : null,
    angle: f.angle,
    d2: d - f.d2k * pitch,
    d1: d - f.d1k * pitch,
    taper: FAMILIES[family].taper,
    ...extra,
  };
}

function build() {
  const rows = [];
  for (const [d, p] of METRIC_COARSE) rows.push(rowFromForm('M', 'coarse', `M${fmt(d)}`, d, p, { src: ['ISO261', 'Toflubok'], tapDrill: TAP_DRILL_COARSE[d] }));
  for (const [d, p] of METRIC_FINE) rows.push(rowFromForm('M', 'fine', `M${fmt(d)} × ${fmt(p)}`, d, p, { src: ['ISO261'] }));

  for (const [size, unc, unf, unef] of UNIFIED) {
    const d = parseInch(size) * IN;
    for (const [tpi, series] of [[unc, 'UNC'], [unf, 'UNF'], [unef, 'UNEF']]) {
      if (tpi) rows.push(rowFromForm('UN', series, `${size}-${tpi} ${series}`, d, IN / tpi, { dIn: parseInch(size), src: ['ASME-B1.1:list'] }));
    }
  }

  for (const [list, family] of [[BSW, 'BSW'], [BSF, 'BSF']]) {
    for (const [size, tpi, e] of list) {
      rows.push(rowFromForm(family, family, `${size} ${family}`, parseInch(size) * IN, IN / tpi, { dIn: parseInch(size), d2Published: e * IN, src: family === 'BSW' ? ['EE-Whitworth', 'Toflubok'] : ['EE-Whitworth', 'Torqbolt-BSF'] }));
    }
  }

  for (const [size, tpi, d, d2, d1, td2A, td1] of PIPE_G) {
    const pitch = IN / tpi;
    // Published diameters are used as printed; validation checks them against the formulas.
    rows.push({ ...rowFromForm('G', 'G', `G ${size}`, d, pitch), d2, d1, td2A, td1, alias: `BSPP ${size}`, src: ['IS2643:2005', 'EE-ISO228', 'Toflubok'] });
  }
  for (const [size, dn, gauge, useful] of PIPE_R) {
    const g = PIPE_G.find((x) => x[0] === size);
    const [, tpi, d, d2, d1] = g;
    rows.push({ ...rowFromForm('R', 'R', `R ${size}`, d, IN / tpi), d2, d1, gauge, useful, dn, alias: `BSPT ${size}`, src: ['Toflubok', 'IS2643:2005'] });
  }

  for (const [size, tpi, D, E0, L1, E1, L2] of NPT) {
    const pitch = IN / tpi;
    rows.push({
      ...rowFromForm('NPT', 'NPT', `${size} NPT`, D * IN, pitch),
      // For a tapered thread the "size" is the pipe OD; the pitch diameter grows 1/16 per unit length.
      d2: E1 * IN,
      d1: (E1 - 0.8 / tpi) * IN, // internal minor at the gauge plane (E1 minus the thread height)
      E0: E0 * IN,
      E1: E1 * IN,
      L1: L1 * IN,
      L2: L2 * IN,
      src: ['EE-NPT', 'ASME-B1.20.1'],
    });
  }

  for (const [size, p, d, d2, d1, r, d2minM, D2maxF, dminM, D1maxF] of PG) {
    const H = p / (2 * Math.tan((40 * Math.PI) / 180));
    const trunc = H / 2 - (d - d2) / 2; // how much the sharp crest is cut down
    const tangent = (r * Math.cos((40 * Math.PI) / 180) ** 2) / Math.sin((40 * Math.PI) / 180);
    rows.push({
      id: `Pg:${size}`,
      family: 'Pg',
      series: 'Pg',
      name: `Pg ${size}`,
      d,
      pitch: p,
      tpi: null,
      angle: 80,
      d2,
      d1,
      taper: false,
      radius: r,
      d2minM,
      D2maxF,
      dminM,
      D1maxF,
      hExt: (d - d1) / 2,
      hInt: (d - d1) / 2,
      crestTop: (H - trunc) / p,
      flankTop: (H - tangent) / p,
      src: ['Heyco-PG', 'REMS-tables', 'Hummel-PG'],
    });
  }
  for (const [d, p, d2, d3, D1, D4, H4, b] of TRAPEZ) {
    rows.push({
      id: `Tr:${d}x${p}`,
      family: 'Tr',
      series: 'Tr',
      name: `Tr ${d} × ${p}`,
      d,
      pitch: p,
      tpi: null,
      angle: 30,
      d2,
      d1: D1, // the nut's minor diameter: what a caliper measures inside
      d3, // the screw's minor (root) diameter
      D4, // the nut's major diameter
      hExt: H4,
      hInt: H4,
      toolWidth: b,
      taper: false,
      src: ['Toflubok'],
    });
  }
  return rows;
}

export const CATALOGUE = build();

/** The rows of one family, in catalogue order. */
export const family = (fam) => CATALOGUE.filter((r) => r.family === fam);

/** Profile numbers (as multiples of P where relevant) for a row. */
export function profileOf(row) {
  if (row.family === 'Pg') return { angle: 80, crestTop: row.crestTop, flankTop: row.flankTop, hExt: row.hExt / row.pitch, hInt: row.hInt / row.pitch };
  if (row.family === 'Tr') return { ...FORMS.tr, hExt: row.hExt / row.pitch, hInt: row.hInt / row.pitch };
  const f = FORMS[FAMILIES[row.family].form];
  return { angle: f.angle, crestTop: f.crestTop, flankTop: f.flankTop, hExt: f.hExt, hInt: f.hInt };
}

/** A thread that is not in the catalogue, from a family's own form (metric, unified, Whitworth). */
export function ownRow(fam, d, pitch) {
  return rowFromForm(fam, 'own', 'own', d, pitch, { own: true });
}
