# Threadwise build plan

Threadwise is one app with three tabs, all reading from one catalogue of threads:

| Tab | Question it answers |
|---|---|
| **Find** | "I have a thread in my hand. What is it?" |
| **Make** | "What do I drill, turn, and how deep do I cut, for this thread, inside or out?" |
| **Measure** | "What should my micrometer read over the wires, and is my part in tolerance?" |

The app opens on Find and the tabs run in workshop order (Find → Make → Measure, Nov 2026): a
Find result opens in Make, and Make hands its thread to Measure. Each tab can still be used on
its own. Old shared links without a tab, which meant Measure, still open Measure.

The catalogue is the foundation. Each tab only asks it a different question, so the
catalogue is built first and checked hardest.

**Accuracy is the point.** Every number the app shows either comes from a table with a
named source, or from a formula that has been checked against such a table. The repo
holds the proof (`validation/`), and the app says which kind of number you are looking at.

---

## Principles

1. **Tables beat formulas.** Where a standard publishes a table, the table is used.
   Formulas only fill gaps, and the page says so.
2. **Every value has a source.** Each catalogue row carries where it came from
   (`docs/SOURCES.md` lists them, with a quality tier).
3. **Two sources or one official one.** A value goes in only if it matches the standard
   itself (or an official, identical national adoption), or two independent secondary
   sources agree. Disagreements go in `validation/DISCREPANCIES.md`, never silently fixed.
4. **Never assume what the user has.** Wire sizes, measured values and tolerance class are
   typed in, not guessed.
5. **Rank, never decide.** Find shows candidates with how far off each one is, and flags
   look-alikes. It never says "this is it".
6. **Honest about limits.** Tapered threads, worn threads, lead angle, coatings: each limit
   is stated where it matters, not hidden in the About box.
7. **Same family as the other apps.** Northbound's `docs/STYLE.md` palette and banner,
   EN/IS, light/dark, plain static files, no build step, checks on every push.

---

## The thread families

| Family | Standard | Angle | Taper | Measure | Make | Find | Tolerance source |
|---|---|---|---|---|---|---|---|
| ISO metric coarse & fine (M) | ISO 261/262, ISO 965-1 | 60° | – | ✓ (done) | ✓ | ✓ | ISO 965-1 tables ✓ |
| Unified UNC/UNF/UNEF | ASME B1.1 | 60° | – | ✓ (done) | ✓ | ✓ | ASME formulas ✓ (checked vs tables) |
| Whitworth BSW / BSF | BS 84 | 55° | – | ✓ | ✓ | ✓ | BS 84 (to source, see risks) |
| Pipe, parallel G (BSPP) | ISO 228-1 | 55° | – | ✓ | ✓ | ✓ | ISO 228-1 classes A/B |
| Pipe, taper R / Rc / Rp (BSPT) | ISO 7-1 | 55° | 1:16 | – (see below) | ✓ | ✓ | gauge-based |
| NPT | ASME B1.20.1 | 60° | 1:16 | – (see below) | ✓ | ✓ | gauge-based |
| Pg (steel conduit) | DIN 40430 | 80° | – | ✓ | ✓ | ✓ | manufacturer tables, labelled |
| Metric trapezoidal (Tr) | DIN 103 | 30° | – | ✓ (manual tol.) | ✓ | ✓ | ISO 2903 (to source) |
| Metric taper (DIN 158) | DIN 158-1 | 60° | 1:16 | – (tapered) | ✓ | ✓ (bolts) | gauge-based |
| Metric buttress (S) | DIN 513-1 | 3°/30° | – | ✓ (manual tol.) | ✓ | ✓ | DIN 513-2/-3 (to source) |
| Later: ACME, BA, UNS | ASME B1.5, BS 93 | 29°, 47½° | – | later | later | later | – |

**Why tapered threads are not in Measure (at first):** a tapered thread is accepted with
L1 ring and plug gauges ("hand-tight plus or minus one turn"), not with a pitch-diameter
tolerance, and an over-wire reading changes along the length. A "pitch diameter at a given
distance from the end" mode is possible later (E0 + 0.0625·L for NPT), but it needs its
own careful design. Make and Find handle tapered threads fine.

**G and BSP are the same thing.** G (ISO 228-1) is BSP parallel; R/Rc/Rp (ISO 7-1) is
BSP tapered. The app shows both names: "G 1/2 (BSPP)".

---

## Status (20 Nov 2026)

| Phase | State |
|---|---|
| 0 Foundation | ✓ Done: three tabs, address state, disclaimer, CI with validation |
| 1 Catalogue | ✓ Done: 348 rows in 11 families (DIN 158 counted in both lengths), every row sourced and checked |
| 2 Measure | ✓ Done for metric, UN, G, Pg; BSW/BSF with manual tolerance (BS 84 not sourced) |
| 3 Find | ✓ Done: ranking, look-alikes, twins, two-wire angle tool, 2510-reading validation |
| 4 Make | ✓ Done: limits, tap drills, radial/compound infeed, passes, taper data. Gaps listed below |
| 5 Later | Started: Tr, S (DIN 513) and DIN 158 metric taper added from the Töflubók; R gauge distances in; asymmetric (two-flank) wire maths |

