// Frequent Clean. © 2026 Daniel Ilias Houlis. All rights reserved. Frequent is a trademark of Daniel Ilias Houlis.
// Score what leaves the house, not effort. Every item out counts the same, whether it was donated, trashed,
// recycled, returned or sold, so money never becomes the reason things stay. Resale happens on a small shelf
// that grows only as you finish items, and anything unsold after 14 days is donated and still counts.
// Everything lives in this browser (localStorage "fcl"). Updates only add to it; nothing is ever wiped.
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const h = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
};
const ymd = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 864e5);
const addDays = (d, n) => { const x = new Date(d + 'T12:00'); x.setDate(x.getDate() + n); return ymd(x); };
const niceDay = d => { const t = ymd(); if (d === t) return 'Today'; if (d === addDays(t, -1)) return 'Yesterday'; return new Date(d + 'T12:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const money = n => '$' + (Math.round(n * 100) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 });

// ---------- Rules ----------
const ROUTES = {
  donate: ['Donate', 'Bag or box for donation', 'var(--green)'],
  trash: ['Trash', 'Broken, stained, expired', 'var(--muted)'],
  recycle: ['Recycle', 'Paper, cans, e-waste', 'var(--blue)'],
  ret: ['Return to owner', 'Not yours to decide', 'var(--yellow)'],
  sold: ['Sold', 'From the resale shelf', 'var(--red)']
};
const OUT_PTS = 10, ZONE_PTS = 20;
// The resale ladder: each scary step gets its own points; the scarier, the more.
const STEPS = [
  ['photo', 'Take a photo', 5], ['price', 'Look up what it actually sold for', 5], ['draft', 'Write the listing (don’t post yet)', 10],
  ['post', 'Post it', 25], ['reply', 'Answer one buyer message', 15]
];
const SHELF_START = 3, SHELF_MAX = 10, TIMER = 14, EXTEND = 7;
const DEFAULT_ZONES = ['Bedroom floor', 'Closet', 'Audio studio desk', 'Sound panel project', 'Return-to-owner box'];

// ---------- State ----------
const KEY = 'fcl';
const blank = () => ({ v: 1, out: [], shelf: [], steps: [], zones: DEFAULT_ZONES.map((n, i) => ({ id: 'z' + i, n, done: '' })), feel: {} });
let S = blank();
try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && typeof s === 'object') S = Object.assign(blank(), s); } catch (e) { /* keep old text untouched */ }
let saveT; const save = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Could not save in this browser. Save a backup file from the menu.'); } }, 100); };

// ---------- Derived ----------
const finishedFromShelf = () => S.out.filter(o => o.shelf).length;
const pullBack = () => { const t = ymd(); const f = Object.entries(S.feel).filter(([d]) => daysBetween(d, t) < 7).map(([, v]) => v); return f.length >= 3 && f.reduce((a, b) => a + b, 0) / f.length < 1.8; };
// The shelf earns a slot for every two items you finish from it (sold or donated). It does not grow while the feel check is low.
const cap = () => { const c = Math.min(SHELF_MAX, SHELF_START + Math.floor(finishedFromShelf() / 2)); if (!pullBack()) { if (S.capHold !== c) { S.capHold = c; save(); } return c; } return Math.min(c, S.capHold ?? c); };
const ptsByDay = () => { const m = {}; const add = (d, n) => m[d] = (m[d] || 0) + n;
  for (const o of S.out) add(o.d, OUT_PTS * (o.q || 1)); for (const s of S.steps) add(s.d, s.p); for (const z of S.zones) if (z.done) add(z.done, ZONE_PTS); return m; };
const moScore = () => { const t = ymd(); let s = 0; for (const [d, n] of Object.entries(ptsByDay())) { const ago = daysBetween(d, t); if (ago >= 0) s += n * Math.pow(6 / 7, ago); } return Math.round(s); };
const outByDay = () => { const m = {}; for (const o of S.out) m[o.d] = (m[o.d] || 0) + (o.q || 1); return m; };
const weekOut = () => { const t = ymd(); return S.out.filter(o => daysBetween(o.d, t) < 7).reduce((a, o) => a + (o.q || 1), 0); };
const paintMo = bump => { $('#moN').textContent = weekOut(); if (bump) { const m = $('#mo'); m.classList.remove('bump'); void m.offsetWidth; m.classList.add('bump'); } };
const daysLeft = it => TIMER + (it.ext ? EXTEND : 0) - daysBetween(it.added, ymd());

