// English and Icelandic. The words themselves are in js/strings.js; this file
// picks them out, puts them on the page, and runs the EN / IS switch.
//
// js/lang.js has already chosen the language (it sets <html lang="...">) before
// the page was painted. Pages mark their fixed text like this:
//   data-i18n="key"             the element's text
//   data-i18n-attr="title:key"  an attribute (several: "title:key1;aria-label:key2")
//   data-only="en" / "is"       a whole block written out in one language; the
//                               other language's block is hidden (css/style.css)
// Text that the script writes (messages, results) asks for its words with t().
//
// No page elements are needed to use t(), so the maths modules and their checks
// can use it too; without a page it always gives English.

import { STRINGS } from './strings.js';

const KEY = 'tf5nn-lang';
export const LANGUAGES = ['en', 'is'];

const page = typeof document !== 'undefined' ? document : null;
let current = page && LANGUAGES.includes(page.documentElement.lang) ? page.documentElement.lang : 'en';

/** The language in use: 'en' or 'is'. */
export const lang = () => current;

/** Is there a wording for this key? */
export const has = (key) => Object.prototype.hasOwnProperty.call(STRINGS, key);

/**
 * The words for `key` in the language in use, with {name} filled in from `values`.
 * @param {string} key
 * @param {Record<string, string | number>} [values]
 */
export function t(key, values = {}) {
  const entry = STRINGS[key];
  if (!entry) {
    if (page) console.warn('No wording for', key);
    return key;
  }
  const text = entry[current] ?? entry.en;
  return text.replace(/\{(\w+)\}/g, (whole, name) => (name in values ? String(values[name]) : whole));
}

/** The wording for `key` if there is one, otherwise `fallback` (for list entries named in other files). */
export const named = (key, fallback) => (has(key) ? t(key) : fallback);

/** A whole number as the language writes it: "12,345" in English, "12 345" in Icelandic. */
export const count = (n) => (current === 'is' ? Math.round(n).toLocaleString('en').replace(/,/g, ' ') : n.toLocaleString('en'));

/** Put the words for the language in use on every marked element under `root`. */
export function translatePage(root = page) {
  if (!root) return;
  for (const node of root.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
  for (const node of root.querySelectorAll('[data-i18n-attr]')) {
    for (const pair of node.dataset.i18nAttr.split(';')) {
      const [attribute, key] = pair.split(':').map((part) => part.trim());
      if (attribute && key) node.setAttribute(attribute, t(key));
    }
  }
  for (const button of root.querySelectorAll('.lang-switch [data-lang]')) {
    button.setAttribute('aria-pressed', String(button.dataset.lang === current));
  }
}

/** Switch language: remember the choice, change the fixed text, and tell the rest of the page. */
export function setLang(wanted) {
  if (!LANGUAGES.includes(wanted) || wanted === current) return;
  current = wanted;
  try {
    localStorage.setItem(KEY, wanted);
  } catch (error) {
    /* Private browsing: nothing to remember with. */
  }
  page.documentElement.lang = wanted;
  translatePage();
  // Text the script wrote (messages, results, the chart) listens for this and is written again.
  page.dispatchEvent(new CustomEvent('langchange', { detail: wanted }));
}

if (page) {
  translatePage();
  page.documentElement.classList.add('i18n-ready');
  for (const button of page.querySelectorAll('.lang-switch [data-lang]')) {
    button.addEventListener('click', () => setLang(button.dataset.lang));
  }
}
