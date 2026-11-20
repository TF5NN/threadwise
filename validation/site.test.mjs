// The page itself: every file it loads carries the "?v=dev" version stamp that publishing
// replaces with the commit id, so nobody is left with old cached files after an update.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const map = JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;

test('every module main.js can load is in the import map, with the stamp', () => {
  const dir = (d) => readdirSync(new URL(`../${d}/`, import.meta.url)).filter((f) => f.endsWith('.js')).map((f) => `${d}/${f}`);
  const modules = [...dir('js'), ...dir('js/data')].filter((f) => !['js/lang.js', 'js/theme.js', 'js/main.js'].includes(f));
  for (const m of modules) assert.equal(map[`./${m}`], `./${m}?v=dev`, `${m} missing from the import map`);
  assert.equal(Object.keys(map).length, modules.length, 'import map lists a file that does not exist');
});

test('the stylesheet and scripts in the page carry the stamp', () => {
  for (const src of ['css/style.css', 'js/lang.js', 'js/theme.js', 'js/main.js'])
    assert.ok(html.includes(`"${src}?v=dev"`), `${src} has no version stamp`);
  // The import map must come before the module script, or browsers ignore it.
  assert.ok(html.indexOf('type="importmap"') < html.indexOf('type="module"'));
});