// ---------- Toast and sheet ----------
let toastT;
function toast(t, undo) {
  const el = $('#toast'); $('#toastT').textContent = t; const u = $('#toastU');
  u.hidden = !undo; u.onclick = () => { undo && undo(); el.classList.remove('on'); };
  el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), undo ? 6000 : 3000);
}
function sheet(...kids) {
  const wrap = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', onclick: e => { if (e.target === wrap) close(); } }, h('div', {}, ...kids));
  const close = () => { wrap.remove(); document.removeEventListener('keydown', esc); };
  const esc = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', esc); document.body.append(wrap); const f = wrap.querySelector('input'); if (f) setTimeout(() => f.focus(), 50); return close;
}
const sheetHead = (title, close) => h('div', { class: 'sh-h' }, h('h2', { text: title }), h('button', { class: 'close', 'aria-label': 'Close', text: '×', onclick: () => close() }));
function stepper(label, val, min, max) {
  const inp = h('input', { type: 'number', inputmode: 'numeric', value: val, min, max, 'aria-label': label });
  const set = d => { inp.value = Math.max(min, Math.min(max, (+inp.value || 0) + d)); };
  return { el: h('div', { class: 'stepper' }, h('div', { class: 't', text: label }), h('div', { class: 'c' }, inp, h('button', { 'aria-label': 'Less', text: '−', onclick: () => set(-1) }), h('button', { 'aria-label': 'More', text: '+', onclick: () => set(1) }))), get: () => Math.max(min, Math.min(max, Math.round(+inp.value || min))) };
}

