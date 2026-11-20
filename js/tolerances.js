// Tolerances for every family, outside (external) and inside (internal), in mm.
// One shape for all of them, so Measure and Make do not need to know the standards:
//
//   { d2: { max, min }, major: { max, min } | null, minor: { min, max } | null,
//     source: 'table' | 'formula' | 'maker' | 'manual' | 'none' | 'gauge', note? }
//
// "table" values come straight from a standard's table; "formula" values come from the
// standard's formulas (rounded to its preferred numbers) where the table has a gap; "maker"
// values come from a manufacturer's published limits. The app shows which.

import { isoTolerance, unifiedTolerance, nearestPreferred } from './threads.js';
import { CLASSES, TD2_TABLE } from './iso965-data.js';
import { EI_G_TABLE, TD1_TABLE, TD2_INT_TABLE } from './data/iso965-internal.js';
import { IN } from './catalogue.js';

const same = (a, b) => Math.abs(a - b) < 1e-9;
const GRADE_FACTOR = { 3: 0.5, 4: 0.63, 5: 0.8, 6: 1, 7: 1.25, 8: 1.6, 9: 2 };

/** Which classes each family offers, outside and inside. */
export const CLASS_LIST = {
  M: { ext: CLASSES.map((c) => c[0]), int: ['4H', '5H', '6H', '7H', '8H', '5G', '6G', '7G'], defExt: '6g', defInt: '6H' },
  UN: { ext: ['1A', '2A', '3A'], int: ['1B', '2B', '3B'], defExt: '2A', defInt: '2B' },
  G: { ext: ['A', 'B'], int: ['–'], defExt: 'A', defInt: '–' },
  Pg: { ext: ['DIN 40430'], int: ['DIN 40430'], defExt: 'DIN 40430', defInt: 'DIN 40430' },
};

// ---- ISO 965-1 helpers ----------------------------------------------------------------------

/** Major-diameter tolerance of an external thread: Td(6) = 180·P^(2/3) − 3.15/√P µm (ISO 965-1). */
export function isoTd(pitch, grade) {
  const t6 = 180 * pitch ** (2 / 3) - 3.15 / Math.sqrt(pitch);
  return nearestPreferred(t6 * GRADE_FACTOR[grade]) / 1000;
}

/** The grade that applies to the crest diameter: the second part of "5g6g", or the only one. */
const crestGrade = (cls) => Number((cls.match(/(\d)[a-hA-H]$/) || [])[1]);

/** Unrounded Td2 grade 6 from the ISO 965-1 formula, for a diameter band. */
function td2Grade6Raw(d, pitch) {
  const lo = Math.max(...TD2_TABLE.filter((r) => r[0] < d).map((r) => r[0]));
  const hi = Math.min(...TD2_TABLE.filter((r) => r[1] >= d).map((r) => r[1]));
  return 90 * pitch ** 0.4 * Math.sqrt(lo * hi) ** 0.1;
}

/** Internal ISO thread: position G or H, grade 4–8. */
export function isoInternal(d, pitch, cls) {
  const m = cls.match(/^(\d)([GH])$/);
  if (!m) throw new Error('Unknown internal class ' + cls);
  const grade = Number(m[1]);
  const col = grade - 3; // [pitch, g4, g5, g6, g7, g8] → grade 4 is column 1
  let source = 'table';

  let EI = 0;
  if (m[2] === 'G') {
    const row = EI_G_TABLE.find((r) => same(r[0], pitch));
    EI = (row ? row[1] : nearestPreferred(15 + 11 * pitch)) / 1000;
    if (!row) source = 'formula';
  }

  const t2 = TD2_INT_TABLE.find((r) => r[0] < d && d <= r[1] && same(r[2], pitch));
  let TD2 = t2 ? t2[2 + col] : null;
  if (TD2 === null || TD2 === undefined) {
    // ISO 965-1: TD2 = 1.32 · Td2(grade 6) · grade factor, rounded to the preferred numbers.
    TD2 = nearestPreferred(1.32 * td2Grade6Raw(d, pitch) * GRADE_FACTOR[grade]);
    source = 'formula';
  }

  const t1 = TD1_TABLE.find((r) => same(r[0], pitch));
  let TD1 = t1 ? t1[col] : null;
  if (TD1 === null || TD1 === undefined) {
    // ISO 965-1: TD1(6) = 433·P − 190·P^1.22 for P < 1 mm, 230·P^0.7 from 1 mm.
    const t6 = pitch < 1 ? 433 * pitch - 190 * pitch ** 1.22 : 230 * pitch ** 0.7;
    TD1 = nearestPreferred(t6 * GRADE_FACTOR[grade]);
    source = 'formula';
  }

  const D2 = d - 0.649519053 * pitch;
  const D1 = d - 1.082531755 * pitch;
  return {
    d2: { min: D2 + EI, max: D2 + EI + TD2 / 1000 },
    minor: { min: D1 + EI, max: D1 + EI + TD1 / 1000 },
    major: { min: d + EI, max: null },
    source,
  };
}

