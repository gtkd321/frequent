// Frequent Clear Quest. © 2026 Daniel Ilias Houlis. All rights reserved. Frequent is a trademark of Daniel Ilias Houlis.
// Points come from things that leave the house, not from effort. Selling is split into six small steps with a
// 14-day timer, so selling never keeps stuff in the room. Everything lives in this browser (localStorage "fcq").
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const h = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat(Infinity)) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
};
const ymd = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 864e5);
const addDays = (d, n) => { const x = new Date(d + 'T12:00'); x.setDate(x.getDate() + n); return ymd(x); };
const niceDay = d => { const t = ymd(); if (d === t) return 'Today'; if (d === addDays(t, -1)) return 'Yesterday'; return new Date(d + 'T12:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

// ---------- Saved progress ----------
const KEY = 'fcq';
const ZONES0 = ['Studio desk', 'Studio floor', 'Bedroom floor', 'Bed and nightstand', 'Dresser top', 'Closet', 'Nerf: one container', 'Rockwool panels: finished or stored safely'];
const blank = () => ({ v: 1, ev: [], mind: null, sales: [], zones: ZONES0.map((n, i) => ({ id: 'z' + i, n, before: null, after: null, mom: null })), firstHidden: false });
let S = blank();
try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && typeof s === 'object') S = Object.assign(blank(), s); } catch (e) { /* keep the old text untouched */ }
let saveT = 0;
const save = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Could not save in this browser. Save a backup file from the menu.'); } }, 120); };

// ---------- Points and momentum (fades by 1/7 a day, like every Frequent app) ----------
const STEPS = [
  { t: 'Take one photo', p: 1 },
  { t: 'Look up what it actually sold for', p: 1, small: 'Sold prices, not asking prices.' },
  { t: "Write the listing. Don't post yet", p: 2 },
  { t: 'Post it', p: 5, brave: true, small: 'The scary one. Biggest step bonus.' },
  { t: 'Answer one buyer message', p: 3, brave: true },
  { t: 'Hand it off or ship it', p: 2, small: 'Then tap Sold below.' }
];
const ROUTES = { return: 'Returned', donate: 'Donated', trash: 'Trashed', sell: 'Sold' };
const outPts = (c, route) => Math.min(10, 2 * c) + (route === 'sell' ? 3 : 0);
const outs = () => S.ev.filter(e => e.k === 'out');
const ptsByDay = () => { const m = {}; for (const e of S.ev) m[e.d] = (m[e.d] || 0) + (e.p || 0); return m; };
const moScore = () => { const t = ymd(); let s = 0; for (const [d, n] of Object.entries(ptsByDay())) { const ago = daysBetween(d, t); if (ago >= 0) s += n * Math.pow(6 / 7, ago); } return Math.round(s); };
const paintMo = bump => { $('#moN').textContent = moScore(); if (bump) { const m = $('#mo'); m.classList.remove('bump'); void m.offsetWidth; m.classList.add('bump'); } };
const RANKS = [[0, 'Getting started'], [10, 'First haul'], [25, 'Lighter load'], [50, 'Room to breathe'], [100, 'Out-the-door pro'], [250, 'Clear space']];

function addEv(e, msg, undoExtra) {
  e.id = uid(); e.d = ymd(); e.t = Date.now(); S.ev.push(e); save(); paintMo(true);
  toast(msg, () => { S.ev = S.ev.filter(x => x.id !== e.id); if (undoExtra) undoExtra(); save(); paintMo(); render(); toast('Undone'); });
  render();
  return e;
}
function logOut(name, route, count, gold, saleId) {
  const c = Math.max(1, Math.round(Number(count) || 1)), g = Math.max(0, Math.round(Number(gold) || 0));
  const n = (name || '').trim() || { return: 'Returned item', donate: 'Donation', trash: 'Trash', sell: 'Sold item' }[route];
  const p = outPts(c, route);
  return { k: 'out', n, route, c, g, p, sale: saleId || null, msg: `+${p} momentum · ${plural(c, 'item')} out the door${g ? ` · +$${g}` : ''}` };
}

// ---------- Stats ----------
function stats() {
  const o = outs(), t = ymd(), wk = addDays(t, -((new Date(t + 'T12:00').getDay() + 6) % 7));
  const total = o.reduce((s, e) => s + e.c, 0), week = o.filter(e => e.d >= wk).reduce((s, e) => s + e.c, 0);
  const gold = o.reduce((s, e) => s + (e.g || 0), 0);
  const days = new Set(o.map(e => e.d)); let streak = 0, d = days.has(t) ? t : addDays(t, -1);
  while (days.has(d)) { streak++; d = addDays(d, -1); }
  const rank = RANKS.filter(r => total >= r[0]).pop(), next = RANKS.find(r => r[0] > total);
  const by = r => o.filter(e => e.route === r).reduce((s, e) => s + e.c, 0);
  return { total, week, gold, streak, rank, next, by };
}
const openSales = () => S.sales.filter(s => !s.closed);
const daysLeft = s => 14 - daysBetween(s.start, ymd());
const leftTxt = s => { const l = daysLeft(s); return l <= 0 ? "Time's up: donate it, it still counts" : l === 1 ? '1 day left' : `${l} days left`; };

// ---------- Small parts ----------
let toastT = 0;
function toast(t, undo) {
  const el = $('#toast'); $('#toastT').textContent = t; const u = $('#toastU');
  u.hidden = !undo; u.onclick = undo ? () => { el.classList.remove('on'); undo(); } : null;
  el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), undo ? 4500 : 2200);
}
function counter(val = 1, label = 'How many') {
  const inp = h('input', { type: 'number', min: '1', value: String(val), inputmode: 'numeric', 'aria-label': label });
  const step = d => { inp.value = String(Math.max(1, (Number(inp.value) || 1) + d)); };
  const el = h('div', { class: 'cnt' }, h('button', { type: 'button', 'aria-label': 'One fewer', text: '−', onclick: () => step(-1) }), inp, h('button', { type: 'button', 'aria-label': 'One more', text: '+', onclick: () => step(1) }));
  el.get = () => Math.max(1, Math.round(Number(inp.value) || 1)); el.reset = () => { inp.value = '1'; };
  return el;
}
const chk = (on, title, small, pts, onclick, brave) => h('button', { class: 'chk' + (on ? ' on' : '') + (brave ? ' brave' : ''), type: 'button', 'aria-pressed': on ? 'true' : 'false', onclick },
  h('span', { class: 'box', text: on ? '✓' : '' }), h('span', { class: 'tx' }, h('b', { text: title }), small ? h('small', { text: small }) : null), pts ? h('span', { class: 'pt', text: pts }) : null);