// ---------- Actions ----------
function addOut(o) {
  const e = Object.assign({ id: uid(), d: ymd(), t: Date.now(), q: 1 }, o); S.out.push(e); save(); paintMo(true); return e;
}
function outSheet(route) {
  const [label, cue] = ROUTES[route];
  const name = h('input', { class: 'inp', placeholder: route === 'ret' ? 'What, and whose? (optional) e.g. Mom’s sewing box' : 'What is it? (optional) e.g. bag of old shirts' });
  const qty = stepper('How many items', 1, 1, 50);
  let zone = '';
  const zones = h('div', { class: 'chips' }, ...S.zones.map(z => h('button', { class: 'chip', text: z.n, onclick: e => { zone = zone === z.n ? '' : z.n; [...e.target.parentNode.children].forEach(c => c.classList.toggle('on', c.textContent === zone)); } })));
  const close = sheet(sheetHead(label, () => close()), h('p', { class: 'sh-cue', text: route === 'ret' ? 'It counts once it is handed back or left where they keep it. What happens next is their call.' : 'It counts once it is physically out: in the bin, in the car or dropped off.' }),
    h('p', { class: 'lab', text: 'What' }), name, h('div', { class: 'steps', style: 'margin-top:12px' }, qty.el), h('p', { class: 'lab', text: 'From which zone (optional)' }), zones,
    h('div', { class: 'preview', text: `+${OUT_PTS} momentum per item` }),
    h('button', { class: 'btn go wide', text: 'It’s out the door', onclick: () => {
      const e = addOut({ r: route, n: name.value.trim(), q: qty.get(), z: zone }); close(); render();
      toast(`${e.q} out the door.`, () => { S.out = S.out.filter(x => x.id !== e.id); save(); paintMo(); render(); });
    } }));
}
function zoneSheet(z) {
  const close = sheet(sheetHead(z.n, () => close()), h('p', { class: 'sh-cue', text: 'A zone counts as clear when the floor or surface is clear, and someone you live with agrees it’s done. Their check is the finish line.' }),
    h('div', { class: 'preview', text: `+${ZONE_PTS} momentum` }),
    h('button', { class: 'btn green wide', text: 'Clear, and they agree', onclick: () => { z.done = ymd(); save(); paintMo(true); close(); render(); toast(`${z.n} is clear.`, () => { z.done = ''; save(); paintMo(); render(); }); } }),
    h('div', { class: 'row', style: 'margin-top:10px;justify-content:space-between' },
      h('button', { class: 'btn ghost', text: 'Remove this zone', onclick: () => { const i = S.zones.indexOf(z); S.zones.splice(i, 1); save(); close(); render(); toast('Zone removed.', () => { S.zones.splice(i, 0, z); save(); render(); }); } })));
}
function addZone() {
  const name = h('input', { class: 'inp', placeholder: 'e.g. Under the bed, garage shelf, car trunk' });
  const close = sheet(sheetHead('Add a zone', () => close()), h('p', { class: 'sh-cue', text: 'Small and specific works best: one shelf, not the whole garage.' }), name,
    h('button', { class: 'btn go wide', style: 'margin-top:14px', text: 'Add zone', onclick: () => { const n = name.value.trim(); if (!n) return; S.zones.push({ id: uid(), n, done: '' }); save(); close(); render(); } }));
}
function addShelf() {
  if (S.shelf.length >= cap()) { toast('The shelf is full. Finish one first; donating counts too.'); return; }
  const name = h('input', { class: 'inp', placeholder: 'e.g. Nerf blasters, as one bundle' });
  const close = sheet(sheetHead('Put something on the shelf', () => close()),
    h('p', { class: 'sh-cue', text: `Bundle similar things into one listing: one hard step instead of twenty. It gets ${TIMER} days; if it hasn’t sold by then, it gets donated and still counts.` }),
    name, h('button', { class: 'btn go wide', style: 'margin-top:14px', text: 'Put it on the shelf', onclick: () => { const n = name.value.trim(); if (!n) return; S.shelf.push({ id: uid(), n, added: ymd(), done: {}, ext: false }); save(); close(); render(); } }));
}
function doStep(it, key) {
  const st = STEPS.find(s => s[0] === key);
  it.done[key] = ymd(); const rec = { id: uid(), d: ymd(), t: Date.now(), k: key, item: it.id, n: it.n, p: st[2] }; S.steps.push(rec); save(); paintMo(true); render();
  toast(`${st[1].replace(/ \(.*\)/, '')}: +${st[2]}`, () => { delete it.done[key]; S.steps = S.steps.filter(x => x.id !== rec.id); save(); paintMo(); render(); });
}
function finishShelf(it, route, amt) {
  S.shelf = S.shelf.filter(x => x !== it);
  const e = addOut({ r: route, n: it.n, q: 1, amt: route === 'sold' ? amt : 0, shelf: it.id, it }); render();
  toast(route === 'sold' ? `Sold for ${money(amt)}. Out the door.` : 'Donated. Out the door, and a slot is free.', () => { S.out = S.out.filter(x => x.id !== e.id); S.shelf.push(it); save(); paintMo(); render(); });
}
function soldSheet(it) {
  const amt = h('input', { class: 'inp', type: 'number', min: '0', step: '1', inputmode: 'decimal', placeholder: 'How much did you get?' });
  const close = sheet(sheetHead('Sold and handed off', () => close()), h('p', { class: 'sh-cue', text: it.n }), amt,
    h('div', { class: 'preview', text: `+${OUT_PTS} momentum, same as any item out` }),
    h('button', { class: 'btn green wide', text: 'Out the door', onclick: () => { close(); finishShelf(it, 'sold', Math.max(0, +amt.value || 0)); } }));
}

