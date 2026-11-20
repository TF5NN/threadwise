// Which language to show, decided in the <head> before the page is first painted,
// the same way js/theme.js decides light or dark. It only sets <html lang="...">;
// js/i18n.js then puts the words in place and runs the EN / IS switch.
//
// In order of preference:
//   1. ?lang=is or ?lang=en in the address. The TF5NN main site adds this to its
//      links, so the app opens in the language the visitor was reading the site in.
//      It is then remembered, and taken out of the address so a shared link does
//      not force a language on whoever opens it.
//   2. The visitor's own choice from the EN / IS switch, remembered in this browser.
//      It is kept under one name for every TF5NN page on this site, like the theme.
//   3. Icelandic if the browser is set to Icelandic, otherwise English.
(function () {
  var KEY = 'tf5nn-lang';
  var known = function (value) {
    return value === 'en' || value === 'is' ? value : null;
  };
  var lang = null;

  var params = new URLSearchParams(location.search);
  var asked = known(params.get('lang'));
  if (asked) {
    lang = asked;
    try {
      localStorage.setItem(KEY, asked);
      params.delete('lang');
      var rest = params.toString();
      history.replaceState(history.state, '', location.pathname + (rest ? '?' + rest : '') + location.hash);
    } catch (error) {
      /* Nothing to remember with: leave it in the address so it still works on reload. */
    }
  }
  if (!lang) {
    try {
      lang = known(localStorage.getItem(KEY));
    } catch (error) {
      lang = null;
    }
  }
  if (!lang) {
    var wanted = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
    lang = /^is\b/i.test(wanted[0] || '') ? 'is' : 'en';
  }
  document.documentElement.lang = lang;
})();
