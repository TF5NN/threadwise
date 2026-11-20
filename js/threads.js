// The maths: tolerances for metric (ISO 965-1) and unified inch (ASME B1.1)
// external threads, wire sizes, and the measurement over three wires.
//
// No page code in here, so the checks in test/ can run it directly.
// Lengths are in millimetres unless a name says otherwise.

import { ES_TABLE, TD2_TABLE, CLASSES, ES_FORMULA, TD2_FACTOR, PREFERRED } from './iso965-data.js';

export const MM_PER_INCH = 25.4;

// 60° thread geometry
const H_PD = 0.649519053; // basic pitch diameter = d − 0.649519·P  (3/8·H·2, H = 0.866025·P)
const WIRE_K = 0.866025404; // over wires: M = d2 + 3G − 0.866025·P  (cot 30° / 2)

/** Wire sizes for a pitch: best (touches at the pitch diameter), largest and smallest that work. */
export function wireSizes(pitch) {
  return {
    best: 0.577350269 * pitch, // P / (2·cos 30°)
    max: 1.010362971 * pitch, // still touches the flanks below the crest flat
    min: 0.505181486 * pitch, // still stands above the root
  };
}

/** Basic pitch diameter. */
export const basicPitchDiameter = (d, pitch) => d - H_PD * pitch;

/** The measurement over three wires for a given pitch diameter. */
export const overWires = (d2, pitch, wire) => d2 + 3 * wire - WIRE_K * pitch;

/** The pitch diameter behind a measurement over three wires. */
export const pitchDiameterFrom = (m, pitch, wire) => m - 3 * wire + WIRE_K * pitch;

/** Lead angle in degrees, for a single-start thread. */
export const leadAngle = (d2, pitch) => (Math.atan(pitch / (Math.PI * d2)) * 180) / Math.PI;

/** The preferred number closest to a value (µm). Ties go to the first in the list, as in the spreadsheet. */
export function nearestPreferred(value) {
  let best = PREFERRED[0];
  for (const p of PREFERRED) if (Math.abs(p - value) < Math.abs(best - value)) best = p;
  return best;
}

// ---- Metric: ISO 965-1 ------------------------------------------------------------------

export const ISO_CLASSES = CLASSES.map(([name]) => name);
const POSITIONS = ['e', 'f', 'g', 'h'];
const same = (a, b) => Math.abs(a - b) < 1e-9;

/**
 * Fundamental deviation es for a position and pitch.
 * @returns {{ value: number|null, source: 'table'|'formula'|'undefined' }} value in µm
 */
export function isoEs(position, pitch) {
  const col = POSITIONS.indexOf(position) + 1;
  const row = ES_TABLE.find((r) => same(r[0], pitch));
  if (row) return row[col] === null ? { value: null, source: 'undefined' } : { value: row[col], source: 'table' };
  // Not a pitch in the table: below the smallest pitch the standard gives for this position, it is undefined.
  const smallest = Math.min(...ES_TABLE.filter((r) => r[col] !== null).map((r) => r[0]));
  if (pitch < smallest) return { value: null, source: 'undefined' };
  const [, a, b] = ES_FORMULA.find((f) => f[0] === position);
  const raw = a + b * pitch;
  return { value: raw === 0 ? 0 : -nearestPreferred(raw), source: 'formula' };
}

/**
 * Pitch-diameter tolerance Td2 for a grade, nominal diameter and pitch.
 * @returns {{ value: number|null, source: 'table'|'formula'|'undefined'|'range' }} value in µm
 */
export function isoTd2(grade, d, pitch) {
  const col = 3 + (grade - 3);
  const row = TD2_TABLE.find((r) => r[0] < d && d <= r[1] && same(r[2], pitch));
  if (row) return row[col] === null ? { value: null, source: 'undefined' } : { value: row[col], source: 'table' };
  const below = TD2_TABLE.filter((r) => r[0] < d).map((r) => r[0]);
  const above = TD2_TABLE.filter((r) => r[1] >= d).map((r) => r[1]);
  if (!below.length || !above.length) return { value: null, source: 'range' };
  const lo = Math.max(...below);
  const hi = Math.min(...above);
  const factor = TD2_FACTOR.find((f) => f[0] === grade)[1];
  const raw = 90 * pitch ** 0.4 * Math.sqrt(lo * hi) ** 0.1 * factor;
  return { value: nearestPreferred(raw), source: 'formula' };
}

/**
 * Upper and lower deviation of the pitch diameter for an ISO tolerance class.
 * @returns {{ es: number, ei: number, td2: number, status: string }} in mm, or es/ei null when undefined
 */
