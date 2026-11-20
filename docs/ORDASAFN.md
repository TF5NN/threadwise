# Orðasafn · Icelandic–English thread and workshop terms

The Icelandic in Threadwise follows the *Töflubók* (IÐNÚ, the Icelandic edition of
Tabellenbuch Metall). Each term below is as printed in the book, with the page it is on.
**App** marks the word Threadwise uses where the book has more than one.

To add a term: add a row in the right section, with the page. When the app's wording
changes, change it in `js/strings.js` (and `index.html` for the About box) in the same commit.

## Gengjur · Threads

| Íslenska | English | Symbol | Page | App |
|---|---|---|---|---|
| gengja, gengjur | screw thread | | 264 | ✓ |
| snitti | thread (esp. pipe and Whitworth threads) | | 264, 267, 269 | ✓ rörasnitti, Whitworth-snitti |
| heiti á gengjum | thread type, thread designation | | 264 | (app: gengjugerð) |
| skammstöfun | designation, abbreviation | | 264 | |
| einkennisbókstafur | identifying letter (M, G, R, Tr …) | | 264 | |
| utangengja, boltagengja | external thread | d | 265, 270 | ✓ |
| innangengja, róargengja | internal thread | D | 265, 270 | ✓ |
| utansnitti / innansnitti | external / internal thread (pipe) | | 267 | |
| ISO metragengjur, metra ISO-gengjur | ISO metric threads | M | 264, 265 | ✓ |
| venjulegar gengjur | coarse series | | 265 | ✓ |
| fínar gengjur | fine series | | 265 | ✓ |
| röð 1, röð 2 | first choice, second choice (sizes) | | 265 | |
| sívöl gengja | parallel (cylindrical) thread | | 264, 267 | ✓ |
| keilulaga gengja | tapered thread | | 264, 266 | ✓ |
| keilulaga metra utangengja | metric taper external thread (grease nipples, plugs) | DIN 158 | 266 | |
| rörasnitti | pipe thread | G, R, Rp | 267 | ✓ |
| rörasnitti fyrir þéttandi tengingar sem ekki eru í snittinu | pipe thread, pressure-tight joint NOT made on the thread | G | 264, 267 | |
| rörasnitti fyrir snitti með þéttandi tengingum | pipe thread, pressure-tight joint made on the thread | R, Rp | 264, 267 | |
| málviksflokkur A (meðal), B (grófur) | tolerance class A (medium), B (coarse) for G | | 267 | |
| Whitworth-snitti | Whitworth thread (marked *óstaðlað*, not standardised, in the book) | | 269 | ✓ |
| trapisugengja, metra ISO-trapisugengjur | trapezoidal thread | Tr | 264, 268 | ✓ |
| sagarskrúfa, sagarsnitti | buttress (saw-tooth) thread | S | 264, 268 | |
| bugðugengja | round thread | Rd | 264 | |
| boddískrúfa | sheet-metal (self-tapping) screw | ST | 264 | |
| kúlugengja, kúluskrúfa | ball screw | | 269 | |
| hægri / vinstri gengja | right-hand / left-hand thread | RH / LH | 264 | |
| einnar rásar, margrása | single-start, multi-start | | 268 | ✓ einnar rásar |
| gengjufjöldi | number of starts | n | 264, 268 | |

## Mál og þvermál · Dimensions

| Íslenska | English | Symbol | Page | App |
|---|---|---|---|---|
| nafnþvermál | nominal diameter | d = D | 264, 265 | ✓ |
| ytra þvermál, ytra-Ø, utanþvermál | major diameter | d, D | 267, 269, 270 | ✓ |
| meðalþvermál (also hliðarþvermál, flatar-Ø, meðaltalsþvermál) | pitch diameter | d2 = D2 | 265, 267, 270 | ✓ meðalþvermál |
| kjarnaþvermál boltagengju | minor (root) diameter, external | d3 | 265 | ✓ |
| kjarnaþvermál róargengju | minor diameter, internal | D1 | 265 | ✓ |
| ytra-Ø róar | major diameter of the nut (trapezoidal) | D4 | 268 | ✓ |
| halli | pitch (metric table) | P | 265 | |
| stigning, stigun | pitch | P | 267, 268, 269 | ✓ stigning |
| stigun margrása | lead | Ph | 268 | |
| gengjufjöldi á 25,4 mm, gengjur á tommu, gangrás á tommu | threads per inch | z | 267, 269 | ✓ gengjur á tommu |
| topphorn, gengjuhorn, skrúfuhalli | thread (included flank) angle | | 265, 268, 269 | ✓ gengjuhorn |
| gengjudýpt, dýpt boltagengju / róargengju | thread depth, external / internal | h3, H1 | 265, 268 | ✓ |
| snittisdýpt, skrúfudýpt | thread depth (pipe, Whitworth) | h1 | 267, 269 | |
| samliggjandi gengjufletir | flank overlap | H1 | 268 | |
| gengjuflötur, gengjufletir | flank, flanks | | 268 | ✓ |
| hæð grunnþríhyrnings | height of the fundamental triangle | H | 267 | |
| radíi, rúningur | root/crest radius | R, r | 265, 267, 268 | |
| toppfrígangur | crest clearance | ac | 268 | |
| rennistálsbreidd | tool tip width | b | 268 | ✓ |
| spennuþversnið | tensile stress area | S | 265 | |
| þvermál kjarnagatsbors | tap drill diameter | | 265 | ✓ kjarnagatsbor |
| gengjuöxull, snittisöxull | thread axis | | 266, 267 | |
| viðmiðunarflötur | gauge plane (reference plane) | | 266, 267 | ✓ |
| fjarlægð viðmiðunarflatar | gauge distance from the end | a | 266, 267 | ✓ |
| prófunarflötur | test plane | | 266 | |
| nothæf gengjulengd, nothæf snittislengd | useful thread length | l1 | 266, 267 | ✓ |
| nafnvídd röra | nominal pipe size | DN | 267 | ✓ |
| keiluhlutfall | taper ratio | C | 218 | ✓ |
| stigningarhorn | lead (helix) angle | φ | 269 | ✓ |

