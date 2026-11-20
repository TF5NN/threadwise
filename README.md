# Threadwise

Screw thread tools for the workshop, in English and Icelandic:

- **Find**: measure an unknown thread and get a ranked list of what it could be, with look-alike
  warnings and a flank-angle tool that works from two wire sizes (over three wires, or one wire
  with the anvil on the thread tops).
- **Make**: sizes to turn or bore, tap drills with % of thread, and single-point depth and infeed.
- **Measure**: what the micrometer should read over three wires, and whether your part is in tolerance.

The tabs follow the workshop: a Find result opens in Make with one tap, and Make's "Measure it"
button carries the thread on to Measure. Every tab still works on its own, so any step can be skipped.

Thread types: metric ISO, UNC/UNF/UNEF, BSW/BSF, pipe G (BSPP), R (BSPT), NPT, metric taper
(DIN 158, grease nipples and plugs), Pg, metric trapezoidal (Tr) and metric buttress (S, DIN 513). The Icelandic follows the *Töflubók*; see [`docs/ORDASAFN.md`](docs/ORDASAFN.md).

**Live:** https://tf5nn.github.io/threadwise/

Threadwise began in 2021 as an Excel sheet for measuring metric threads over wires in the
workshop. The plan, and what is left to do, is in [`docs/PLAN.md`](docs/PLAN.md).

> **Disclaimer.** Threadwise is a free hobby project. The calculations are checked against
> published sources, and the checks are in [`validation/`](validation/), but I take no
> responsibility for their correctness, or for anything made, measured or accepted with them.
> Check anything that matters against the standard, with proper gauges.

## What works today

| Tab | Families | Notes |
|---|---|---|
| Measure | Metric, UN, BSW/BSF, G, Pg, Tr, S | Wire range worked out from each thread form; S uses the two-flank (3°/30°) wire formula. BSW/BSF, Tr and S tolerances by hand until BS 84 / ISO 2903 / DIN 513 are sourced. Tapered threads (R, NPT, DIN 158) are gauged, not wire-measured. |
| Make | All eleven | Outside and inside limits, tap drills (metric 0.1 mm and fractional inch, with the Töflubók's drill marked ★), radial or compound infeed with a pass schedule, taper data for R (gauge distance, useful length), NPT and DIN 158 (gauge and test planes). |
| Find | All eleven | Bolt or hole, pitch by gauge or over N threads, optional flank angle and taper. Ranks, flags look-alikes and twins, never decides. |

## How accuracy is handled

- Tables beat formulas. Formula values are labelled in the app.
- Every value has a source, listed in [`docs/SOURCES.md`](docs/SOURCES.md).
- The checks in [`validation/`](validation/) and [`test/`](test/) compare the app's numbers
  with independently published ones. They run on every push, and the site is only published
  when they pass.
- Disagreements between sources are written down in
  [`validation/DISCREPANCIES.md`](validation/DISCREPANCIES.md), never fixed silently.

## Files

| File | What it is |
|---|---|
| `index.html` | The page, and the About text in both languages |
| `css/style.css` | Looks; the colour block at the top is shared with the other TF5NN apps |
| `js/catalogue.js`, `js/data/` | The thread catalogue (348 rows, 11 families) and its raw, sourced lists |
| `docs/ORDASAFN.md` | Icelandic–English dictionary of thread and workshop terms, from the Töflubók |
| `js/tolerances.js` | Outside and inside limits for every family |
| `js/geometry.js` | Wire maths for any flank angle, wire range from the profile, two-wire angle |
| `js/threads.js` | ISO 965-1 external and ASME B1.1 formulas, number parsing |
| `js/iso965-data.js`, `js/data/iso965-internal.js` | ISO 965-1 tables |
| `js/measure.js`, `js/make.js`, `js/find.js` | The three tabs |
| `js/main.js`, `js/hash.js`, `js/format.js` | Tabs, the address, number formatting |
| `js/strings.js` | Every short text in English and Icelandic |
| `js/i18n.js`, `js/lang.js`, `js/theme.js` | Language and theme, shared with Sightline |
| `test/`, `validation/` | The checks |
| `docs/PLAN.md` | The build plan |

## Running it

`npm test` runs all checks (Node 22, nothing to install). `npm run serve`, then open
http://localhost:8080, to try the page on your own computer.

## Licence

Creative Commons Attribution 4.0 (CC BY 4.0).