// ---------- Views ----------
const main = $('#main');
const show = (...kids) => main.replaceChildren(...kids.flat().filter(k => k != null && k !== false));
function spark() {
  const t = ymd(), od = outByDay(), vals = []; for (let i = 13; i >= 0; i--) vals.push([addDays(t, -i), od[addDays(t, -i)] || 0]);
  const max = Math.max(5, ...vals.map(v => v[1]));
  return h('div', { class: 'spark', 'aria-label': 'Items out, last 14 days' }, vals.map(([d, n]) => h('i', { class: (n ? 'has ' : '') + (d === t ? 'today' : ''), style: `height:${Math.max(6, n / max * 100)}%`, title: `${niceDay(d)}: ${n}` })));
}
function pullCard() {
  return h('section', { class: 'pull' }, h('b', { text: 'This week, go easy' }), 'Recent rounds have felt draining. Selling is optional: donate freely, and the shelf will stay its current size until rounds feel okay again.');
}
function today() {
  const t = ymd(); const all = S.out.reduce((a, o) => a + (o.q || 1), 0); const zonesDone = S.zones.filter(z => z.done).length;
  const mom = h('section', { class: 'mom' }, h('div', {}, h('div', { class: 'big', text: weekOut() }), h('div', { class: 'lbl', text: 'items out this week' })), spark(),
    h('div', { class: 'facts' }, h('span', {}, 'Momentum ', h('b', { text: moScore() })), h('span', {}, 'All time ', h('b', { text: all })), h('span', {}, 'Zones clear ', h('b', { text: `${zonesDone}/${S.zones.length}` })), h('span', {}, 'Shelf ', h('b', { text: `${S.shelf.length}/${cap()}` }))));
  const todays = S.out.filter(o => o.d === t), stepsToday = S.steps.filter(s => s.d === t);
  const r1 = todays.some(o => ['donate', 'trash', 'recycle'].includes(o.r)), r2 = stepsToday.length > 0 || todays.some(o => o.r === 'sold'), r3 = todays.some(o => o.r === 'ret');
  const li = (ok, txt) => h('li', { class: ok ? 'ok' : '' }, h('i', { text: ok ? '✓' : '' }), h('span', { text: txt }));
  const round = h('section', { class: 'round' }, h('p', { class: 'k', text: 'Tonight’s 15-minute round' }),
    h('ul', {}, li(r1, 'One bag out: donate, trash or recycle'), li(r2, 'One step on a resale item'), li(r3, 'One thing back to its owner')),
    r1 && r2 && r3 ? h('p', { class: 'hint', style: 'margin:8px 0 0', text: 'Round done. Anything more today is a bonus, not a debt.' }) : null);
  const outs = h('div', { class: 'outs' }, ...['donate', 'trash', 'recycle', 'ret'].map(k => h('button', { class: 'outb', style: `--c:${ROUTES[k][2]}`, onclick: () => outSheet(k) }, h('b', { text: ROUTES[k][0] }), h('span', { text: ROUTES[k][1] }))));
  const feelBox = (todays.length || stepsToday.length) && !S.feel[t] ? h('section', { class: 'feelc' }, h('p', { text: 'How did today’s round feel?' }),
    h('div', { class: 'chips feel' }, ...[[1, 'Draining'], [2, 'Okay'], [3, 'Good']].map(([v, l]) => h('button', { class: 'chip', text: l, onclick: () => { S.feel[t] = v; save(); render(); toast('Thanks. That shapes how fast the shelf grows.'); } })))) : null;
  const zones = h('div', { class: 'list' }, S.zones.length ? S.zones.map(z => h('div', { class: 'zone' + (z.done ? ' done' : '') }, h('span', { class: 'dot' + (z.done ? ' reg' : '') }),
    h('div', { class: 'what' }, h('b', { text: z.n }), h('small', { text: z.done ? `Clear since ${niceDay(z.done).toLowerCase()}` : 'Not yet' })),
    z.done ? h('button', { class: 'btn ghost', text: 'Reopen', onclick: () => { const d = z.done; z.done = ''; save(); paintMo(); render(); toast('Reopened.', () => { z.done = d; save(); paintMo(); render(); }); } }) : h('button', { class: 'plus newb', text: 'Clear', onclick: () => zoneSheet(z) }))) : h('div', { class: 'zone' }, h('div', { class: 'what' }, h('small', { text: 'No zones yet.' }))));
  const recent = S.out.filter(o => o.d === t).slice().reverse();
  show(h('h1', { text: 'Out the door' }), h('p', { class: 'sub', text: 'Every item that leaves counts the same, however it leaves.' }),
    pullBack() ? pullCard() : null, mom, round, feelBox, h('h2', { text: 'Log what left' }), outs,
    h('h2', { text: 'Zones' }), zones, h('button', { class: 'btn ghost', style: 'margin-top:6px', text: '+ Add a zone', onclick: addZone }),
    recent.length ? [h('h2', { text: 'Today' }), entryList(recent)] : null, foot());
}
function resale() {
  const c = cap(); const t = ymd();
  const sold = S.out.filter(o => o.r === 'sold'); const month = t.slice(0, 7);
  const mMonth = sold.filter(o => o.d.startsWith(month)).reduce((a, o) => a + (o.amt || 0), 0), mAll = sold.reduce((a, o) => a + (o.amt || 0), 0);
  const toNext = 2 - (finishedFromShelf() % 2);
  const head = [h('h1', { text: 'The resale shelf' }), h('p', { class: 'sub', text: `A little at a time. ${S.shelf.length} of ${c} slots in use.` }),
    h('div', { class: 'slots', 'aria-hidden': 'true' }, Array.from({ length: c }, (_, i) => h('i', { class: i < S.shelf.length ? 'on' : '' }))),
    h('p', { class: 'hint', text: c >= SHELF_MAX ? 'The shelf is at its full size.' : pullBack() ? 'The shelf is holding its size while rounds feel draining.' : `Finish ${toNext} more item${toNext > 1 ? 's' : ''} from the shelf, sold or donated, to earn another slot.` })];
  const items = S.shelf.map(it => {
    const left = daysLeft(it); const next = STEPS.find(s => !it.done[s[0]]); const doneN = STEPS.filter(s => it.done[s[0]]).length;
    const ladder = h('div', { class: 'ladder', 'aria-label': `${doneN} of 6 steps` }, [...STEPS.map(s => h('i', { class: it.done[s[0]] ? 'on' : next && next[0] === s[0] ? 'next' : '' })), h('i', { class: !next ? 'next' : '' })]);
    const due = left <= 0;
    return h('section', { class: 'item' }, h('div', { class: 'ih' }, h('b', { text: it.n }), h('span', { class: 'left' + (due ? ' due' : ''), text: due ? 'Time’s up' : `${left} day${left > 1 ? 's' : ''} left` })), ladder,
      h('p', { class: 'nx', text: due ? 'It had its chance. Donate it today; it counts the same as a sale.' : next ? `Next: ${next[1]}` : 'Last step: hand it off and log the sale.' }),
      h('div', { class: 'row' },
        due ? h('button', { class: 'btn green', text: 'Donate it', onclick: () => finishShelf(it, 'donate', 0) }) : next ? h('button', { class: 'btn go', text: `Done (+${next[2]})`, onclick: () => doStep(it, next[0]) }) : h('button', { class: 'btn green', text: 'Sold and handed off', onclick: () => soldSheet(it) }),
        due && !it.ext ? h('button', { class: 'btn', text: `${EXTEND} more days, once`, onclick: () => { it.ext = true; save(); render(); } }) : null,
        !due ? h('button', { class: 'btn ghost', text: 'Donate instead', onclick: () => finishShelf(it, 'donate', 0) }) : null,
        !due && next && next[0] !== 'photo' && it.done.post ? h('button', { class: 'btn ghost', text: 'Sold already', onclick: () => soldSheet(it) }) : null));
  });
  const empty = !S.shelf.length ? h('div', { class: 'empty', text: 'Nothing on the shelf. Put one thing on it, or several similar things as one bundle.' }) : null;
  const add = h('button', { class: 'btn go wide', style: 'margin-top:12px', text: S.shelf.length >= c ? 'Shelf full: finish one first' : 'Put something on the shelf', disabled: S.shelf.length >= c ? true : null, onclick: addShelf });
  const cash = [h('h2', { text: 'Money from resale' }), h('div', { class: 'money' }, h('div', {}, h('b', { text: money(mMonth) }), h('span', { text: 'this month' })), h('div', {}, h('b', { text: money(mAll) }), h('span', { text: 'all time' })), h('div', {}, h('b', { text: sold.length }), h('span', { text: 'items sold' }))),
    h('p', { class: 'hint', text: 'Kept separate on purpose. Momentum counts what leaves, not what it sold for.' })];
  const tips = h('details', { class: 'more why' }, h('summary', { text: 'Selling tips and why the shelf works this way' }),
    h('p', { text: 'Price from sold listings, not asking prices: on eBay, filter by Sold items; on Facebook Marketplace, look for what disappears fast.' }),
    h('p', { text: 'Bundle similar things. Porch pickup or a busy public place for handoffs. Cash or the platform’s own payment, never a check.' }),
    h('p', { html: 'Why every item counts the same: expected, tangible rewards can crowd out the satisfaction of doing something for its own sake (<a href="https://pubmed.ncbi.nlm.nih.gov/10589297/" target="_blank" rel="noopener">meta-analysis of 128 experiments</a>). If only sales scored, the clearing itself would start to feel like a chore. Money stays visible here as information, not as the goal.' }),
    h('p', { text: 'Why the shelf is small and grows slowly: the 14-day timer and the slot limit keep selling from becoming the thing that keeps stuff in your room.' }));
  show(head, pullBack() ? pullCard() : null, items, empty, add, cash, tips, foot());
}
function entryList(list) {
  return h('div', { class: 'list' }, list.map(e => {
    const isStep = !!e.k; const isZone = e.zone;
    const what = isZone ? `${e.n} clear` : isStep ? `${STEPS.find(s => s[0] === e.k)[1].replace(/ \(.*\)/, '')}: ${e.n}` : `${ROUTES[e.r][0]}${e.n ? ' · ' + e.n : ''}`;
    const sub = isZone || isStep ? '' : [e.q > 1 ? `${e.q} items` : '', e.z, e.amt ? money(e.amt) : ''].filter(Boolean).join(' · ');
    const pts = isZone ? ZONE_PTS : isStep ? e.p : OUT_PTS * (e.q || 1);
    return h('div', { class: 'ent' }, h('div', { class: 'what' }, what, sub ? h('small', { text: sub }) : null), h('span', { class: 'pts', text: `+${pts}` }),
      isZone ? null : h('button', { class: 'x', 'aria-label': 'Delete', text: '×', onclick: () => {
        if (isStep) { S.steps = S.steps.filter(x => x.id !== e.id); const it = S.shelf.find(x => x.id === e.item); if (it) delete it.done[e.k]; }
        else { S.out = S.out.filter(x => x.id !== e.id); if (e.shelf && e.it && !S.shelf.some(x => x.id === e.shelf)) S.shelf.push(e.it); }
        save(); paintMo(); render();
        toast('Deleted.', () => { if (isStep) { S.steps.push(e); const it = S.shelf.find(x => x.id === e.item); if (it) it.done[e.k] = e.d; } else { S.out.push(e); if (e.shelf) S.shelf = S.shelf.filter(x => x.id !== e.shelf); } S.out.sort((a, b) => a.t - b.t); S.steps.sort((a, b) => a.t - b.t); save(); paintMo(); render(); });
      } }));
  }));
}
function history() {
  const rows = [...S.out, ...S.steps, ...S.zones.filter(z => z.done).map(z => ({ id: z.id, d: z.done, t: new Date(z.done + 'T23:59').getTime(), n: z.n, zone: true }))].sort((a, b) => b.t - a.t);
  const head = [h('h1', { text: 'History' }), h('p', { class: 'sub', text: 'Everything that left, and every brave step on the way.' })];
  if (!rows.length) return show(head, h('div', { class: 'empty', text: 'Nothing yet. Tonight’s round is three small things.' }), foot());
  const month = ymd().slice(0, 7); const by = {}; for (const o of S.out) if (o.d.startsWith(month)) by[o.r] = (by[o.r] || 0) + (o.q || 1);
  const max = Math.max(1, ...Object.values(by));
  const bars = Object.keys(by).length ? [h('h2', { text: 'This month, by where it went' }), h('div', { class: 'bars' }, Object.entries(ROUTES).filter(([k]) => by[k]).map(([k, [n]]) => h('div', {}, h('span', { text: n }), h('i', { style: `width:${by[k] / max * 100}%;background:${ROUTES[k][2]}` }), h('em', { text: by[k] }))))] : null;
  const days = {}; for (const r of rows) (days[r.d] = days[r.d] || []).push(r);
  show(head, bars, Object.entries(days).map(([d, list]) => h('div', { class: 'day' }, h('h3', {}, niceDay(d), h('span', { text: `${list.filter(x => x.r).reduce((a, o) => a + (o.q || 1), 0)} out` })), entryList(list))), foot());
}
const foot = () => h('p', { class: 'foot', html: '© 2026 Daniel Ilias Houlis. All rights reserved. Frequent™ is a trademark of Daniel Ilias Houlis. Your progress stays on this device. <a href="../">More Frequent apps</a>' });

