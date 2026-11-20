// Every short piece of text the app shows, in English and Icelandic, side by side.
//
// To change a wording, change it here. A word in curly brackets, such as {value},
// is filled in by the app: leave it in place, but it can move within the sentence.
// The English must stay the same as the text written in index.html, which is what
// shows before the script has run.
//
// The About box is not in here: it is written out in both languages in index.html.

export const STRINGS = {
  // --- page and banner -------------------------------------------------------------
  'meta.title': { en: 'Threadwise: screw thread tools', is: 'Threadwise: gengjuverkfæri' },
  'meta.description': {
    en: 'What your micrometer should read over three wires, for metric ISO and unified inch external threads, with the tolerance worked out for you.',
    is: 'Hvað míkrómælirinn á að sýna yfir þrjá víra, fyrir metrískar ISO- og tommugengjur (UN), með málvikum reiknuðum fyrir þig.',
  },
  'brand.home': { en: 'Threadwise home', is: 'Threadwise forsíða' },
  'brand.tagline': { en: 'SCREW THREAD TOOLS', is: 'GENGJUVERKFÆRI' },
  'head.about': { en: 'About', is: 'Um forritið' },
  'head.site': { en: 'More projects from TF5NN', is: 'Fleiri verkefni frá TF5NN' },
  'head.github': { en: 'Source code on GitHub', is: 'Frumkóði á GitHub' },
  'link.site': { en: 'https://tf5nn.github.io/', is: 'https://tf5nn.github.io/is/' },
  'lang.switch': { en: 'Language', is: 'Tungumál' },
  'about.close': { en: 'Close', is: 'Loka' },

  // --- thread ----------------------------------------------------------------------
  'thread.title': { en: 'Thread', is: 'Gengja' },
  'thread.hint': { en: 'External 60° threads, single start.', is: 'Ytri 60° gengjur, einföld stigning.' },
  'sys.label': { en: 'Thread system', is: 'Gengjukerfi' },
  'sys.metric': { en: 'Metric (ISO)', is: 'Metrískar (ISO)' },
  'sys.inch': { en: 'Inch (UN)', is: 'Tommu (UN)' },
  'preset.label': { en: 'Common size', is: 'Algeng stærð' },
  'preset.custom': { en: 'Own size', is: 'Eigin stærð' },
  'preset.coarse': { en: 'Coarse', is: 'Grófar' },
  'preset.fine': { en: 'Fine', is: 'Fínar' },
  'd.label': { en: 'Nominal diameter', is: 'Nafnmál' },
  'd.hintInch': { en: '0.25, 1/4, 1-1/4 or #10', is: '0,25, 1/4, 1-1/4 eða #10' },
  'p.label': { en: 'Pitch', is: 'Stigning' },
  'tpi.label': { en: 'Threads per inch', is: 'Gengjur á tommu' },
  'tol.label': { en: 'Tolerance', is: 'Málvik' },
  'tol.standard': { en: 'Standard class', is: 'Staðlaður flokkur' },
  'tol.manual': { en: 'Manual', is: 'Handvirkt' },
  'cls.label': { en: 'Tolerance class', is: 'Málvikaflokkur' },
  'es.label': { en: 'Upper deviation es', is: 'Efra frávik es' },
  'ei.label': { en: 'Lower deviation ei', is: 'Neðra frávik ei' },
  'manual.hint': { en: 'From the basic pitch diameter. Negative is smaller.', is: 'Frá grunnstigningarþvermáli. Mínus er minna.' },

  // --- status of the tolerance ---------------------------------------------------------
  'status.table': { en: 'Tolerances from the ISO 965-1 tables.', is: 'Málvik úr töflum ISO 965-1.' },
  'status.formula': {
    en: 'Not a standard combination in ISO 965-1: tolerances worked out with the standard’s formulas and rounded to preferred numbers. They can differ from a table value by one step.',
    is: 'Ekki stöðluð samsetning í ISO 965-1: málvik reiknuð með formúlum staðalsins og námunduð að valgildum. Þau geta munað einu þrepi frá töflugildi.',
  },
  'status.undefined': {
    en: 'ISO 965-1 does not define this tolerance class for this pitch. Choose another class or enter the deviations by hand.',
    is: 'ISO 965-1 skilgreinir ekki þennan málvikaflokk fyrir þessa stigningu. Veldu annan flokk eða sláðu frávikin inn handvirkt.',
  },
  'status.range': {
    en: 'The diameter is outside ISO 965-1 (over 0.99 mm up to 355 mm). Enter the deviations by hand.',
    is: 'Nafnmálið er utan ISO 965-1 (yfir 0,99 mm að 355 mm). Sláðu frávikin inn handvirkt.',
  },
  'status.unified': {
    en: 'ASME B1.1 formulas, with the standard length of engagement. They reproduce the published tables.',
    is: 'Formúlur ASME B1.1, með staðlaðri griplengd. Þær gefa sömu gildi og útgefnu töflurnar.',
  },
  'status.manual': { en: 'Your own deviations.', is: 'Þín eigin frávik.' },
  'status.order': { en: 'The lower deviation must be below the upper one.', is: 'Neðra frávik verður að vera lægra en efra frávik.' },
  'status.input': { en: 'Enter a diameter and a pitch.', is: 'Sláðu inn nafnmál og stigningu.' },
  'status.pitch': { en: 'The pitch is too coarse for this diameter.', is: 'Stigningin er of gróf fyrir þetta nafnmál.' },

  // --- wires -----------------------------------------------------------------------
  'wire.title': { en: 'Wires', is: 'Vírar' },
  'wire.hint': {
    en: 'Measure the wires you have and type their diameter. The reading over the wires depends on it.',
    is: 'Mældu vírana sem þú átt og sláðu inn þvermál þeirra. Málið yfir vírana fer eftir því.',
  },
  'wire.label': { en: 'Your wire diameter', is: 'Þvermál þinna víra' },
  'wire.best': { en: 'Best size', is: 'Besta stærð' },
  'wire.min': { en: 'Smallest', is: 'Minnsta' },
  'wire.max': { en: 'Largest', is: 'Stærsta' },
  'wire.enter': {
    en: 'Any wire between the smallest and the largest works. Measure yours with a micrometer rather than trusting the label.',
    is: 'Allir vírar á milli minnstu og stærstu stærðar virka. Mældu þína víra með míkrómæli frekar en að treysta merkingunni.',
  },
  'wire.okBest': { en: 'Close to the best size. Good.', is: 'Nálægt bestu stærð. Gott.' },
  'wire.small': {
    en: 'Too small: the wire would sit in the bottom of the groove instead of on the flanks.',
    is: 'Of grannur: vírinn myndi sitja í botni gengjunnar en ekki á flönkunum.',
  },
  'wire.large': {
    en: 'Too large: the wire would ride on the crests instead of on the flanks.',
    is: 'Of sver: vírinn myndi liggja á toppunum en ekki á flönkunum.',
  },
  'wire.offBest': {
    en: 'Within the usable range. Away from the best size the reading is more sensitive to errors in the flank angle.',
    is: 'Innan nothæfs sviðs. Fjær bestu stærð er mælingin viðkvæmari fyrir skekkju í flankahorni.',
  },

  // --- results ---------------------------------------------------------------------
  'res.title': { en: 'Over the wires', is: 'Mál yfir víra' },
  'res.unit': { en: 'Show in', is: 'Sýna í' },
  'res.max': { en: 'Largest', is: 'Stærsta leyfilega' },
  'res.mid': { en: 'Target, middle of tolerance', is: 'Markmál, miðja málviks' },
  'res.min': { en: 'Smallest', is: 'Minnsta leyfilega' },
  'res.band': { en: 'Tolerance band {value}', is: 'Málvik {value}' },
  'res.pd': { en: 'Pitch diameter', is: 'Stigningarþvermál' },
  'res.basic': { en: 'Basic d2', is: 'Grunnmál d2' },
  'res.es': { en: 'Upper deviation es', is: 'Efra frávik es' },
  'res.ei': { en: 'Lower deviation ei', is: 'Neðra frávik ei' },
  'res.td2': { en: 'Tolerance Td2', is: 'Málvik Td2' },
  'res.d2max': { en: 'd2 max', is: 'd2 mest' },
  'res.d2min': { en: 'd2 min', is: 'd2 minnst' },
  'res.lead': { en: 'Lead angle {value}°', is: 'Stigningarhorn {value}°' },
  'res.leadHigh': {
    en: 'Lead angle {value}°. The simple formulas leave the lead angle out, which is fine up to about 5°. Above that the thread reads slightly large.',
    is: 'Stigningarhorn {value}°. Einföldu formúlurnar sleppa stigningarhorninu, sem er í lagi upp að um 5°. Þar fyrir ofan mælist gengjan örlítið of stór.',
  },
  'res.needWire': {
    en: 'Type the diameter of your wires to see what to read over them.',
    is: 'Sláðu inn þvermál víranna þinna til að sjá málið yfir þá.',
  },
  'res.none': { en: 'No result yet.', is: 'Engin niðurstaða enn.' },

  // --- checking a measurement ------------------------------------------------------------
  'check.title': { en: 'Check a measurement', is: 'Athuga mælingu' },
  'check.label': { en: 'Measured over wires', is: 'Mælt yfir víra' },
  'check.hint': { en: 'Type what the micrometer reads.', is: 'Sláðu inn það sem míkrómælirinn sýnir.' },
  'check.in': { en: 'In tolerance', is: 'Innan málviks' },
  'check.large': { en: 'Too large', is: 'Of stór' },
  'check.small': { en: 'Too small', is: 'Of lítil' },
  'check.pd': { en: 'Pitch diameter {value}', is: 'Stigningarþvermál {value}' },
  'check.inAbove': { en: '{value} above the middle of the tolerance.', is: '{value} yfir miðju málviks.' },
  'check.inBelow': { en: '{value} below the middle of the tolerance.', is: '{value} undir miðju málviks.' },
  'check.inMid': { en: 'Right in the middle of the tolerance.', is: 'Beint í miðju málviks.' },
  'check.largeBy': {
    en: '{over} over the largest. Take off at least {over} on the pitch diameter, or {mid} to reach the middle.',
    is: '{over} yfir stærsta máli. Taka þarf a.m.k. {over} af stigningarþvermálinu, eða {mid} til að ná miðju.',
  },
  'check.smallBy': { en: '{over} under the smallest.', is: '{over} undir minnsta máli.' },

  // --- foot --------------------------------------------------------------------------
  'foot.sources': { en: 'ISO 965-1 · ASME B1.1', is: 'ISO 965-1 · ASME B1.1' },
  'foot.disclaimer': {
    en: 'No responsibility is taken for these calculations. See About.',
    is: 'Engin ábyrgð er tekin á þessum útreikningum. Sjá Um forritið.',
  },
};