**Still open** (each needs a source before it goes in):
- BS 84 tolerances for BSW/BSF (Measure and Make show basic sizes until then).
- Second source for the G internal minor-diameter tolerance at 11 TPI (`DISCREPANCIES.md`).
- Tap drills for tapered threads. (R gauge distances: done, Töflubók p. 267.)
- ISO 2903 tolerances for Tr; DIN 513-2/-3 tolerances for S; a second source for the DIN 158
  and DIN 513 tables (one source each so far, checked against their own formulas).
- A source for compound infeed on S threads (Make offers straight-in only until then).
- The Töflubók's edition year (title page). (M60 tap drill settled at 54.5 mm from tap makers' data.)
- ASME B1.1 internal minor-diameter tolerance (Make shows the minimum only).
- DIN 76 thread undercuts.
- Bench-measured parts for `validation/find-bench.csv`.

## Phases

Each phase ends with a working, published app and green checks.

### Phase 0: Foundation

- Three tabs (Find, Make, Measure, in workshop order).
- Tab state in the address (`#measure`, `#make`, `#find`) so each tab can be bookmarked.
- Catalogue data model (below) and its loader.
- Disclaimer in the app (About, footer, first open), README and site pages. ✓ text done.
- `validation/` harness running in CI next to the unit tests. ✓ started.
- `CLAUDE.md` with the rules for future sessions. ✓

**Done when:** the live page has the tabs, and CI runs both `test/` and `validation/`.

### Phase 1: The catalogue

One data file per family, generated where the standard gives formulas and copied where it
gives tables, every row with a source key.

```js
// One row
{ id: 'G-1/2', family: 'G', name: 'G 1/2', alias: ['BSPP 1/2'],
  angle: 55, pitch: 1.814, tpi: 14, taper: null,
  d: 20.955, d2: 19.793, d1: 18.631,        // basic, mm
  sources: ['ISO228-1:2000/IS2643', 'MH31'] }
```

