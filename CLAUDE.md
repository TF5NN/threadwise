# Threadwise: notes for working on this repo

Read `docs/PLAN.md` first: it says what is being built, in which order, and why.

## Rules

- **Accuracy first.** No number goes into the catalogue or the maths without a source in
  `docs/SOURCES.md` and a check in `validation/`. Tables beat formulas; formula values are
  labelled in the app. Disagreements go in `validation/DISCREPANCIES.md`.
- **Never assume a measured value.** Wire sizes, readings and classes are typed by the user.
- **Find ranks, never decides.**
- **Same look as the other TF5NN apps.** The colour block at the top of `css/style.css` is
  a copy of Northbound's (`TF5NN/sat-track/docs/STYLE.md`); add no colours without listing
  them there. EN and IS for every text (`js/strings.js`); light and dark.
- **Plain static files, no build step, no dependencies.** `npm test` runs everything with Node 22.
- **Gunnar is not a programmer.** Explain changes in plain words; keep code readable, with
  comments that say why.
- Keep the disclaimer in the About box, the footer and the README.
