# Discrepancies between sources

Every case where two sources disagree, and what Threadwise does about it.
Nothing is changed silently.

| Date | Thread / value | Source 1 | Source 2 | Decision |
|---|---|---|---|---|
| 2026-11-20 | ISO 965-1 formula fallback vs table | Formulas, rounded to preferred numbers | Tables | Tables always win; the spreadsheet notes the formulas match Td2 in 262 of 296 cases and es in 53 of 66, otherwise one preferred-number step off. The app labels formula values. |
