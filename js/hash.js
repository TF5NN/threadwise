// Everything typed is kept in the address after #, so a bookmark or shared link opens the
// same tab with the same thread. Each tab registers its own settings under a prefix.
const parts = [];
// Writing waits until every tab has registered, or the first tab to draw would drop the
// settings of the others from a shared link.
let ready = false;
export const start = () => { ready = true; write(); };

/** Register a tab's state object and its defaults; fills the state from the address. */
export function register(prefix, state, defaults) {
  parts.push({ prefix, state, defaults });
  read(prefix);
}

/** (Re)read one tab's state from the address. */
export function read(prefix) {
  const params = new URLSearchParams(location.hash.slice(1));
  for (const p of parts.filter((x) => x.prefix === prefix)) {
    Object.assign(p.state, p.defaults);
    for (const key of Object.keys(p.defaults)) if (params.has(prefix + key)) p.state[key] = params.get(prefix + key);
  }
}

/** Write every tab's non-default values to the address, without adding a history entry. */
export function write() {
  if (!ready) return;
  const params = new URLSearchParams();
  for (const { prefix, state, defaults } of parts)
    for (const [k, v] of Object.entries(state)) if (v !== defaults[k] && v !== '' && v !== undefined) params.set(prefix + k, v);
  const text = params.toString();
  history.replaceState(history.state, '', location.pathname + location.search + (text ? '#' + text : ''));
}
