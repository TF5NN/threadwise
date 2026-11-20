// Number formatting and reading, shared by the three tabs.
import { lang } from './i18n.js';

export const MM_PER_INCH = 25.4;
const MINUS = '−';

/** A number with a fixed number of decimals, in the language's own way (comma in Icelandic). */
export function num(x, decimals, signed = false) {
  if (!Number.isFinite(x)) return '–';
  let s = Math.abs(x).toFixed(decimals);
  const mark = lang() === 'is' ? ',' : '.';
  if (Number(s) === 0) return (signed ? '±' : '') + s.replace('.', mark);
  s = s.replace('.', mark);
  return (x < 0 ? MINUS : signed ? '+' : '') + s;
}

export const DECIMALS = { mm: 3, in: 4 };

/** A length (given in mm) in a unit, with the unit after it. */
export const len = (mm, unit, signed = false) =>
  `${num(unit === 'in' ? mm / MM_PER_INCH : mm, DECIMALS[unit], signed)} ${unit}`;

export const other = (unit) => (unit === 'mm' ? 'in' : 'mm');

/** A typed value in a unit, in mm. */
export const toMm = (value, unit) => (unit === 'in' ? value * MM_PER_INCH : value);

/** A plain typed number shown with the language's decimal mark ("1.5" → "1,5" in Icelandic). */
export const local = (text) =>
  /^[-+]?\d*[.,]\d+$/.test(String(text).trim()) ? String(text).trim().replace(/[.,]/, lang() === 'is' ? ',' : '.') : text;

/** A pitch both ways: "1.500 mm · 16.93 TPI". */
export function pitchBoth(pitchMm) {
  const tpi = MM_PER_INCH / pitchMm;
  const tpiText = Math.abs(tpi - Math.round(tpi * 2) / 2) < 0.01 ? num(Math.round(tpi * 2) / 2, tpi % 1 ? 1 : 0) : num(tpi, 2);
  return `${num(pitchMm, 3)} mm · ${tpiText} TPI`;
}

/** Fill a <select> with options [value, label] and optional groups { label, options }. */
export function fillSelect(select, items) {
  select.replaceChildren();
  for (const item of items) {
    if (item.options) {
      const g = document.createElement('optgroup');
      g.label = item.label;
      for (const [v, l] of item.options) g.append(new Option(l, v));
      select.append(g);
    } else select.append(new Option(item[1], item[0]));
  }
}

/** Mark a segmented control's chosen button. */
export function setSeg(el, value) {
  for (const b of el.querySelectorAll('button[data-value]')) {
    const on = b.dataset.value === value;
    b.setAttribute('aria-checked', String(on));
    b.tabIndex = on ? 0 : -1;
  }
}

/** Wire a segmented control: click and arrow keys. `onPick(value)` is called on a change. */
export function wireSeg(el, get, onPick) {
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-value]');
    if (b && b.dataset.value !== get()) onPick(b.dataset.value);
  });
  el.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    const buttons = [...el.querySelectorAll('button[data-value]')];
    const i = buttons.findIndex((b) => b.dataset.value === get());
    const next = buttons[(i + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? buttons.length - 1 : 1)) % buttons.length];
    onPick(next.dataset.value);
    next.focus();
    e.preventDefault();
  });
}
