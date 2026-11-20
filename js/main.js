// Starts the page: the three tabs, the About box, and redraws on a language change.
// The tabs follow the workshop: Find what it is, Make it, Measure it. A Find result opens in
// Make, and Make can hand its thread to Measure; each tab still works on its own.
import * as measure from './measure.js';
import * as make from './make.js';
import * as find from './find.js';
import * as hash from './hash.js';

const TABS = ['find', 'make', 'measure'];
const nav = { tab: 'find' };
hash.register('', nav, { tab: 'find' });

function show(tab) {
  if (!TABS.includes(tab)) tab = 'find';
  nav.tab = tab;
  for (const name of TABS) {
    const on = name === tab;
    document.getElementById('tab-' + name).hidden = !on;
    const b = document.querySelector(`.tabs [data-tab="${name}"]`);
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
  }
  hash.write();
}

measure.init();
make.init();
find.init();
// Links made before Find was the first tab: Measure was the default then, so its settings
// were written without "tab=". If such a link has Measure settings and no tab, open Measure.
// (Checked after the tabs have read the address, as reading resets the tab to the default.)
{
  const params = new URLSearchParams(location.hash.slice(1));
  if (!params.has('tab') && [...params.keys()].some((k) => !k.startsWith('k.') && !k.startsWith('f.'))) nav.tab = 'measure';
}
hash.start();
show(nav.tab);

const tabBar = document.querySelector('.tabs');
tabBar.addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]');
  if (b) show(b.dataset.tab);
});
tabBar.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  const i = TABS.indexOf(nav.tab);
  const next = TABS[(i + (e.key === 'ArrowLeft' ? TABS.length - 1 : 1)) % TABS.length];
  show(next);
  document.querySelector(`.tabs [data-tab="${next}"]`).focus();
});

document.addEventListener('langchange', () => {
  measure.refresh();
  make.refresh();
  find.refresh();
});
window.addEventListener('hashchange', () => {
  hash.read('');
  measure.reread();
  make.reread();
  find.reread();
  show(nav.tab);
});

// One tab handing a thread to the next (Find → Make → Measure). The tabs send a "goto"
// event instead of importing each other, so each stays usable on its own.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
document.addEventListener('goto', (e) => {
  const { tab, ...thread } = e.detail;
  if (tab === 'make') make.load(thread);
  if (tab === 'measure') measure.load(thread);
  show(tab);
  window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  // A short glow on the first panel shows where the thread landed.
  const panel = document.querySelector(`#tab-${tab} .panel`);
  panel.classList.remove('arrived');
  void panel.offsetWidth; // restart the animation if it is already running
  panel.classList.add('arrived');
  const heading = panel.querySelector('h2');
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
});

const about = document.getElementById('about');
document.getElementById('about-open').addEventListener('click', () => about.showModal());
document.getElementById('about-close').addEventListener('click', () => about.close());
about.addEventListener('click', (e) => {
  if (e.target === about) about.close();
});