// ---------- Menu ----------
function download(name, text, type) { const a = h('a', { href: URL.createObjectURL(new Blob([text], { type })), download: name }); document.body.append(a); a.click(); a.remove(); }
function obsidian() {
  const L = ['# Frequent Clean', '', `Exported ${ymd()}. Items out this week: ${weekOut()}. Momentum: ${moScore()}.`, '', '## Zones', ''];
  for (const z of S.zones) L.push(`- [${z.done ? 'x' : ' '}] ${z.n}${z.done ? ' (' + z.done + ')' : ''}`);
  L.push('', '## Resale shelf', ''); for (const it of S.shelf) L.push(`- ${it.n}: ${STEPS.filter(s => it.done[s[0]]).length}/5 steps, ${daysLeft(it)} days left`);
  L.push('', '## Items out', '', '| Date | Where | What | Qty | Zone | Money |', '|---|---|---|---|---|---|');
  for (const o of S.out) L.push(`| ${o.d} | ${ROUTES[o.r][0]} | ${(o.n || '').replace(/\|/g, '/')} | ${o.q || 1} | ${o.z || ''} | ${o.amt ? money(o.amt) : ''} |`);
  download(`Frequent Clean ${ymd()}.md`, L.join('\n'), 'text/markdown');
}
function about() {
  const close = sheet(sheetHead('How momentum works', () => close()), h('div', { class: 'why' },
    h('p', { text: `Every item out the door is +${OUT_PTS}, whether you donated, trashed, recycled, returned or sold it. A clear zone is +${ZONE_PTS}. Resale steps earn their own points, and posting earns the most because it’s the scariest.` }),
    h('p', { text: 'Momentum fades a little each day, so recent rounds matter most. Missing a day costs nothing; there are no streaks to break.' }),
    h('p', { text: `The shelf starts with ${SHELF_START} slots and earns one for every two items you finish from it, up to ${SHELF_MAX}. Unsold after ${TIMER} days means donate, with one ${EXTEND}-day extension.` }),
    h('p', { text: 'Things that belong to someone else go back to them. Deciding what happens to them is not your job.' })));
}
$('#menuB').onclick = e => { e.stopPropagation(); $('#menu').hidden = !$('#menu').hidden; };
document.addEventListener('click', e => { if (!$('#menu').contains(e.target)) $('#menu').hidden = true; });
$('#menu').addEventListener('click', e => {
  const a = e.target.dataset && e.target.dataset.act; if (!a) return; $('#menu').hidden = true;
  if (a === 'obsidian') obsidian(); if (a === 'backup') download(`frequent-clean-backup-${ymd()}.json`, JSON.stringify(S, null, 1), 'application/json'); if (a === 'about') about();
});
$('#restore').onchange = async e => {
  const f = e.target.files[0]; if (!f) return; $('#menu').hidden = true;
  try { const d = JSON.parse(await f.text()); if (!d || !Array.isArray(d.out)) throw 0;
    for (const key of ['out', 'shelf', 'steps', 'zones']) { const ids = new Set(S[key].map(x => x.id)); for (const x of (d[key] || [])) if (!ids.has(x.id)) S[key].push(x); }
    S.feel = Object.assign({}, d.feel || {}, S.feel); S.out.sort((a, b) => a.t - b.t); S.steps.sort((a, b) => a.t - b.t); save(); paintMo(); render(); toast('Backup merged in. Nothing was removed.');
  } catch (err) { toast('That file is not a Frequent Clean backup.'); }
  e.target.value = '';
};

// ---------- Tabs ----------
let tab = 'today';
const VIEWS = { today, resale, history };
function render() { VIEWS[tab](); }
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { tab = b.dataset.tab; document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b)); render(); window.scrollTo(0, 0); });
$('#mo').onclick = () => $('.tabs button[data-tab="history"]').click();
render(); paintMo();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