export function isoTolerance(d, pitch, cls) {
  const entry = CLASSES.find((c) => c[0] === cls);
  if (!entry) throw new Error('Unknown class ' + cls);
  const [, position, grade] = entry;
  const es = isoEs(position, pitch);
  const td = isoTd2(grade, d, pitch);
  if (es.value === null || td.value === null) {
    return { es: null, ei: null, td2: null, status: td.source === 'range' ? 'range' : 'undefined' };
  }
  const status = es.source === 'table' && td.source === 'table' ? 'table' : 'formula';
  return { es: es.value / 1000, ei: (es.value - td.value) / 1000, td2: td.value / 1000, status };
}

// ---- Unified inch: ASME B1.1 ------------------------------------------------------------

export const UN_CLASSES = ['1A', '2A', '3A'];
const round4 = (x) => Math.round(x * 1e4 + 1e-9) / 1e4;

/**
 * Allowance and pitch-diameter tolerance for a unified external thread (ASME B1.1, section 5),
 * with the standard length of engagement (the basic major diameter). Inches in, inches out.
 * Class 2A: Td2 = 0.0015·D^(1/3) + 0.0015·√LE + 0.015·P^(2/3); class 1A is 1.5× that, 3A is 0.75×.
 * The allowance is 0.300 × the class 2A tolerance for 1A and 2A, and nothing for 3A.
 * @returns {{ es: number, ei: number, td2: number, status: string }}
 */
export function unifiedTolerance(dInch, tpi, cls) {
  if (!UN_CLASSES.includes(cls)) throw new Error('Unknown class ' + cls);
  const p = 1 / tpi;
  const le = dInch;
  const t2a = 0.0015 * Math.cbrt(dInch) + 0.0015 * Math.sqrt(le) + 0.015 * p ** (2 / 3);
  const td2 = round4(t2a * { '1A': 1.5, '2A': 1, '3A': 0.75 }[cls]);
  const allowance = cls === '3A' ? 0 : round4(0.3 * t2a);
  return { es: -allowance, ei: -allowance - td2, td2, status: 'formula' };
}

/** Diameter of a numbered machine-screw size (#0 to #12), in inches. */
export const numberSize = (n) => 0.06 + 0.013 * n;

/**
 * Read a diameter typed in inches: "0.25", "0,25", "1/4", "1-1/4", "1 1/4", "#10" or "10#".
 * @returns {number|null}
 */
export function parseInch(text) {
  const s = String(text).trim().replace(',', '.').replace(/["″]|in$/i, '').trim();
  let m = s.match(/^#\s*(\d{1,2})$/) || s.match(/^(\d{1,2})\s*#$/);
  if (m) return numberSize(Number(m[1]));
  m = s.match(/^(\d+)[\s-]+(\d+)\s*\/\s*(\d+)$/);
  if (m) return Number(m[1]) + Number(m[2]) / Number(m[3]);
  m = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (m) return Number(m[1]) / Number(m[2]);
  return parseNumber(s);
}

/** A number typed with a point or a comma. */
export function parseNumber(text) {
  const s = String(text).trim().replace(/\s/g, '').replace(',', '.');
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  return Number(s);
}

// ---- Putting it together -----------------------------------------------------------------

/**
 * Everything for one thread, in millimetres.
 * @param {{ d: number, pitch: number, es: number, ei: number, wire: number }} t
 */
export function solve({ d, pitch, es, ei, wire }) {
  const d2 = basicPitchDiameter(d, pitch);
  const d2max = d2 + es;
  const d2min = d2 + ei;
  const wires = wireSizes(pitch);
  const tol = 1e-9;
  return {
    d2,
    d2max,
    d2min,
    d2mid: (d2max + d2min) / 2,
    half: (es - ei) / 2,
    mMax: overWires(d2max, pitch, wire),
    mMin: overWires(d2min, pitch, wire),
    mMid: overWires((d2max + d2min) / 2, pitch, wire),
    wires,
    wireFit: wire < wires.min - tol ? 'small' : wire > wires.max + tol ? 'large' : 'ok',
    lead: leadAngle(d2, pitch),
  };
}

/**
 * What a measurement over the wires says.
 * @returns {{ d2: number, verdict: 'in'|'large'|'small', toMid: number, over: number }}
 *   toMid: how much to take off the diameter to reach the middle (negative: already below it)
 *   over: how far outside the limits (0 when inside)
 */
export function checkMeasurement(result, m, pitch, wire) {
  const d2 = pitchDiameterFrom(m, pitch, wire);
  const eps = 5e-7;
  const verdict = d2 > result.d2max + eps ? 'large' : d2 < result.d2min - eps ? 'small' : 'in';
  const over = verdict === 'large' ? d2 - result.d2max : verdict === 'small' ? result.d2min - d2 : 0;
  return { d2, verdict, toMid: d2 - result.d2mid, over };
}
