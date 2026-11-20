# Threadwise

Screw thread tools for the workshop, in English and Icelandic:

- **Measure**: what the micrometer should read over three wires, and whether your part is in tolerance.
- **Make**: drilling, turning and single-point threading figures, inside and out. *(planned)*
- **Find**: measure an unknown thread and get a ranked list of what it could be. *(planned)*

**Live:** https://tf5nn.github.io/threadwise/

Threadwise grew out of [Overwire](https://github.com/TF5NN/overwire), which began in 2021 as an
Excel sheet for the workshop. The plan for the rest is in [`docs/PLAN.md`](docs/PLAN.md).

> **Disclaimer.** Threadwise is a free hobby project. The calculations are checked against
> published sources, and the checks are in [`validation/`](validation/), but I take no
> responsibility for their correctness, or for anything made, measured or accepted with them.
> Check anything that matters against the standard, with proper gauges.

## What works today

The Measure tab, for external 60° threads:

- Metric ISO (ISO 965-1 classes 4h, 5g6g, 6e, 6f, 6g, 6h, 8g) and unified inch
  (ASME B1.1 classes 1A, 2A, 3A), or your own deviations.
- The smallest, best and largest wire for the pitch. You type the wire you actually have:
  it is never assumed.
- Largest, target and smallest reading over the wires, in mm and inches.
- Check a reading: in tolerance or not, and how much is left to take off.

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
| `js/threads.js` | Metric and unified tolerances, 60° wire maths |
| `js/geometry.js` | Wire maths for any flank angle, and the two-wire angle method |
| `js/iso965-data.js` | ISO 965-1 tables |
| `js/app.js` | Reads the fields, runs the maths, writes the results |
| `js/strings.js` | Every short text in English and Icelandic |
| `js/i18n.js`, `js/lang.js`, `js/theme.js` | Language and theme, shared with Sightline |
| `test/`, `validation/` | The checks |
| `docs/PLAN.md` | The build plan |

## Running it

`npm test` runs all checks (Node 22, nothing to install). `npm run serve`, then open
http://localhost:8080, to try the page on your own computer.

## Licence

Creative Commons Attribution 4.0 (CC BY 4.0).
