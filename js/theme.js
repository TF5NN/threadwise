// Light and dark, for every page of the app. Loaded in the <head> as an
// ordinary script so the theme is in place before the page is first painted.
//
// The page follows the device's setting until the visitor presses the sun or
// moon button in the header; from then on their choice is remembered in this
// browser and wins. The choice is kept under one name for every TF5NN app on
// this site (Northbound uses the same), so it carries from one to the next.
(function () {
  var KEY = 'tf5nn-theme';
  var device = window.matchMedia('(prefers-color-scheme: dark)');
  var WORDS = {
    en: { toDark: 'Switch to the dark theme', toLight: 'Switch to the light theme' },
    is: { toDark: 'Skipta yfir í dökkt útlit', toLight: 'Skipta yfir í ljóst útlit' },
  };

  function chosen() {
    try {
      var value = localStorage.getItem(KEY);
      return value === 'light' || value === 'dark' ? value : null;
    } catch (error) {
      return null;
    }
  }
  function current() {
    return chosen() || (device.matches ? 'dark' : 'light');
  }
  function apply() {
    var theme = current();
    var changed = document.documentElement.dataset.theme !== theme;
    document.documentElement.dataset.theme = theme;
    // The colour a phone's browser gives its own bars around the page.
    var bar = document.querySelector('meta[name="theme-color"]');
    if (bar) bar.setAttribute('content', theme === 'dark' ? '#0f1917' : '#214e3a');
    // The button's label, in the page's language (js/lang.js sets it).
    var words = WORDS[document.documentElement.lang] || WORDS.en;
    var label = theme === 'dark' ? words.toLight : words.toDark;
    document.querySelectorAll('.theme-toggle').forEach(function (button) {
      button.setAttribute('aria-label', label);
      button.title = label;
    });
    // Drawings that take their colours in script (the chart) listen for this and redraw.
    if (changed) document.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
  }

  apply();
  device.addEventListener('change', apply);
  document.addEventListener('langchange', apply);
  document.addEventListener('DOMContentLoaded', function () {
    apply();
    document.querySelectorAll('.theme-toggle').forEach(function (button) {
      button.addEventListener('click', function () {
        try {
          localStorage.setItem(KEY, current() === 'dark' ? 'light' : 'dark');
        } catch (error) {
          /* Private browsing: nothing to remember with. */
        }
        apply();
      });
    });
  });
})();