// ---------- 15-minute run timer ----------
let run = null; // { end, iv }
function beep() { try { const a = new (window.AudioContext || window.webkitAudioContext)(); [0, .35, .7].forEach(t => { const o = a.createOscillator(), g = a.createGain(); o.frequency.value = 880; o.connect(g); g.connect(a.destination); g.gain.setValueAtTime(.2, a.currentTime + t); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + t + .3); o.start(a.currentTime + t); o.stop(a.currentTime + t + .3); }); } catch (e) { } }
const runText = () => { const r = Math.max(0, Math.round((run.end - Date.now()) / 1000)); return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`; };
function tick() {
  if (!run) return;
  if (Date.now() >= run.end) { clearInterval(run.iv); run = null; beep(); toast("Time's up. Stop here, even if you're on a roll."); render(); return; }
  const b = $('#runShow'); if (b) b.textContent = runText();
}
function timerCard() {
  return h('div', { class: 'timer-b' }, h('b', { id: 'runShow', text: run ? runText() : '15:00' }),
    h('button', { class: 'btn ' + (run ? '' : 'go'), type: 'button', text: run ? 'Stop' : 'Start a 15-minute run', onclick: () => {
      if (run) { clearInterval(run.iv); run = null; } else { run = { end: Date.now() + 15 * 60e3 }; run.iv = setInterval(tick, 1000); }
      render();
    } }));
}

// ---------- Today ----------
function today() {
  const m = $('#main'); m.replaceChildren(); const st = stats(); const t = ymd(); const pd = ptsByDay();
  const spark = h('div', { class: 'spark', 'aria-label': 'Momentum points, last 14 days' });
  const vals = []; for (let i = 13; i >= 0; i--) vals.push([addDays(t, -i), pd[addDays(t, -i)] || 0]);
  const max = Math.max(6, ...vals.map(v => v[1]));
  for (const [d, n] of vals) spark.append(h('i', { class: (n ? 'has' : '') + (d === t ? ' today' : ''), style: `height:${Math.max(6, n / max * 100)}%`, title: `${niceDay(d)}: ${n}` }));
  const span = st.next ? st.next[0] - st.rank[0] : 1, into = st.next ? st.total - st.rank[0] : 1;
  m.append(h('h1', { text: 'What left today?' }), h('p', { class: 'sub', text: 'Points come from stuff that leaves the house, not from effort.' }),
    h('section', { class: 'mom' },
      h('div', {}, h('div', { class: 'big', text: st.week }), h('div', { class: 'lbl', text: 'out this week' })), spark,
      h('div', { class: 'score' },
        h('div', {}, h('b', { text: st.total }), h('span', { text: 'all time' })),
        h('div', {}, h('b', { text: '$' + st.gold }), h('span', { text: 'gold' })),
        h('div', {}, h('b', { text: st.streak }), h('span', { text: 'day streak' })),
        h('div', {}, h('b', { text: moScore() }), h('span', { text: 'momentum' }))),
      h('div', { class: 'rank' }, 'Rank ', h('b', { text: st.rank[1] }), st.next ? ` · ${plural(st.next[0] - st.total, 'more item')} to ${st.next[1]}` : ' · top rank',
        h('div', { class: 'bar' }, h('i', { style: `width:${Math.round(into / span * 100)}%` })))));

  // First run checklist, derived from what has actually happened
  const o = outs();
  const firsts = [
    [o.some(e => e.route === 'donate'), 'Fill one bag for donation and put it in the car', 'Then tap Donated below.'],
    [o.some(e => e.route === 'return'), 'Hand one thing back to its owner', 'Then tap Returned below.'],
    [S.sales.length > 0, 'Start your first sale', 'Try the Nerf blasters as one lot on the Sell tab.'],
    [S.sales.some(s => s.steps && s.steps[0]), 'Take one photo of it', 'Step 1 on its ladder.']
  ];
  if (!S.firstHidden) {
    const done = firsts.every(f => f[0]);
    m.append(h('section', { class: 'card' }, h('h2', { text: 'Your first 15-minute run' }), h('p', { class: 'hint', text: 'Three real outcomes and one sale started. Stop when the timer ends.' }),
      timerCard(),
      h('div', { style: 'margin-top:8px' }, firsts.map(f => h('div', { class: 'chk' + (f[0] ? ' on' : '') }, h('span', { class: 'box', text: f[0] ? '✓' : '' }), h('span', { class: 'tx' }, h('b', { text: f[1] }), h('small', { text: f[2] }))))),
      done ? h('div', { class: 'done-all', text: 'First run complete.' }) : null,
      h('button', { class: 'btn ghost', type: 'button', text: done ? 'Hide this card' : 'Hide this card for now', onclick: () => { S.firstHidden = true; save(); render(); } })));
  } else {
    m.append(h('section', { class: 'card' }, h('h2', { text: 'Quick run' }), h('p', { class: 'hint', text: 'Fifteen minutes, then stop.' }), timerCard()));
  }

  // Log it
  const name = h('input', { class: 'inp', type: 'text', placeholder: 'What was it? (optional)', 'aria-label': 'What left the house', maxlength: '80' });
  const cnt = counter();
  const go = route => { const e = logOut(name.value, route, cnt.get(), 0); name.value = ''; cnt.reset(); addEv(e, e.msg); };
  m.append(h('section', { class: 'card' }, h('h2', { text: 'It left the house' }), h('p', { class: 'hint', text: 'Only counts once it is gone: in the car, in their hands, in the bin.' }),
    h('div', { class: 'qrow' }, name, cnt),
    h('div', { class: 'routes' }, ['return', 'donate', 'trash'].map(r => h('button', { class: 'btn green', type: 'button', 'data-route': r, text: ROUTES[r], onclick: () => go(r) })))));

  // Sales at a glance
  const os = openSales();
  if (os.length) m.append(h('section', { class: 'card' }, h('h2', { text: 'Sales in progress' }),
    os.map(s => h('div', { class: 'mini' }, h('span', {}, h('b', { text: s.n }), ` · step ${s.steps.filter(Boolean).length} of 6`), h('span', { class: 'left' + (daysLeft(s) <= 0 ? ' late' : ''), text: leftTxt(s) }))),
    h('button', { class: 'btn', type: 'button', style: 'margin-top:8px', text: 'Open the Sell tab', onclick: () => go_('sell') })));
}

// ---------- Sell ----------
function sell() {
  const m = $('#main'); m.replaceChildren();
  m.append(h('h1', { text: 'Sell' }), h('p', { class: 'sub', text: 'Six small steps. The scary ones pay more. After 14 days, donate it and still get the points.' }));
  const name = h('input', { class: 'inp', type: 'text', placeholder: 'e.g. Nerf lot', 'aria-label': 'What are you selling', maxlength: '60' });
  const cnt = counter(1, 'Items in this lot');
  const err = h('p', { class: 'hint', style: 'color:var(--red);margin:6px 0 0' });
  m.append(h('section', { class: 'card' }, h('h2', { text: 'Start a sale' }), h('p', { class: 'hint', text: 'Sell in bundles: one listing for 20 blasters, not 20 listings.' }),
    h('div', { class: 'qrow' }, name, cnt), err,
    h('button', { class: 'btn go wide', type: 'button', style: 'margin-top:10px', text: 'Start the 14-day timer', onclick: () => {
      const n = name.value.trim(); if (!n) { err.textContent = 'Type what you are selling first.'; return; }
      if (openSales().some(s => s.n.toLowerCase() === n.toLowerCase())) { err.textContent = 'That one is already for sale.'; return; }
      const s = { id: uid(), n, c: cnt.get(), start: ymd(), steps: [null, null, null, null, null, null], listing: '', closed: null };
      S.sales.push(s); addEv({ k: 'start', n, sale: s.id, p: 1 }, `+1 momentum · ${n} is on the board`, () => { S.sales = S.sales.filter(x => x.id !== s.id); });
    } })));

  const os = openSales();
  if (!os.length) m.append(h('div', { class: 'empty', style: 'margin-top:14px', text: 'Nothing for sale yet. Start with one bundle.' }));
  for (const s of os) m.append(saleCard(s));

  // Sold without a ladder
  const n2 = h('input', { class: 'inp', type: 'text', placeholder: 'What sold?', 'aria-label': 'What sold', maxlength: '80' });
  const c2 = counter(), g2 = h('input', { class: 'inp', type: 'number', min: '0', inputmode: 'decimal', placeholder: '$', 'aria-label': 'Sold for' });
  m.append(h('details', { class: 'card more' }, h('summary', { text: 'Sold something without a ladder?' }),
    h('div', { class: 'qrow', style: 'margin-top:10px' }, n2, c2),
    h('div', { class: 'qrow', style: 'margin-top:8px' }, g2, h('button', { class: 'btn green', type: 'button', text: 'Sold', onclick: () => { const e = logOut(n2.value, 'sell', c2.get(), g2.value); addEv(e, e.msg); } }))));

  const closed = S.sales.filter(s => s.closed);
  if (closed.length) m.append(h('h2', { text: 'Finished sales' }), h('div', { class: 'list' }, closed.slice().reverse().map(s => h('div', { class: 'ent' },
    h('div', { class: 'what' }, s.n, h('small', { text: `${s.closed.how === 'sold' ? 'Sold' + (s.closed.g ? ' for $' + s.closed.g : '') : 'Donated instead'} · ${niceDay(s.closed.d)}` }))))));
}
function saleCard(s) {
  const l = daysLeft(s), done = s.steps.filter(Boolean).length;
  const q = encodeURIComponent(s.n);
  const card = h('section', { class: 'card sale', 'data-sale': s.n },
    h('div', { class: 'sale-h' }, h('h2', { text: s.n + (s.c > 1 ? ` (${s.c} items)` : '') }), h('span', { class: 'left' + (l <= 0 ? ' late' : ''), text: leftTxt(s) })),
    h('div', { class: 'bar' + (l <= 0 ? ' late' : '') }, h('i', { style: `width:${Math.round(done / 6 * 100)}%` })));
  STEPS.forEach((st, i) => {
    const on = !!s.steps[i];
    card.append(chk(on, `${i + 1}. ${st.t}`, st.small, `+${st.p}`, () => {
      if (on) { const ev = S.ev.filter(e => e.k === 'step' && e.sale === s.id && e.i === i).pop(); if (ev) S.ev = S.ev.filter(x => x !== ev); s.steps[i] = null; save(); paintMo(); render(); return; }
      s.steps[i] = ymd();
      addEv({ k: 'step', sale: s.id, i, n: `${s.n}: ${st.t.toLowerCase()}`, p: st.p }, `+${st.p} momentum${st.brave ? ' · bravery bonus' : ''}`, () => { s.steps[i] = null; });
    }, st.brave));
    if (i === 1 && !on) card.append(h('div', { class: 'extra' }, h('div', { class: 'links' },
      h('a', { href: `https://www.ebay.com/sch/i.html?_nkw=${q}&LH_Sold=1&LH_Complete=1`, target: '_blank', rel: 'noopener', text: 'eBay sold prices' }),
      h('a', { href: `https://www.facebook.com/marketplace/search?query=${q}`, target: '_blank', rel: 'noopener', text: 'Facebook Marketplace' })),
      h('small', { class: 'hint', text: 'Price it a little under the middle of what you see so it moves.' })));
    if (i === 2 && !s.steps[3]) {
      const ta = h('textarea', { class: 'inp', rows: '4', 'aria-label': 'Listing draft', placeholder: `${s.n}${s.c > 1 ? ` — ${s.c} pieces` : ''}\nCondition: \nPrice: $\nLocal pickup, or I can ship.` });
      ta.value = s.listing || ''; ta.oninput = () => { s.listing = ta.value; save(); };
      card.append(h('div', { class: 'extra' }, ta, h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', text: 'Copy listing', onclick: () => {
        const txt = ta.value || ta.placeholder;
        (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast('Listing copied')).catch(() => { ta.value = txt; ta.select(); toast('Selected. Copy it from here.'); });
      } }))));
    }
  });
  const g = h('input', { class: 'inp', type: 'number', min: '0', inputmode: 'decimal', placeholder: '$', 'aria-label': 'Sold for' });
  card.append(h('div', { class: 'close-row' }, g,
    h('button', { class: 'btn green', type: 'button', text: 'Sold', onclick: () => {
      const prev6 = s.steps[5]; const e = logOut(s.n, 'sell', s.c, g.value, s.id);
      s.closed = { how: 'sold', d: ymd(), g: e.g }; if (!s.steps[5]) s.steps[5] = ymd();
      addEv(e, e.msg, () => { s.closed = null; s.steps[5] = prev6; });
    } }),
    h('button', { class: 'btn', type: 'button', text: 'Donate instead', onclick: () => {
      const e = logOut(s.n, 'donate', s.c, 0, s.id); s.closed = { how: 'donated', d: ymd() };
      addEv(e, e.msg + ' · still counts', () => { s.closed = null; });
    } })));
  return card;
}

