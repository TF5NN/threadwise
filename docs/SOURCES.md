# Sources

Every value in the catalogue carries one or more of these keys. Tiers:

- **A**: the standard itself, or an official, word-for-word national adoption of it.
- **B**: a recognised handbook or a measuring-equipment maker's published tables.
- **C**: a product maker's catalogue (good for basic sizes, weaker for tolerances).

A value goes in with one tier-A source, or two independent tier-B/C sources that agree.

| Key | Tier | What | Used for |
|---|---|---|---|
| `ISO965-1:sheet` | A | ISO 965-1 tables for es and Td2, copied cell for cell from Gunnar's 2021–2026 spreadsheet | Metric external tolerances |
| `ASME-B1.1` | A | ASME B1.1, section 5 formulas (Td2 class 2A, allowance 0.300·Td2) | Unified tolerances |
| `ASME-B1.1:pub` | B | Published UNC 2A/1A/3A pitch-diameter limits (1/4-20, 3/8-16, 1/2-13) | Check of the formulas |
| `ThreadCheck-p30` | B | Thread Check Inc., *Thread Measuring Wire Formulas*, catalogue p. 30 | Wire constants for 60°, 55°, 47½°, 29°, 40° |
| `IS2643:2005` | A | IS 2643:2005, identical to ISO 228-1:2000, published at law.resource.org (scanned; misreads logged) | G threads |
| `EE-ISO228` | B | Engineers Edge, External British Pipe Threads table per BS EN ISO 228 | G threads, second source |
| `EE-Whitworth` | B | Engineers Edge, Whitworth BSW/BSF chart (inches) | BSW, BSF |
| `Torqbolt-BSF` | B | Torqbolt, BS 84 BSF table (mm) | BSF, second source |
| `EE-NPT` | B | Engineers Edge, NPT table (ANSI/ASME B1.20.1-1983 R1992) | NPT |
| `ASME-B1.1:list` | B | Albany County Fasteners UNC/UNF/UNEF chart; Missouri S&T thread reference | Unified sizes and TPI |
| `ISO261` | B | ISO 261/262 diameter–pitch combinations, each checked to exist in the ISO 965-1 tables | Metric sizes |
| `Accu-ISO965` | B | Accu Components, ISO metric thread tolerances, tables 1, 2, 4 | Internal metric tolerances |
| `ISO965-2:pub` | B | Widely published 6H/6g limits for M5–M12 (as in Machinery's Handbook) | Checks only |
| `ASME-B1.20.1` | A | NPT formulas E0 = D − (0.05·D + 1.1)·P, E1 = E0 + 0.0625·L1, L2 = (0.80·D + 6.8)·P; Table 2 rows 1/16–1/2 as quoted publicly | NPT, checks |
| `MH31` | B | Machinery's Handbook, 31st edition | Cross-checks for all families |
| `Heyco-PG` | C | Heyco DIN 40430 specification sheet (basic and limit sizes) | Pg |
| `REMS-tables` | C | REMS thread tables (Pg, G, NPT, R basic sizes) | Pg, pipe threads |
| `Hummel-PG` | C | Hummel thread-type overview | Pg |

Still to find (see PLAN.md, "Risks"): a source for BS 84 (BSW/BSF) tolerances; a second
source for the G internal minor-diameter tolerance at 11 TPI; ISO 7-1 gauge lengths for R threads;
ASME B1.1 internal minor-diameter tolerances.