- Metric coarse/fine: ISO 261 selection of diameter/pitch combinations.
- Unified: ASME B1.1 standard series UNC, UNF, UNEF, numbered and fractional sizes.
- BSW/BSF: BS 84 basic sizes.
- G and R/Rc/Rp: ISO 228-1 and ISO 7-1, 1/16 to 6.
- NPT: ASME B1.20.1, 1/16 to 4 (E0, E1, L1, L2 from the standard's formulas, checked against its table).
- Pg: DIN 40430, Pg 7 to Pg 48.

**Validation:** every basic dimension recomputed from the family's profile formula and
compared with the published table (for example G: d2 = d − 0.640327·P; NPT:
E0 = D − (0.05·D + 1.1)·P). Every row checked against at least one more source.
Report in `validation/catalogue.md`.

**Done when:** every row has passed both checks or is listed in `DISCREPANCIES.md` with a decision.

### Phase 2: Measure for all parallel families

- Generalise the wire maths to any angle (`js/geometry.js`). ✓ done and validated against
  all five constant sets on the Thread Check sheet (60°, 55°, 47½°, 29°, 40°).
- Add BSW/BSF, G (classes A and B), Pg to Measure, with their tolerances.
- Whitworth crests and roots are rounded (r = 0.137329·P): work out the wire range that
  still touches the straight part of the flank, and use it for the smallest/largest wire.
  This is different from the sharp-V range and must be checked.
- Pick a thread from the catalogue (search box) instead of only the dropdowns.

**Validation:** for each new family, the pitch-diameter limits are compared with the
standard's tables for every size; over-wire results are compared with at least one
published over-wire table (Thread Check / Machinery's Handbook) where one exists.

### Phase 3: Find

**Inputs**, in the order a person measures:

1. Internal or external.
2. Diameter: outside over the crests (external) or the bore (internal, which is the *minor*
   diameter). Caliper reading.
3. Pitch, three ways: a thread gauge leaf (mm or TPI), or "length over N threads" with a caliper.
4. Optional: flank angle (from a gauge, or from the two-wire tool below), parallel or tapered,
   and where it came from (plumbing, hydraulics, electrical, car, bicycle, old British machine)
   as a gentle hint, never a filter.

**Matching:**

- Each input has a window the user can widen or narrow. Defaults lean the way real parts
  lean: an external thread usually measures *under* nominal (allowance plus wear), so its
  default window is about −0.4 / +0.1 mm and scales with size; an internal bore measures over
  the basic minor diameter.
- Pitch is compared in both mm and TPI. Look-alikes (1.5 mm vs 16 TPI, 1.25 mm vs 20 TPI,
  0.8 mm vs 32 TPI, 1.814 mm vs 14 TPI) are flagged on the result, with what to check to tell
  them apart.
- Results are ranked by a combined distance and grouped by family, with the closest few
  shown in full and the rest one tap away.
- Pipe threads are shown by both their name and their actual size, because "1/2 inch"
  pipe thread measures about 21 mm, which is the whole reason people get stuck.

**The two-wire angle tool:** measure over two wire sizes at the same spot; the difference
gives the flank angle independently of pitch diameter and pitch:
sin(α/2) = 1 / ((M2 − M1)/(G2 − G1) − 1). ✓ maths validated. With a 2 µm micrometer and wires
known to 1 µm, two wires 0.4 mm apart give the angle to about ±0.4° (1σ), so 55°, 60° and 80°
are clearly separated. Phase 3 adds: wire pairs that fit every candidate angle, and a check
that both wires touch the straight flank (Whitworth's rounded form limits this).

**Validation:** a synthetic test set. For every catalogue thread, generate realistic
readings (worn external, oversize internal, gauge pitch, caliper over 10 threads) with
noise; the right thread must be in the top three, and look-alikes must be flagged. Plus a
list of real parts measured on the bench (Gunnar), kept in `validation/find-bench.csv`.

### Phase 4: Make

**External:**
- Blank (major) diameter to turn, with limits from the class.
- Pitch and minor diameter limits.
- Single-point threading: total radial depth, infeed on the compound at 29.5° (60°),
  27° (55°) and 39.5° (80°), and a suggested pass schedule.
- Thread undercut / relief (DIN 76 for metric).

**Internal:**
- Internal tolerances: ISO 965-1 positions G and H (TD1, TD2 tables), ASME 1B/2B/3B
  formulas, ISO 228-1 internal.
- Tap drill with percentage of thread engagement, and a list of real drill sizes (metric
  and imperial) with the engagement each gives.
- Bore diameter for single-point internal threading.

**Tapered:** taper angle (1:16 → 1.7899° half angle) for the compound/taper attachment,
lengths L1/L2, tap drills (drill only, and drill + taper ream).

**Validation:** internal limits vs the standards' tables; tap drills vs ISO 2306/DIN 336 and
the ASME tap-drill tables; infeed depths vs Machinery's Handbook and a tool maker's chart.

### Phase 5: Later

Tr (trapezoidal), ACME, BA, UNS; taper threads in Measure (pitch diameter at a plane);
printable shop sheet for a thread; site pages and "How it came to be" story.

---

## Validation in the repo

```
validation/
  README.md              how validation works, how to run it
  wire-geometry.test.mjs ✓ wire formula vs Thread Check constants; two-wire angle method
  catalogue.test.mjs     (phase 1) every row vs its formula and its sources
  measure.test.mjs       (phase 2) limits vs standards' tables, over-wire vs published tables
  find.test.mjs          (phase 3) synthetic readings → right answer in the top three
  make.test.mjs          (phase 4) tap drills, internal limits, infeed
  find-bench.csv         (phase 3) real parts measured on the bench
  DISCREPANCIES.md       every disagreement between sources, and what was decided
```

`npm test` runs `test/` and `validation/`. GitHub runs both on every push and only
publishes when both pass (as Feedpoint does).

---

## Risks and open questions

| Risk | What we do about it |
|---|---|
| BS 84 (BSW/BSF) tolerances are in a paid standard. | Look for an official free copy of an identical adoption (as with ISO 228-1 below), NBS/NIST Handbook H28 (US public domain), and Machinery's Handbook. Until two agree, Measure shows BSW basic sizes with tolerance "not available", Find and Make work anyway. |
| ISO 228-1 tables are in a paid standard. | India's IS 2643:2005 is ISO 228-1:2000 adopted word for word and is published free on law.resource.org: use it as the official source, cross-check with manufacturer tables. |
| ISO 965-1 internal tables (Phase 4). | Same route: look for an identical national adoption published free; cross-check with BS 3643 / handbook tables. |
| Pg (DIN 40430) is withdrawn and paid. | Manufacturer tables (Heyco, REMS, Hummel, Lutze) agree on basic sizes; label Pg tolerances "from manufacturer data". |
| Whitworth's rounded form changes which wires work. | Work it out from the profile (r = 0.137329·P) and check against the published 55° best wire. |
| Find could look more certain than it is. | Ranked list with distances and look-alike warnings, never a single answer. |
| Scope: three tabs, seven families. | Phases are each shippable; the live app is never half-done. |

**Decided (20 Nov 2026):**
1. The Overwire repo is deleted; Threadwise is the only home.
2. Order within phases: G (plumbing), metric, BSW (old machines), NPT (US hydraulics), then the rest.
3. Infeed: a toggle between straight radial infeed and the compound; the compound angle follows
   the thread angle (half the angle less ½°). Gunnar ran CNC, so the pass schedule is a
   labelled starting point (constant chip area), not a rule.
4. Machinery's Handbook is available: Gunnar sends photos of pages when a second source is needed.