## Málvik · Tolerances

| Íslenska | English | Symbol | Page | App |
|---|---|---|---|---|
| málvik | tolerance | T | 270 | ✓ |
| málviksflokkur | tolerance class (e.g. 6H, 6g) | | 270 | ✓ |
| málviksgráða | tolerance grade (the number) | | 270 | |
| lega málvikssvæðis, grunnmælingarfrávik | tolerance position (the letter) | H, g … | 270 | |
| frávik | deviation | es, ei, ES, EI | 92, 270 | ✓ |
| grunnmál | basic size | | 270 | ✓ |
| stærsta mál / minnsta mál | largest / smallest size | hám. / lágm. | 270 | ✓ |
| fínt, meðal, gróft | fine, medium, coarse (tolerance quality) | | 270 | |
| gengjuflokkur S, N, L | length-of-engagement group short, normal, long | | 270 | |
| lengd snittis | length of thread engagement | | 270 | ✓ |
| framleiðsluflokkur A, B, C | product grade A, B, C (bolts and nuts) | | 272 | |

## Rennsli og borun · Turning and drilling

| Íslenska | English | Symbol | Page | App |
|---|---|---|---|---|
| rennsli | turning | | 209 | |
| rennistál | turning tool | | 209, 218 | ✓ |
| gengjurennsli | thread turning (single-point) | | | ✓ (not in the book's photos) |
| toppsleði | compound slide | | 218 | ✓ |
| þversleði | cross slide | | | ✓ (not in the book's photos) |
| eftirgangur, eftirgangshliðrun | tailstock, tailstock offset | lv | 218 | |
| keilurennsli | taper turning | | 218 | |
| keiluhorn | taper angle (included) | α | 218 | |
| aðalegg, bakegg | main cutting edge, minor cutting edge | | 209 | |
| fríhorn, egghorn, spónhorn | clearance, wedge, rake angle | α, β, γ | 209, 219 | |
| instillihorn, oddhorn | approach angle, nose (point) angle | κr, εr / σ | 209, 219 | |
| færsla | feed | f | 209, 219 | |
| spóndýpt | depth of cut | ap | 209, 219 | |
| spónbreidd, spónþykkt | chip width, chip thickness | b, h | 209 | |
| spónflatarmál | chip cross-section | A | 209 | |
| skerhraði | cutting speed | vc | 209 | |
| snúningstíðni | spindle speed | n | 209 | |
| skerkraftur | cutting force | Fc | 209 | |
| borun | drilling | | 219 | |
| gengjuborun | tapping | | 5 (contents) | |
| rífun, útborun, sökkvun | reaming, boring, countersinking | | 219 | ✓ rífa (keilu) |
| kjarnagat | tap-drill hole (core hole) | | 265 | ✓ |

## Skrúfur og rær · Bolts and nuts

| Íslenska | English | Symbol | Page | App |
|---|---|---|---|---|
| bolti, boltar | bolt, bolts | | 270 | ✓ |
| ró, rær | nut, nuts | | 270 | ✓ |
| skrúfa | screw | | 264 | |
| burðarþolsflokkur | property class (8.8, 10.9 …) | | 271 | |
| togþol, teygjumörk | tensile strength, yield strength | Rm, ReL | 271 | |
| frígangsgat | clearance hole | dh | 272 | |
| minnsta skrúfunardýpt | minimum thread engagement depth | le | 272 | |

## Not in the book (Threadwise's own words)

| Íslenska | English | Note |
|---|---|---|
| mál yfir víra | measurement over wires | The three-wire method is not in the photographed pages. |
| vír, vírar | measuring wire(s) | |
| markmál | target size (middle of the tolerance) | |
| innmötun | infeed | |
| fríumferð | spring pass | |
| tvífari | twin (same size and pitch, different angle) | |
