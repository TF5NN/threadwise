# Validation

The checks in this folder compare Threadwise's numbers with sources that were published
independently of this code. They run with `npm test` and on every push; the site is only
published when they pass.

| File | What it checks | Against |
|---|---|---|
| `wire-geometry.test.mjs` | The general wire formula M = E + G·(1 + 1/sin(α/2)) − (P/2)·cot(α/2), the best-wire size, and the two-wire flank-angle method | Thread Check wire constants for 60°, 55°, 47½°, 29° and 40° |
| `../test/threads.test.mjs` | Metric and unified tolerances, over-wire figures | Gunnar's original spreadsheet; published ASME B1.1 limits |

When two sources disagree, the disagreement and the decision go in `DISCREPANCIES.md`.
Sources and their tiers are listed in `../docs/SOURCES.md`.

## Results so far

- The general wire formula reproduces every constant on the Thread Check sheet
  (60°, 55°, 47½°, 29°, 40°) to the last published digit.
- Two-wire angle method: with a micrometer repeatable to 2 µm and wires known to 1 µm,
  two wire sizes 0.4 mm apart give the flank angle to about ±0.4° (one standard deviation).
  55°, 60° and 80° threads are therefore clearly told apart.
- Metric (ISO 965-1) table values and unified (ASME B1.1) formula values match their
  references exactly (see `../test/threads.test.mjs`).
