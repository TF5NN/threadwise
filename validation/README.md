# Validation

The checks in this folder compare Threadwise's numbers with sources that were published
independently of this code. They run with `npm test` and on every push; the site is only
published when they pass.

| File | What it checks | Against |
|---|---|---|
| `wire-geometry.test.mjs` | Wire formula for any angle, best wire, wire range from the profile, two-wire angle method | Thread Check constants (60°, 55°, 47½°, 29°, 40°); ISO 60° wire limits |
| `catalogue.test.mjs` | Every catalogue row | ISO 965-1 tables (metric combinations), profile formulas (BSW/BSF, G), ASME B1.20.1 formulas (NPT), the second G source |
| `tolerances.test.mjs` | Outside and inside limits | Two independent copies of ISO 965-1; published 6H/6g limits M5–M12; ASME 2A/2B limits; ISO 228-1 second source; Pg maker data |
| `find.test.mjs` | Ranking | 2510 synthetic readings (every thread, bolts and holes, worn/oversize, noisy pitch) |
| `make.test.mjs` | Tap drills, depths, compound angles, passes | Classic tap-drill charts (#7 for 1/4-20, DIN 336), standard profile depths |
| `../test/threads.test.mjs` | Metric and unified tolerances, over-wire figures | Gunnar's original spreadsheet; published ASME B1.1 limits |

When two sources disagree, the disagreement and the decision go in `DISCREPANCIES.md`.
Sources and their tiers are listed in `../docs/SOURCES.md`.

## Results so far

- **Wire formula:** reproduces every Thread Check constant to the last published digit, and the
  ISO 60° wire limits (0.505182·P, 1.010363·P) from the profile alone.
- **Two-wire angle:** with a 2 µm micrometer and wires known to 1 µm, two sizes 0.4 mm apart give
  the flank angle to about ±0.4°. 55°, 60° and 80° are clearly told apart.
- **Catalogue:** every metric size is a standard ISO 965-1 combination; every BSW/BSF effective
  diameter, every G diameter and every NPT E0/E1 follows its standard's formula. The formulas
  also caught three misreads in the scanned ISO 228-1 copy (see `DISCREPANCIES.md`).
- **Tolerances:** 6H nut limits for M5–M12 and 6g bolt major limits for M6–M12 match published
  values exactly; ASME 2B/2A limits match; G class A/B match the second source.
  Where ISO tables have gaps, the formulas fill them; for TD1 they equal the table in 87 of 101
  cases and are never more than one preferred-number step off.
- **Find:** in 2510 simulated readings the right thread is in the top three every time, and
  first in about 97 % (the rest are genuine ties: G vs R, UNC vs BSW twins, until the angle or
  taper is given).
- **Make:** % of thread reproduces the classic charts (1/4-20 with a #7 drill ≈ 75 %; DIN 336
  M6 5.0, M10 8.5, M3 2.5 ≈ 77 %); DIN 336 drills for M6–M12 fall inside the 6H limits.
