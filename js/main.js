// Starts the page: the three tabs, the About box, and redraws on a language change.
import * as measure from './measure.js';
import * as make from './make.js';
import * as find from './find.js';
import * as hash from './hash.js';

const TABS = ['measure', 'make', 'find'];
const nav = { tab: 'measure' };
hash.register('', nav, { tab: 'measure' });

function show(tab) {
  if (!TABS.includes(tab)) tab = 'measure';
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

const about = document.getElementById('about');
document.getElementById('about-open').addEventListener('click', () => about.showModal());
document.getElementById('about-close').addEventListener('click', () => about.close());
about.addEventListener('click', (e) => {
  if (e.target === about) about.close();
});