// ---------- Zones ----------
function shrink(file) {
  return new Promise((ok, no) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const k = Math.min(1, 640 / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); try { ok(c.toDataURL('image/jpeg', .7)); } catch (e) { no(e); } };
    img.onerror = no; img.src = url;
  });
}
function zones() {
  const m = $('#main'); m.replaceChildren();
  const won = S.zones.filter(z => z.mom).length;
  m.append(h('h1', { text: 'Zones' }), h('p', { class: 'sub', text: `A zone is beaten when it's clear and Mom agrees. ${won} of ${S.zones.length} beaten.` }));
  for (const z of S.zones) {
    const shot = (key, label, pts) => {
      const inp = h('input', { type: 'file', accept: 'image/*', capture: 'environment' });
      inp.onchange = async () => {
        const f = inp.files[0]; if (!f) return;
        try { const prev = z[key]; z[key] = { d: ymd(), img: await shrink(f) }; addEv({ k: 'zone', z: z.id, what: key, n: `${z.n}: ${label.toLowerCase()}`, p: prev ? 0 : pts }, prev ? 'Photo replaced' : `+${pts} momentum · ${label.toLowerCase()} saved`, () => { z[key] = prev; }); }
        catch (e) { toast('Could not read that photo. Try another one.'); }
      };
      return h('label', { class: 'shot' }, z[key] ? h('img', { src: z[key].img, alt: `${z.n} ${label.toLowerCase()}` }) : h('span', { text: `+ ${label}` }), z[key] ? h('span', { class: 'cap', text: `${label} · ${niceDay(z[key].d)}` }) : null, inp);
    };
    m.append(h('section', { class: 'card zone' },
      h('h2', {}, z.n, z.mom ? h('span', { class: 'won', text: 'Beaten' }) : null),
      h('div', { class: 'shots' }, shot('before', 'Before photo', 1), shot('after', 'After photo', 2)),
      chk(!!z.mom, 'Mom check', z.mom ? `She agreed ${niceDay(z.mom).toLowerCase()}.` : 'She looks and agrees it is clear. This is the boss kill.', '+5', () => {
        if (z.mom) { const ev = S.ev.filter(e => e.k === 'zone' && e.z === z.id && e.what === 'mom').pop(); if (ev) S.ev = S.ev.filter(x => x !== ev); z.mom = null; save(); paintMo(); render(); return; }
        z.mom = ymd(); addEv({ k: 'zone', z: z.id, what: 'mom', n: `${z.n}: Mom check`, p: 5 }, `+5 momentum · ${z.n} beaten`, () => { z.mom = null; });
      }, true)));
  }
  const nz = h('input', { class: 'inp', type: 'text', placeholder: 'Add a zone, e.g. Car trunk', 'aria-label': 'New zone name', maxlength: '50' });
  m.append(h('section', { class: 'card' }, h('div', { class: 'qrow' }, nz, h('button', { class: 'btn', type: 'button', text: 'Add zone', onclick: () => { const n = nz.value.trim(); if (!n) return; S.zones.push({ id: uid(), n, before: null, after: null, mom: null }); save(); render(); } }))));
}