// ---- One entry point ---------------------------------------------------------------------------

/**
 * Tolerance limits for a catalogue row (or an own size), outside or inside, for a class.
 * Manual deviations are handled by the caller.
 */
export function limits(row, side, cls) {
  const fam = row.family;
  if (fam === 'BSW' || fam === 'BSF') return { source: 'none' };
  if (fam === 'R' || fam === 'NPT') return { source: 'gauge' };

  if (fam === 'M') {
    if (side === 'int') return isoInternal(row.d, row.pitch, cls);
    const t = isoTolerance(row.d, row.pitch, cls);
    if (t.es === null) return { source: t.status }; // 'undefined' or 'range'
    const td = isoTd(row.pitch, crestGrade(cls));
    return {
      d2: { max: row.d2 + t.es, min: row.d2 + t.ei },
      major: { max: row.d + t.es, min: row.d + t.es - td },
      minor: null,
      source: t.status,
    };
  }

  if (fam === 'UN') {
    const dIn = row.d / IN;
    const tpi = IN / row.pitch;
    const pIn = 1 / tpi;
    if (side === 'int') {
      // ASME B1.1: internal pitch-diameter tolerance is 1.95 / 1.3 / 0.975 × the class 2A
      // tolerance for 1B / 2B / 3B, with no allowance; the minimum is the basic size.
      const t2aRaw = 0.0015 * Math.cbrt(dIn) + 0.0015 * Math.sqrt(dIn) + 0.015 * pIn ** (2 / 3);
      const factor = { '1B': 1.95, '2B': 1.3, '3B': 0.975 }[cls];
      // Not rounded here: ASME rounds the finished limit (0.217524 + 0.004850 → 0.2224),
      // and rounding the tolerance first would give 0.2223 (validation/tolerances.test.mjs).
      const TD2 = t2aRaw * factor;
      return {
        d2: { min: row.d2, max: row.d2 + TD2 * IN },
        minor: { min: row.d1, max: null },
        major: { min: row.d, max: null },
        source: 'formula',
        note: 'unMinor',
      };
    }
    const t = unifiedTolerance(dIn, tpi, cls);
    // Major-diameter tolerance (ASME B1.1): 0.060·P^(2/3) for 2A and 3A, 0.090·P^(2/3) for 1A.
    const td = Math.round((cls === '1A' ? 0.09 : 0.06) * pIn ** (2 / 3) * 1e4 + 1e-9) / 1e4;
    return {
      d2: { max: row.d2 + t.es * IN, min: row.d2 + t.ei * IN },
      major: { max: row.d + t.es * IN, min: row.d + (t.es - td) * IN },
      minor: null,
      source: 'formula',
    };
  }

  if (fam === 'G') {
    // ISO 228-1: internal pitch diameter 0 / +TD2 (= class A), minor 0 / +TD1; external
    // entirely negative, class A = TD2, class B = 2 × TD2; major diameter −Td (= class B).
    if (side === 'int') {
      return {
        d2: { min: row.d2, max: row.d2 + row.td2A },
        minor: { min: row.d1, max: row.d1 + row.td1 },
        major: { min: row.d, max: null },
        source: 'table',
      };
    }
    const t = cls === 'B' ? 2 * row.td2A : row.td2A;
    return {
      d2: { max: row.d2, min: row.d2 - t },
      major: { max: row.d, min: row.d - 2 * row.td2A },
      minor: null,
      source: 'table',
    };
  }

  if (fam === 'Pg') {
    if (side === 'int') {
      return {
        d2: { min: row.d2, max: row.D2maxF },
        minor: { min: row.d1, max: row.D1maxF },
        major: { min: row.d, max: null },
        source: 'maker',
      };
    }
    return {
      d2: { max: row.d2, min: row.d2minM },
      major: { max: row.d, min: row.dminM },
      minor: null,
      source: 'maker',
    };
  }
  return { source: 'none' };
}
