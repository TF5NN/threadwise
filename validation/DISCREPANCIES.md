# Discrepancies between sources

Every case where two sources disagree, and what Threadwise does about it.
Nothing is changed silently.

| Date | Thread / value | Source 1 | Source 2 | Decision |
|---|---|---|---|---|
| 2026-11-20 | ISO 965-1 formula fallback vs table | Formulas, rounded to preferred numbers | Tables | Tables always win. The formulas match Td2 in 262 of 296 cases and es in 53 of 66 (spreadsheet); internal TD1 in 87 of 101 (validation). Never more than one preferred-number step apart. Formula values are labelled in the app. |
| 2026-11-20 | G 2 1/2 major diameter | IS 2643:2005 scan: 75.164 | Engineers Edge (ISO 228): 75.184 | **75.184.** Only 75.184 gives the tabled d2 73.705 through d2 = d − 0.640327·P (both sources agree on d2). Scan misread. Checked in `catalogue.test.mjs`. |
| 2026-11-20 | G 3 major diameter | IS 2643 scan: 87.864 | Engineers Edge: 87.884 | **87.884**, same reasoning (d2 86.405). |
| 2026-11-20 | G 1 1/4 internal TD2, G 2 class A | IS 2643 scan: +0.160, −0.160 | Engineers Edge: 0.180 (from d2 limits) | **0.180.** Second source, and every other 11-TPI size up to 2 in uses 0.180. |
| 2026-11-20 | G internal minor-diameter tolerance, 11 TPI | IS 2643 scan: 0.640 and 0.840 mixed between sizes | – | **0.640 for all 11-TPI sizes.** ISO 228-1 sets TD1 by pitch; the scan's 0.840 values do not follow any pattern and look like 6→8 misreads. **Needs a second source** (Machinery's Handbook photo from Gunnar). |
| 2026-11-20 | G table d1 vs exact formula | Table: d1 = d2 − h with h rounded (G 1: 30.291) | Exact formula: 30.2919 | Table values used as printed; difference ≤ 1 µm, documented in the check. |
| 2026-11-20 | ISO preferred numbers above 1000 µm | Spreadsheet list ends at 1000 | ISO 965-1 tables go to 1250 (TD1 grade 8) | R40 series continued (1060, 1120 …). Only affects formula fallbacks for coarse internal threads. |
| 2026-11-20 | ASME internal pitch-diameter limits | Rounding the 2B tolerance first: 1/4-20 max 0.2223 | Published: 0.2224 | ASME rounds the finished limit, not the tolerance. Threadwise does the same. |
| 2026-11-20 | Metric M1 × 0.25 6H minor diameter | Gjengetapp table: 0.729–0.809 | ISO 965-1 TD1 table: no grade 6 at 0.25 mm pitch | Open. Threadwise uses the ISO formula for gaps and labels it. |
| 2026-11-20 | R (BSPT) sizes | Catalogue gave R every G size (24) | Töflubók p. 267 (DIN 2999-1): 15 sizes, no 5/8, 7/8, 1 1/8, 1 3/4, 2 1/4, 2 3/4, 3 1/2, 4 1/2, 5 1/2 | **Fixed:** R only in the 15 sizes, with gauge distance a and useful length l1 from the book. |
| 2026-11-20 | Tr 70 × 10, d3 | Töflubók p. 268 prints 59.5 | The book's own formula d3 = d − (P + 2·ac) = 59; D4 = 71 and H4 = 5.5 on the same row agree with ac = 0.5 | **59.** Printed value kept in `TR_PRINTED` and checked in `toflubok.test.mjs`. |
| 2026-11-20 | Tr 40 × 7, tool width b | Töflubók prints 2.297 | Formula b = 0.366·P − 0.54·ac = 2.292, as printed for Tr 42 × 7 and Tr 44 × 7 | **2.292.** |
| 2026-11-20 | 3" BSW, d2 | Töflubók p. 269 prints 72.56 | Its own d1 (66.91) and formula give 71.55; Engineers Edge 2.817" = 71.55 mm | **71.55** (exact 71.553). Misprint. |
| 2026-11-20 | BSW values to 0.01 mm | Töflubók uses d2 = d − 0.640·P, d1 = d − 1.28·P (rounded constants, per its header) | BS 84: 0.640327, 1.280654 | Exact constants used; the book can differ by up to ~0.007 mm. Documented in the check. |
| 2026-11-20 | M60 tap drill | Töflubók p. 265 prints 55 mm | 6H minor diameter limits 54.046–54.796 mm (ISO 965-1): 55 is outside | **Resolved 2026-11-20:** 54.5 mm is used. Walter (M60×5.5 tap, "drill bit size 54.50 mm") and BAER (M60×5.5 hand tap, 54.5 mm) agree and it sits inside 6H; the same sources give 50.5 for M56, as the book does. The online Fossberg Snitttafla (issuu) could not be read to check. Most likely a misread of the photo or a rounding in the book. |
| 2026-11-20 | M30 × 2 6H, D2 min | Töflubók p. 270 prints 28.702 | Basic pitch diameter 28.701 (p. 265 of the same book) | **28.701.** Misprint or misread of the photo. |
| 2026-11-20 | Whitworth status | Engineers Edge: BS 84 | Töflubók p. 269 marks Whitworth *óstaðlað* (not standardised, in the DIN context) | Noted. BS 84 tolerances still not sourced. |