// ---------- History ----------
function history() {
  const m = $('#main'); m.replaceChildren(); const st = stats();
  m.append(h('h1', { text: 'History' }), h('p', { class: 'sub', text: `Returned ${st.by('return')} · Donated ${st.by('donate')} · Sold ${st.by('sell')} · Trashed ${st.by('trash')}` }));
  if (!S.ev.length) { m.append(h('div', { class: 'empty', text: 'Nothing yet. Your first bag out the door shows up here.' })); return; }
  const byDay = {}; for (const e of S.ev) (byDay[e.d] = byDay[e.d] || []).push(e);
  for (const d of Object.keys(byDay).sort().reverse()) {
    const list = byDay[d], n = list.filter(e => e.k === 'out').reduce((s, e) => s + e.c, 0);
    m.append(h('div', { class: 'day' }, h('h3', {}, niceDay(d), h('span', { text: n ? plural(n, 'item') + ' out' : '' })),
      h('div', { class: 'list' }, list.slice().reverse().map(e => h('div', { class: 'ent' },
        h('div', { class: 'what' }, e.k === 'out' ? `${e.n}` : e.n, e.k === 'out' ? h('span', { class: 'tag ' + (e.route === 'sell' ? 't' : 'n'), text: ROUTES[e.route] }) : null,
          h('small', { text: e.k === 'out' ? `${plural(e.c, 'item')}${e.g ? ' · $' + e.g : ''}` : ({ step: 'Sell step', start: 'Sale started', zone: 'Zone proof', mind: 'Mind', in: 'Came in' })[e.k] || '' })),
        h('span', { class: 'pts', text: e.p ? '+' + e.p : '' }),
        e.k === 'out' && !e.sale ? h('button', { class: 'x', type: 'button', 'aria-label': 'Remove ' + e.n, text: '×', onclick: () => { S.ev = S.ev.filter(x => x !== e); save(); paintMo(); render(); toast('Removed', () => { S.ev.push(e); S.ev.sort((a, c) => a.t - c.t); save(); paintMo(); render(); }); } }) : null)))));
  }
}

// ---------- Mind: short exercises for the part of clutter that lives in your head ----------
const blankMind = () => ({ ants: [], circle: [], worries: [], ready: {}, talks: {}, pace: 5, seen: [] });
S.mind = Object.assign(blankMind(), S.mind || {});
const READY = ['Water: 1 gallon per person per day, for several days', 'Several days of non-perishable food', 'Manual can opener', 'Flashlight', 'Extra batteries', 'Battery or hand-crank radio', 'First aid kit', 'Prescription medicines', 'Phone charger and backup battery', 'Whistle', 'Dust masks', 'Wipes, garbage bags and ties', 'Wrench or pliers for utilities', 'Local maps', 'Some cash', 'Copies of important papers in a waterproof bag'];
const TALKS = ['Which three things in the house matter most to you?', 'Is there anything you would like a particular person to have someday?', 'What would you be glad to see go now?', 'Which room or spot bugs you the most?', 'Where are the important papers kept?', 'Would you like help with one closet this month?'];
const mindDone = (m, n) => addEv({ k: 'mind', m, n, p: 1 }, `+1 momentum · ${n}`);
function openSheet(title, ...kids) {
  closeSheet();
  const box = h('div', { role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    h('div', { class: 'sh-h' }, h('h2', { text: title }), h('button', { class: 'close', type: 'button', 'aria-label': 'Close', text: '×', onclick: closeSheet })), ...kids);
  const wrap = h('div', { class: 'modal', onclick: e => { if (e.target === wrap) closeSheet(); } }, box);
  document.body.append(wrap); return box;
}
const lab = t => h('div', { class: 'lab', text: t });
const field = (label, ph, rows) => { const el = rows ? h('textarea', { class: 'inp', rows: String(rows), placeholder: ph, 'aria-label': label }) : h('input', { class: 'inp', type: 'text', placeholder: ph, 'aria-label': label }); return [lab(label), el]; };

function seeSheet() {
  let left = 60, iv = 0;
  const clock = h('b', { text: '1:00' });
  const startB = h('button', { class: 'btn go', type: 'button', text: 'Start 60 seconds', onclick: () => {
    clearInterval(iv); left = 60; startB.disabled = true;
    iv = setInterval(() => { left--; clock.textContent = `0:${String(Math.max(0, left)).padStart(2, '0')}`; if (left <= 0) { clearInterval(iv); beep(); startB.disabled = false; startB.textContent = 'Again'; clock.textContent = 'Done'; } }, 1000);
  } });
  const [l1, surf] = field('Which surface?', 'e.g. nightstand');
  openSheet('See one small change',
    h('p', { class: 'sh-cue', text: "The whole house is too big to picture. One surface isn't." }),
    h('ol', { class: 'steps-l' },
      h('li', { text: 'Soften your gaze or close your eyes.' }),
      h('li', { text: 'Pick one small surface you can see from here: a nightstand, one shelf, a chair.' }),
      h('li', { text: 'Picture it clear. What goes back where it lives? What leaves the room?' }),
      h('li', { text: 'Picture using it: setting down a glass of water, a book, your phone.' }),
      h('li', { text: 'Open your eyes. That one surface is the whole job for today.' })),
    h('div', { class: 'timer-b' }, clock, startB), l1, surf,
    h('div', { style: 'margin-top:14px' }, h('button', { class: 'btn green wide', type: 'button', text: "I'll clear this one now", onclick: () => {
      clearInterval(iv); const n = surf.value.trim() || 'one surface';
      S.mind.seen.push({ id: uid(), d: ymd(), n }); closeSheet(); go_('today'); mindDone('see', `Pictured ${n}`);
    } })));
}

const RINGS = { mine: ['Mine to decide', 'Yours to decide. Pick the smallest next step and do it on Today or Sell.'], ours: ['Ours to talk about', 'Worth one calm talk. Frame it around what makes life easier now, not later.'], not: ['Not mine to carry', 'Not yours to fix. You can care about it without carrying it. Let it stay with its owner.'] };
function circleSheet() {
  const [l1, w] = field("What's on your mind?", "e.g. Dad's boxes in the hallway");
  const out = h('div');
  const list = h('div');
  const paintList = () => {
    list.replaceChildren();
    for (const k of Object.keys(RINGS)) {
      const items = S.mind.circle.filter(c => c.r === k).slice(-6).reverse(); if (!items.length) continue;
      list.append(lab(RINGS[k][0]), h('div', { class: 'list' }, items.map(c => h('div', { class: 'ent' }, h('div', { class: 'what' }, c.t, c.say ? h('small', { text: 'Say: ' + c.say }) : null),
        h('button', { class: 'x', type: 'button', 'aria-label': 'Remove ' + c.t, text: '×', onclick: () => { S.mind.circle = S.mind.circle.filter(x => x !== c); save(); paintList(); } })))));
    }
  };
  const pick = r => {
    const t = w.value.trim(); if (!t) { out.replaceChildren(h('p', { class: 'hint', style: 'color:var(--red)', text: 'Type the worry first.' })); return; }
    const c = { id: uid(), d: ymd(), t, r }; S.mind.circle.push(c); w.value = '';
    const kids = [h('p', { class: 'sh-cue', style: 'margin:12px 0 6px;color:var(--ink)', text: RINGS[r][1] })];
    if (r === 'ours') { const [l2, say] = field('One sentence you could say', 'e.g. Could we clear the hallway together on Saturday? It would be easier to get through.', 2); say.oninput = () => { c.say = say.value.trim(); save(); }; kids.push(l2, say); }
    out.replaceChildren(...kids); mindDone('circle', `Sorted: ${RINGS[r][0].toLowerCase()}`); paintList();
  };
  openSheet('Circle of control',
    h('p', { class: 'sh-cue', text: "It's your parents' house. Some of the clutter is yours to decide, some is worth a talk, and some isn't yours to carry." }),
    l1, w, h('div', { class: 'chips', style: 'margin-top:10px' }, Object.keys(RINGS).map(k => h('button', { class: 'chip', type: 'button', 'data-ring': k, text: RINGS[k][0], onclick: () => pick(k) }))),
    out, list);
  paintList();
}

function worrySheet() {
  const f = [['The worry in one sentence', 'e.g. Hard times will come and we will need everything we kept.', 2], ['Worst realistic case', 'Not the movie version. The bad-but-real one.', 2], ['Best case', 'Let it be a little silly.', 2], ['Most likely', 'What would you tell a friend? What happened last time?', 2], ['If the worst happened, what would I do first?', 'Who could help? What have I handled before?', 2], ['One small step now', 'e.g. Check the Ready shelf. Donate one bag.', 1]].map(x => field(...x));
  const err = h('p', { class: 'hint', style: 'color:var(--red);margin:6px 0 0' });
  const past = S.mind.worries.slice(-5).reverse();
  openSheet('Worry check',
    h('p', { class: 'sh-cue', text: 'Worry tends to show only the worst case. Write all three, then plan for the most likely one.' }),
    f.flat(), err,
    h('div', { style: 'margin-top:14px' }, h('button', { class: 'btn go wide', type: 'button', text: 'Save this check', onclick: () => {
      const v = f.map(x => x[1].value.trim()); if (!v[0] || !v[3]) { err.textContent = 'Write the worry and the most likely case at least.'; return; }
      S.mind.worries.push({ id: uid(), d: ymd(), w: v[0], worst: v[1], best: v[2], likely: v[3], cope: v[4], step: v[5] }); closeSheet(); mindDone('worry', 'Worry check');
    } })),
    past.length ? h('details', { class: 'more' }, h('summary', { text: `Past checks (${S.mind.worries.length})` }),
      h('div', { class: 'list', style: 'margin-top:8px' }, past.map(x => h('div', { class: 'ent' }, h('div', { class: 'what' }, x.w, h('small', { text: `Most likely: ${x.likely}${x.step ? ' · Step: ' + x.step : ''}` })))))) : null,
    h('p', { class: 'hint', style: 'margin-top:14px', text: 'If a hard time is truly coming, plan for it. This check is for worries that run ahead of the facts.' }));
}

function readySheet() {
  const box = h('div');
  const paint = () => {
    const have = READY.filter((_, i) => S.mind.ready[i]).length;
    box.replaceChildren(h('p', { class: 'hint', text: `${have} of ${READY.length} on the shelf` }), h('div', { class: 'bar' }, h('i', { style: `width:${Math.round(have / READY.length * 100)}%` })),
      ...READY.map((t, i) => chk(!!S.mind.ready[i], t, null, null, () => { if (S.mind.ready[i]) delete S.mind.ready[i]; else S.mind.ready[i] = ymd(); save(); paint(); })));
  };
  const flow = h('div', { class: 'card', style: 'margin-top:14px' });
  const [l1, item] = field('Holding something "just in case"?', 'e.g. a box of old cables');
  const ask = (q, yes, no) => { flow.replaceChildren(h('p', { style: 'margin:0 0 10px;font-weight:600', text: q }), h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', text: 'Yes', onclick: yes }), h('button', { class: 'btn', type: 'button', text: 'No', onclick: no }))); };
  const verdict = t => { flow.replaceChildren(h('p', { style: 'margin:0 0 10px', text: t }), h('button', { class: 'btn go', type: 'button', text: 'Done', onclick: () => { mindDone('ready', `Just in case: ${item.value.trim() || 'one item'}`); start(); } })); };
  const start = () => { flow.replaceChildren(l1, item, h('button', { class: 'btn go', type: 'button', style: 'margin-top:10px', text: 'Ask the questions', onclick: () => ask('Is it on the Ready list above?',
    () => verdict('Put it on the Ready shelf. That is what the shelf is for.'),
    () => ask('Did you use it in the last year?',
      () => verdict('Keep it, and give it a home where you can find it.'),
      () => ask('If you needed it, could you get one again (borrow, buy, ask a neighbor)?',
        () => verdict('Let it go. Log it on Today, or start a sale if it is worth selling.'),
        () => verdict('Put it in a Maybe box with today\'s date. In 14 days, decide again.')))) })); };
  start();
  openSheet('Ready shelf',
    h('p', { class: 'sh-cue', text: 'Being ready for hard days is real. It fits in one or two bins, not the whole house. This is the basic kit Ready.gov recommends.' }),
    box, flow,
    h('p', { class: 'src', style: 'margin-top:12px' }, 'List from ', h('a', { href: 'https://www.ready.gov/kit', target: '_blank', rel: 'noopener', text: 'Ready.gov Build a Kit' }), '. Check it every six months.'));
  paint();
}

function longSheet() {
  const o = outs(), t = ymd(); const last28 = o.filter(e => daysBetween(e.d, t) < 28).reduce((s, e) => s + e.c, 0); const actual = Math.round(last28 / 4 * 10) / 10;
  const pace = counter(S.mind.pace, 'Things out per week'); const res = h('p', { style: 'margin:8px 0 0' });
  const paintPace = () => { const n = pace.get(); S.mind.pace = n; save(); res.replaceChildren('That is ', h('b', { text: (n * 52).toLocaleString() }), ' a year and ', h('b', { text: (n * 260).toLocaleString() }), ' in five years. Your last four weeks: ', h('b', { text: actual }), ' a week.'); };
  pace.addEventListener('click', paintPace); pace.querySelector('input').addEventListener('input', paintPace);
  const talks = TALKS.map((q, i) => { const ta = h('textarea', { class: 'inp', rows: '2', 'aria-label': q, placeholder: 'Their words, in short' }); ta.value = S.mind.talks[i] || ''; ta.oninput = () => { S.mind.talks[i] = ta.value; save(); }; return [lab(q), ta]; });
  openSheet('The long game',
    h('p', { class: 'sh-cue', text: "The house runs on your parents' choices. Your part is the slow, steady version, so nobody has to face it all at once later. The Swedes call this döstädning: clearing a little at a time, over years." }),
    lab('A pace you could keep'), h('div', { style: 'max-width:160px' }, pace), res,
    lab('Talks while everyone is here and well'),
    h('p', { class: 'hint', style: 'margin:0 0 4px', text: 'One question per talk is plenty. Frame it around what makes life easier now. Start with easy things like clothes, not photos.' }),
    talks.flat(),
    h('div', { style: 'margin-top:14px' }, h('button', { class: 'btn go wide', type: 'button', text: 'I had one of these talks', onclick: () => { closeSheet(); mindDone('long', 'Talked with Mom or Dad'); } })),
    h('p', { class: 'src', style: 'margin-top:12px' }, 'Idea from Margareta Magnusson, ', h('a', { href: 'https://parents.simonandschuster.com/9781501173240', target: '_blank', rel: 'noopener', text: 'The Gentle Art of Swedish Death Cleaning' }), '.'));
  paintPace();
}

function flowSheet() {
  const box = h('div');
  const paint = () => {
    const m = ymd().slice(0, 7);
    const inN = S.ev.filter(e => e.k === 'in' && e.d.startsWith(m)).reduce((s, e) => s + e.c, 0), outN = outs().filter(e => e.d.startsWith(m)).reduce((s, e) => s + e.c, 0);
    box.replaceChildren(h('div', { class: 'score', style: 'grid-template-columns:repeat(3,1fr)' },
      h('div', {}, h('b', { text: inN }), h('span', { text: 'came in' })), h('div', {}, h('b', { text: outN }), h('span', { text: 'went out' })),
      h('div', {}, h('b', { text: (outN - inN > 0 ? '+' : '') + (outN - inN) }), h('span', { text: 'net clearer' }))),
      h('p', { class: 'hint', style: 'margin:6px 0 0', text: 'This month, your own things only.' }));
  };
  const [l1, n] = field('Something of mine came in', 'e.g. new cable, a free shirt');
  openSheet('In and out',
    h('p', { class: 'sh-cue', text: 'Clearing only feels like progress if less comes in than goes out. Before something comes in, ask: where will it live, and what leaves to make room?' }),
    box, l1, n,
    h('div', { style: 'margin-top:10px' }, h('button', { class: 'btn wide', type: 'button', text: 'Count it', onclick: () => { addEv({ k: 'in', n: n.value.trim() || 'Something came in', c: 1, p: 0 }, 'Counted. Noticing is the skill.'); n.value = ''; paint(); } })),
    h('p', { class: 'hint', style: 'margin-top:12px', text: "Things other people bring in aren't yours to count. Put them in Circle of control as not mine to carry." }));
  paint();
}

const ANT_TYPES = [['All-or-nothing', 'always, never, everything'], ['Fortune telling', 'predicting the worst'], ['Just the bad', 'missing the good'], ['Less than', 'comparing yourself'], ['Labeling', 'harsh names'], ['Guilt beating', 'should, must'], ['Mind reading', 'guessing what others think'], ['If only', 'arguing with past or future'], ['Blaming', 'it is all on someone else']];
function antCard(a, n) {
  let flip = false;
  const face = h('div', { class: 'ant-face' });
  const paint = () => face.replaceChildren(...[h('p', { class: 'k', text: flip ? 'Turned around' : `Thought #${n}` }), h('p', { class: 'ant-t', text: flip ? (a.turn || 'No turnaround yet') : a.t }),
    flip && a.ev ? h('p', { class: 'hint', style: 'margin:6px 0 0', text: 'Because: ' + a.ev }) : null,
    !flip && a.types && a.types.length ? h('p', { class: 'hint', style: 'margin:6px 0 0', text: a.types.join(' · ') }) : null].filter(Boolean));
  paint();
  return h('button', { class: 'ant-card' + (a.turn ? '' : ' plain'), type: 'button', 'aria-label': `Flip thought ${n}`, onclick: e => { flip = !flip; e.currentTarget.classList.toggle('flipped', flip); paint(); } }, face);
}
function antSheet() {
  const n = S.mind.ants.length + 1;
  const [l1, t] = field('The thought, word for word', 'e.g. This house will always be cluttered.', 2);
  const types = new Set();
  const chips = h('div', { class: 'chips' }, ANT_TYPES.map(([k, d]) => h('button', { class: 'chip', type: 'button', title: d, text: k, 'aria-pressed': 'false', onclick: e => { types.has(k) ? types.delete(k) : types.add(k); e.currentTarget.classList.toggle('on'); e.currentTarget.setAttribute('aria-pressed', types.has(k)); } })));
  const yn = (q, opts) => { let v = ''; const row = h('div', { class: 'chips' }, opts.map(o => h('button', { class: 'chip', type: 'button', text: o, onclick: e => { v = o; row.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === e.currentTarget)); } }))); row.get = () => v; return [lab(q), row]; };
  const q1 = yn('1. Is it true?', ['Yes', 'No', 'Not sure']), q2 = yn('2. Is it 100% true, every time, forever?', ['Yes', 'No']);
  const [l3, feel] = field('3. How do I feel and act when I believe it?', 'e.g. Heavy. I stop trying.', 2);
  const [l4, without] = field('4. How would I feel and act without it?', 'e.g. Lighter. I would do one sprint.', 2);
  const [l5, turn] = field('5. Turn it around: the exact opposite', 'e.g. This house will not always be cluttered.', 2);
  const [l6, ev] = field('Why the opposite might be as true, or truer', 'e.g. I have seen it get clean fast in sprints.', 2);
  const err = h('p', { class: 'hint', style: 'color:var(--red);margin:6px 0 0' });
  openSheet('Thought test',
    h('p', { class: 'sh-cue', text: "Dr. Daniel Amen's version of Byron Katie's questions. Not positive thinking, accurate thinking. If a thought turns out true, it's a plan to make, not a feeling to fight." }),
    l1, t, lab('What kind of thought? (optional)'), chips, ...q1, ...q2, l3, feel, l4, without, l5, turn, l6, ev, err,
    h('div', { style: 'margin-top:14px' }, h('button', { class: 'btn go wide', type: 'button', text: `Save thought #${n}`, onclick: () => {
      if (!t.value.trim() || !turn.value.trim()) { err.textContent = 'Write the thought and its turnaround at least.'; return; }
      S.mind.ants.push({ id: uid(), d: ymd(), t: t.value.trim(), types: [...types], q1: q1[1].get(), q2: q2[1].get(), feel: feel.value.trim(), without: without.value.trim(), turn: turn.value.trim(), ev: ev.value.trim() });
      closeSheet(); mindDone('ant', `Tested thought #${n}`);
    } })),
    h('p', { class: 'src', style: 'margin-top:12px' }, 'Questions from ', h('a', { href: 'https://www.amenclinics.com/blog/number-one-habit-develop-order-feel-positive/', target: '_blank', rel: 'noopener', text: 'Amen Clinics' }), ', based on Byron Katie, Loving What Is.'));
  t.focus();
}
function antsDeck() {
  const a = S.mind.ants, n = a.length;
  const goal = n < 30 ? 30 : 100;
  return h('section', { class: 'card', style: 'margin-top:14px' },
    h('div', { class: 'row', style: 'justify-content:space-between;align-items:baseline' }, h('h3', { style: 'margin:0', text: 'Thought cards' }), h('span', { class: 'hint', text: `${n} of ${goal}` })),
    h('div', { class: 'bar', style: 'margin:8px 0 6px' }, h('i', { style: `width:${Math.min(100, Math.round(n / goal * 100))}%` })),
    h('p', { class: 'hint', style: 'margin:0 0 10px', text: n === 0 ? 'Write down your worst thoughts and test them one at a time. Dr. Amen says by about 30, they stop bothering you.' : n < 30 ? `${30 - n} more to 30, where they tend to stop bothering you. Tap a card to flip it.` : 'Past 30. Keep going toward 100. Tap a card to flip it.' }),
    n ? h('div', { class: 'ant-deck' }, a.slice().reverse().slice(0, 12).map((x, i) => antCard(x, n - i))) : null,
    h('button', { class: 'btn go', type: 'button', style: 'margin-top:10px', text: n ? 'Test another thought' : 'Test your first thought', onclick: antSheet }),
    n > 12 ? h('p', { class: 'hint', style: 'margin:8px 0 0', text: `Showing the newest 12 of ${n}.` }) : null);
}
const MOVES = [
  { id: 'ant', t: 'Thought test', d: 'Write a worst thought, ask five questions, turn it around.', run: antSheet },
  { id: 'see', t: 'See one small change', d: 'One minute picturing one clear surface, then do just that.', run: seeSheet },
  { id: 'circle', t: 'Circle of control', d: 'Mine to decide, ours to talk about, or not mine to carry.', run: circleSheet },
  { id: 'worry', t: 'Worry check', d: 'Worst, best and most likely. Then one small step.', run: worrySheet },
  { id: 'ready', t: 'Ready shelf', d: 'Prepared for hard days in one or two bins, not the whole house.', run: readySheet },
  { id: 'long', t: 'The long game', d: 'A slow pace you can keep, and talks while everyone is well.', run: longSheet },
  { id: 'flow', t: 'In and out', d: 'Notice what comes in, not just what leaves.', run: flowSheet }
];
function mind() {
  const m = $('#main'); m.replaceChildren();
  const dayN = Math.floor(new Date(ymd() + 'T12:00') / 864e5), pick = MOVES[dayN % MOVES.length];
  const doneToday = new Set(S.ev.filter(e => e.k === 'mind' && e.d === ymd()).map(e => e.m));
  m.append(h('h1', { text: 'Mind' }), h('p', { class: 'sub', text: 'Short exercises for the part of clutter that lives in your head. Each one is +1 momentum.' }),
    h('section', { class: 'new' }, h('p', { class: 'k', text: "Today's move" }), h('h3', { text: pick.t }), h('p', { class: 'cue', text: pick.d }),
      h('button', { class: 'btn green', type: 'button', text: doneToday.has(pick.id) ? 'Do it again' : 'Start', onclick: pick.run })),
    antsDeck(),
    h('h2', { text: 'All moves' }),
    h('div', { class: 'list mv' }, MOVES.map(x => h('div', { class: 'ex' }, h('button', { class: 'name', type: 'button', 'data-move': x.id, onclick: x.run }, h('b', {}, x.t, doneToday.has(x.id) ? h('span', { class: 'tag n', text: 'Done today' }) : null), h('span', { text: x.d }))))),
    h('p', { class: 'foot' }, 'If worry about the future or the house takes up a lot of your day, a therapist trained in CBT can help. The ', h('a', { href: 'https://hoarding.iocdf.org/about-hoarding/how-is-hoarding-disorder-treated/', target: '_blank', rel: 'noopener', text: 'IOCDF' }), ' explains how that works.'));
}

// ---------- Backup, restore, about ----------
function download(name, text, type) {
  const a = h('a', { href: URL.createObjectURL(new Blob([text], { type })), download: name });
  document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
const backup = () => download(`frequent-clear-quest-${ymd()}.json`, JSON.stringify(S), 'application/json');
function restore(file) {
  file.text().then(t => JSON.parse(t)).then(b => {
    if (!b || !Array.isArray(b.ev)) throw 0;
    const ids = new Set(S.ev.map(e => e.id)); for (const e of b.ev) if (e && e.id && !ids.has(e.id)) S.ev.push(e);
    S.ev.sort((a, c) => a.t - c.t);
    const sids = new Set(S.sales.map(s => s.id)); for (const s of b.sales || []) if (!sids.has(s.id)) S.sales.push(s);
    for (const z of b.zones || []) { const mine = S.zones.find(x => x.id === z.id); if (!mine) S.zones.push(z); else for (const k of ['before', 'after', 'mom']) if (!mine[k] && z[k]) mine[k] = z[k]; }
    if (b.mind) { for (const k of ['ants', 'circle', 'worries', 'seen']) { const ids = new Set(S.mind[k].map(x => x.id)); for (const x of b.mind[k] || []) if (!ids.has(x.id)) S.mind[k].push(x); }
      Object.assign(S.mind.ready, b.mind.ready || {}); for (const [i, v] of Object.entries(b.mind.talks || {})) if (!S.mind.talks[i]) S.mind.talks[i] = v; }
    save(); paintMo(); render(); toast('Backup added. Nothing was erased.');
  }).catch(() => toast('That file is not a Clear Quest backup.'));
}
function closeSheet() { document.querySelectorAll('.modal').forEach(x => x.remove()); }
function about() {
  closeSheet();
  const box = h('div', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'How it works' },
    h('div', { class: 'sh-h' }, h('h2', { text: 'How it works' }), h('button', { class: 'close', type: 'button', 'aria-label': 'Close', text: '×', onclick: closeSheet })),
    h('p', { text: 'The main number is items out the door this week. Something counts only once it has left: returned to its owner, donated, sold or thrown out.' }),
    h('p', { text: 'Each item out is +2 momentum (up to +10 for a bundle), and a sale adds +3. Sell steps earn +1 to +5, and the scary ones (posting, answering buyers) pay the most. Photos and Mom checks on the Zones tab earn more.' }),
    h('p', { text: 'Every sale has a 14-day timer. When it runs out, tap Donate instead. It still counts, so selling never keeps stuff in your room.' }),
    h('p', { text: 'The Mind tab has short exercises for worry, the long game with your parents and what comes in. Each is +1, so stuff leaving still counts most.' }),
    h('p', { text: 'Momentum fades by a seventh each day. It never goes negative, and one bag out the door brings it back.' }),
    h('p', { class: 'hint', text: 'Everything is saved in this browser only. Use Save a backup file in the menu now and then, especially before switching phones.' }),
    h('div', { style: 'margin-top:14px' }, h('button', { class: 'btn go wide', type: 'button', text: 'Got it', onclick: closeSheet })));
  const wrap = h('div', { class: 'modal', onclick: e => { if (e.target === wrap) closeSheet(); } }, box);
  document.body.append(wrap);
}

// ---------- Tabs ----------
let tab = 'today';
const VIEWS = { today, sell, zones, mind, history };
const render = () => VIEWS[tab]();
function go_(t) { tab = t; document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t)); render(); scrollTo(0, 0); }
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => go_(b.dataset.tab));
$('#menuB').onclick = e => { e.stopPropagation(); $('#menu').hidden = !$('#menu').hidden; };
document.addEventListener('click', e => { if (!e.target.closest('#menu')) $('#menu').hidden = true; });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
$('#menu').addEventListener('click', e => { const a = e.target.dataset.act; if (a === 'backup') backup(); if (a === 'about') about(); if (a) $('#menu').hidden = true; });
$('#restore').onchange = e => { const f = e.target.files[0]; if (f) restore(f); e.target.value = ''; $('#menu').hidden = true; };
$('#mo').onclick = () => toast(`Momentum ${moScore()} · today +${ptsByDay()[ymd()] || 0}. One bag out the door brings it back.`);
let shownDay = ymd();
document.addEventListener('visibilitychange', () => { if (!document.hidden && ymd() !== shownDay) { shownDay = ymd(); paintMo(); render(); } });

paintMo(); go_('today');
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
