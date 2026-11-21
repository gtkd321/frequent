// Frequent Cooking. © 2026 Daniel Houlis. All rights reserved. Frequent is a trademark of Daniel Houlis.
// Make capsules ahead, then build dishes from them. Momentum grows most for something new, and for every dish
// that reuses a capsule you already made. Everything lives in this browser (localStorage "fck").
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

// ---------- Saved progress ----------
const KEY = 'fck';
const blank = () => ({ v: 1, log: [], custom: [], used: {}, skip: 0 });
let S = blank();
try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && typeof s === 'object') S = Object.assign(blank(), s); } catch (e) { /* keep the old text untouched */ }
let saveT = 0;
const save = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Could not save in this browser. Save a backup file from the menu.'); } }, 120); };
const all = () => RECIPES.concat(S.custom);
const byId = id => all().find(r => r.id === id);
const nameOf = id => (byId(id) || { n: id }).n;

// ---------- What you have made ----------
const entriesFor = id => S.log.filter(e => e.it === id);
const lastOf = id => { for (let i = S.log.length - 1; i >= 0; i--) if (S.log[i].it === id) return S.log[i]; return null; };
const timesMade = id => entriesFor(id).length;
const status = id => { const n = timesMade(id); return n === 0 ? 'nw' : n < 3 ? 'tried' : 'reg'; };
const STATUS_TXT = { nw: 'Not made yet', tried: 'Made', reg: 'Regular (3+ times)' };
const freqScore = id => { const t = ymd(); let s = 0; for (const e of entriesFor(id)) s += Math.pow(0.95, daysBetween(e.d, t)); return s; };

// ---------- The kitchen: capsules still good to use ----------
// A capsule stays in the kitchen for its keep days, unless you mark it used up.
function kitchen() {
  const t = ymd(); const out = {};
  for (const e of S.log) {
    const r = byId(e.it); if (!r || r.kind !== 'cap' || S.used[e.id]) continue;
    const left = (r.keep || 3) - daysBetween(e.d, t);
    if (left > 0 && (!out[r.id] || out[r.id].e.t < e.t)) out[r.id] = { r, e, left };
  }
  return out;
}
const leftTxt = k => k.r.keepTxt && k.left <= 1 ? k.r.keepTxt : k.left === 1 ? 'Use today' : k.left > 30 ? 'Keeps for months' : `${k.left} days left`;
const missingFor = (r, kit) => (r.needs || []).filter(id => !kit[id]);
const readyDishes = kit => all().filter(r => r.kind === 'dish' && r.needs && r.needs.length && !missingFor(r, kit).length);

// ---------- Momentum: points that fade by 1/7 a day, like every Frequent app ----------
const PTS = { make: 1, newItem: 5, newTwist: 3, reuse: 2, back: 2 };
function pointsFor(r, twist) {
  const prev = entriesFor(r.id); let n = PTS.make; const why = [];
  if (!prev.length) { n += PTS.newItem; why.push(r.kind === 'cap' ? 'new capsule' : 'new dish'); }
  else if (twist && twist !== r.twists?.[0] && !prev.some(e => e.tw === twist)) { n += PTS.newTwist; why.push('new twist'); }
  else if (daysBetween(prev[prev.length - 1].d, ymd()) >= 21) { n += PTS.back; why.push('welcome back'); }
  if (r.kind === 'dish') {
    const kit = kitchen(); const reused = (r.needs || []).concat(r.opt || []).filter(id => kit[id]).slice(0, 3);
    if (reused.length) { n += PTS.reuse * reused.length; why.push(`reused ${reused.length} capsule${reused.length > 1 ? 's' : ''}`); }
  }
  return { n, why: why.join(' · ') };
}
const ptsByDay = () => { const m = {}; for (const e of S.log) m[e.d] = (m[e.d] || 0) + (e.p || 0); return m; };
const moScore = () => { const t = ymd(); let s = 0; for (const [d, n] of Object.entries(ptsByDay())) { const ago = daysBetween(d, t); if (ago >= 0) s += n * Math.pow(6 / 7, ago); } return Math.round(s); };
const paintMo = bump => { $('#moN').textContent = moScore(); if (bump) { const m = $('#mo'); m.classList.remove('bump'); void m.offsetWidth; m.classList.add('bump'); } };

function addLog(r, twist, batch, note) {
  const p = pointsFor(r, twist);
  const e = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), d: ymd(), t: Date.now(), it: r.id, tw: twist || '', b: batch || 1, p: p.n, why: p.why };
  if (note) e.note = note;
  S.log.push(e); save(); paintMo(true);
  toast(`+${p.n} momentum${p.why ? ' · ' + p.why : ''}`, () => { S.log = S.log.filter(x => x.id !== e.id); save(); paintMo(); render(); toast('Removed'); });
  render();
}
const quickLog = r => { const last = lastOf(r.id); addLog(r, last ? last.tw : (r.twists || [''])[0], last ? last.b : 1, ''); };

let toastT = 0;
function toast(t, undo) {
  const el = $('#toast'); $('#toastT').textContent = t; const u = $('#toastU');
  u.hidden = !undo; u.onclick = undo ? () => { el.classList.remove('on'); undo(); } : null;
  el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), undo ? 4500 : 2200);
}

// ---------- The path: one next step at a time ----------
// The next step is the first thing on the path you have not made. Raw salmon waits until you choose it.
function nextStep() {
  const order = RECIPES.filter(r => r.r < 4 || S.raw);
  const untried = order.filter(r => status(r.id) === 'nw');
  if (!untried.length) return null;
  return untried[S.skip % Math.min(untried.length, 2)] || untried[0];
}
function twistPick() {
  const fav = all().filter(r => status(r.id) !== 'nw').sort((a, b) => freqScore(b.id) - freqScore(a.id));
  for (const r of fav) { const done = new Set(entriesFor(r.id).map(e => e.tw)); const tw = (r.twists || []).find(x => !done.has(x)); if (tw) return { r, tw }; }
  return null;
}

// ---------- Small pieces ----------
const KIND = { cap: 'Capsule', dish: 'Dish' };
const main = $('#main');
const show = (...kids) => main.replaceChildren(...kids.flat().filter(k => k != null && k !== false));
function detailOf(r, kit) {
  if (r.kind === 'cap') { const k = kit[r.id]; return k ? `In your kitchen · ${leftTxt(k)}` : `Capsule · keeps ${r.keepTxt ? r.keepTxt.toLowerCase() : r.keep > 30 ? 'for months' : r.keep + ' days'}`; }
  const miss = missingFor(r, kit);
  return miss.length ? `Uses ${(r.needs || []).map(nameOf).join(', ')}` : 'Ready: everything it needs is in your kitchen';
}
function itemRow(r, kit = kitchen()) {
  const st = status(r.id);
  return h('div', { class: 'ex' },
    h('i', { class: 'dot ' + st, title: STATUS_TXT[st], 'aria-label': STATUS_TXT[st] }),
    h('button', { class: 'name', type: 'button', onclick: () => sheet(r) },
      h('b', {}, r.n, h('span', { class: 'kd ' + r.kind, text: KIND[r.kind] })), h('span', { text: detailOf(r, kit) })),
    st === 'nw'
      ? h('button', { class: 'plus newb', type: 'button', 'aria-label': 'Open ' + r.n, onclick: () => sheet(r), text: 'Cook' })
      : h('button', { class: 'plus', type: 'button', 'aria-label': 'Log ' + r.n + ' again', onclick: () => quickLog(r), text: '+ Made' }));
}
const foot = () => h('p', { class: 'foot' }, '© 2026 Daniel Houlis. Frequent™ is a trademark of Daniel Houlis. Food-safety notes follow FDA and USDA guidance; they are not medical advice. ', h('a', { href: '../', text: 'More Frequent apps' }));

// ---------- Today ----------
function today() {
  const t = ymd(); const pd = ptsByDay(); const kit = kitchen();
  const spark = h('div', { class: 'spark', 'aria-label': 'Momentum points, last 14 days' });
  const vals = []; for (let i = 13; i >= 0; i--) vals.push([addDays(t, -i), pd[addDays(t, -i)] || 0]);
  const max = Math.max(6, ...vals.map(v => v[1]));
  for (const [d, n] of vals) spark.append(h('i', { class: (n ? 'has' : '') + (d === t ? ' today' : ''), style: `height:${Math.max(6, n / max * 100)}%`, title: `${niceDay(d)}: ${n}` }));
  const month = t.slice(0, 7);
  const reuseMonth = S.log.filter(e => e.d.startsWith(month) && /reused/.test(e.why || '')).length;
  const firsts = {}; for (const e of S.log) if (!firsts[e.it]) firsts[e.it] = e.d;
  const newMonth = Object.values(firsts).filter(d => d.startsWith(month)).length;
  const mom = h('section', { class: 'mom' },
    h('div', {}, h('div', { class: 'big', text: moScore() }), h('div', { class: 'lbl', text: 'momentum' })), spark,
    h('div', { class: 'facts' },
      h('span', {}, 'Today ', h('b', { text: '+' + (pd[t] || 0) })),
      h('span', {}, 'New this month ', h('b', { text: newMonth })),
      h('span', {}, 'Reuse meals this month ', h('b', { text: reuseMonth }))));

  // One next step
  const nx = nextStep(); let card;
  if (nx) {
    const p = pointsFor(nx, (nx.twists || [])[0]);
    const miss = missingFor(nx, kit);
    const round = ROUNDS[nx.r];
    card = h('section', { class: 'new' },
      h('p', { class: 'k', text: `Next on your path · round ${nx.r + 1} · +${p.n}` }),
      h('h3', { text: nx.n }),
      h('p', { class: 'reg', text: `${KIND[nx.kind]} · about ${nx.time} min · ${round[0]}` }),
      h('p', { class: 'cue', text: nx.why }),
      nx.kind === 'dish' && miss.length ? h('p', { class: 'reg', text: `Not in your kitchen right now: ${miss.map(nameOf).join(', ')}. Make ${miss.length > 1 ? 'them' : 'it'} first for the reuse bonus.` }) : null,
      h('div', { class: 'row' },
        h('button', { class: 'btn green', type: 'button', text: 'Open the recipe', onclick: () => sheet(nx) }),
        h('button', { class: 'btn ghost', type: 'button', text: 'Not today', onclick: () => { S.skip++; save(); today(); } })));
  } else if (!S.raw) {
    card = h('section', { class: 'new' },
      h('p', { class: 'k', text: 'Rounds 1–4 done' }),
      h('h3', { text: 'Ready for raw salmon?' }),
      h('p', { class: 'cue', text: 'Round 5 is optional. It starts with how to buy salmon that is safe to eat raw.' }),
      h('div', { class: 'row' },
        h('button', { class: 'btn green', type: 'button', text: 'Open round 5', onclick: () => { S.raw = true; save(); today(); } }),
        twistPick() && h('button', { class: 'btn ghost', type: 'button', text: 'Try a twist instead', onclick: () => { const tp = twistPick(); sheet(tp.r, tp.tw); } })));
  } else {
    const tp = twistPick();
    card = tp && h('section', { class: 'new' },
      h('p', { class: 'k', text: `Try a new twist · +${PTS.make + PTS.newTwist}` }),
      h('h3', { text: `${tp.r.n}: ${tp.tw}` }),
      h('p', { class: 'reg', text: 'You have cooked the whole path. Change one you know, or add your own dish in Path.' }),
      h('div', { class: 'row' }, h('button', { class: 'btn green', type: 'button', text: 'Open it', onclick: () => sheet(tp.r, tp.tw) })));
  }

  // The kitchen
  const ks = Object.values(kit).sort((a, b) => a.left - b.left);
  const ready = readyDishes(kit);
  const kitBox = ks.length
    ? h('div', { class: 'list' }, ks.map(k => h('div', { class: 'ex' },
        h('i', { class: 'jar' + (k.left <= 1 ? ' soon' : ''), 'aria-hidden': 'true' }),
        h('button', { class: 'name', type: 'button', onclick: () => sheet(k.r) }, h('b', { text: k.r.n }), h('span', { text: `Made ${niceDay(k.e.d).toLowerCase()} · ${leftTxt(k)}` })),
        h('button', { class: 'plus ghostp', type: 'button', text: 'Used up', 'aria-label': `Mark ${k.r.n} used up`, onclick: () => {
          S.used[k.e.id] = 1; save(); render();
          toast(`${k.r.n} marked used up`, () => { delete S.used[k.e.id]; save(); render(); });
        } }))))
    : h('div', { class: 'empty', text: 'Nothing made ahead yet. Capsules you cook land here with the days they keep, and the dishes they unlock show up below.' });
  const readyBox = ready.length ? h('div', { class: 'ready' }, h('span', { class: 'lab', text: 'You can make now' }),
    h('div', { class: 'chips' }, ready.map(r => h('button', { class: 'chip go', type: 'button', text: r.n, onclick: () => sheet(r) })))) : null;

  const fav = all().filter(r => status(r.id) !== 'nw').sort((a, b) => freqScore(b.id) - freqScore(a.id)).slice(0, 6);
  const todays = S.log.filter(e => e.d === t);
  show(mom, card,
    h('h2', { text: 'In your kitchen' }), kitBox, readyBox,
    fav.length ? h('h2', { text: 'Your frequent' }) : null,
    fav.length ? h('div', { class: 'list' }, fav.map(r => itemRow(r, kit))) : null,
    todays.length ? h('h2', { text: `Today · ${todays.length} logged` }) : null,
    todays.length ? entryList(todays.slice().reverse()) : null,
    foot());
}

function entryList(list) {
  return h('div', { class: 'list' }, list.map(e => {
    const r = byId(e.it) || { n: e.it, kind: 'dish' };
    const tag = /^new (capsule|dish)/.test(e.why || '') ? h('span', { class: 'tag n', text: 'New' }) : /new twist/.test(e.why || '') ? h('span', { class: 'tag t', text: 'Twist' }) : /reused/.test(e.why || '') ? h('span', { class: 'tag r', text: 'Reuse' }) : null;
    const extra = [e.tw || '', e.b && e.b !== 1 ? `${fmtQ(e.b)}× batch` : '', e.note || ''].filter(Boolean).join(' · ');
    return h('div', { class: 'ent' },
      h('div', { class: 'what' }, r.n, tag, h('small', { text: KIND[r.kind] + (extra ? ' · ' + extra : '') })),
      h('span', { class: 'pts', text: '+' + (e.p || 0) }),
      h('button', { class: 'x', type: 'button', 'aria-label': 'Remove this entry', text: '×', onclick: () => {
        const keep = e; S.log = S.log.filter(x => x.id !== e.id); save(); paintMo(); render();
        toast('Removed', () => { S.log.push(keep); S.log.sort((a, b) => a.t - b.t); save(); paintMo(); render(); });
      } }));
  }));
}

// ---------- Path ----------
function path() {
  const kit = kitchen();
  const made = RECIPES.filter(r => status(r.id) !== 'nw').length;
  const rounds = ROUNDS.map(([title, sub], i) => {
    const items = RECIPES.filter(r => r.r === i);
    const done = items.filter(r => status(r.id) !== 'nw').length;
    const locked = i === 4 && !S.raw;
    return h('section', { class: 'round' + (done === items.length ? ' done' : '') },
      h('div', { class: 'rh' }, h('span', { class: 'rn', text: i + 1 }), h('div', {}, h('h2', { text: title }), h('p', { class: 'hint', text: `${sub} ${done}/${items.length} made.` }))),
      locked
        ? h('div', { class: 'empty' }, h('p', { style: 'margin:0 0 10px', text: 'Optional round. It starts with how to buy salmon you can safely eat raw.' }), h('button', { class: 'btn', type: 'button', text: 'Show round 5', onclick: () => { S.raw = true; save(); path(); } }))
        : h('div', { class: 'list' }, items.map(r => itemRow(r, kit))));
  });
  const mine = S.custom.length ? h('section', { class: 'round' }, h('div', { class: 'rh' }, h('span', { class: 'rn', text: '+' }), h('div', {}, h('h2', { text: 'Your own' }), h('p', { class: 'hint', text: 'Dishes and capsules you added.' }))), h('div', { class: 'list' }, S.custom.map(r => itemRow(r, kit)))) : null;
  show(
    h('h1', { text: 'Your path' }),
    h('p', { class: 'sub', text: `${made} of ${RECIPES.length} made. Capsules come first in each round; the dishes after them are built from what you made.` }),
    h('div', { class: 'legend' }, h('span', {}, h('i', { class: 'dot nw' }), 'Not made'), h('span', {}, h('i', { class: 'dot tried' }), 'Made'), h('span', {}, h('i', { class: 'dot reg' }), 'Regular (3+ times)')),
    rounds, mine,
    h('div', { style: 'margin-top:18px' }, h('button', { class: 'btn wide', type: 'button', text: '+ Add your own dish or capsule', onclick: addOwn })),
    foot());
}

// ---------- History ----------
function history() {
  if (!S.log.length) { show(h('h1', { text: 'History' }), h('div', { class: 'empty', text: 'Nothing cooked yet. Your meals and capsules will show here, day by day.' }), foot()); return; }
  const t = ymd();
  const byDay = {}; for (const e of S.log) (byDay[e.d] = byDay[e.d] || []).push(e);
  const days = Object.keys(byDay).sort().reverse();
  const cnt = {}; for (const e of S.log) if (daysBetween(e.d, t) < 30) cnt[e.it] = (cnt[e.it] || 0) + 1;
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 8); const mx = top.length ? top[0][1] : 1;
  const dishes30 = S.log.filter(e => daysBetween(e.d, t) < 30 && (byId(e.it) || {}).kind === 'dish');
  const reused = dishes30.filter(e => /reused/.test(e.why || '')).length;
  show(
    h('h1', { text: 'History' }),
    h('p', { class: 'sub', text: `${dishes30.length} dish${dishes30.length === 1 ? '' : 'es'} in the last 30 days` + (dishes30.length ? `, ${reused} of them built on capsules you made ahead.` : '.') }),
    top.length ? h('h2', { text: 'Most made, last 30 days' }) : null,
    top.length ? h('div', { class: 'bars' }, top.map(([id, n]) => h('div', {}, h('span', { text: nameOf(id) }), h('i', { style: `width:${n / mx * 100}%` }), h('em', { text: n })))) : null,
    days.slice(0, 60).map(d => h('div', { class: 'day' }, h('h3', {}, niceDay(d), h('span', { text: '+' + byDay[d].reduce((a, e) => a + (e.p || 0), 0) })), entryList(byDay[d].slice().reverse()))),
    foot());
}

// ---------- Amounts ----------
const FR = [[0, ''], [1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [1 / 2, '½'], [2 / 3, '⅔'], [3 / 4, '¾'], [1, '']];
function fmtQ(q) {
  if (q == null) return '';
  let w = Math.floor(q), f = q - w, best = FR[0];
  for (const c of FR) if (Math.abs(f - c[0]) < Math.abs(f - best[0])) best = c;
  if (best[0] === 1) { w += 1; best = FR[0]; }
  return w === 0 && best[1] ? best[1] : `${w}${best[1]}`;
}
const PLURAL = { cup: 'cups' };
function fmtIng([q, u, what], b) {
  if (q == null) return what;
  const n = q * b; const unit = u ? (n > 1 && PLURAL[u] ? PLURAL[u] : u) + ' ' : '';
  return `${fmtQ(n)} ${unit}${what}`;
}

// ---------- Timers ----------
// Pressure-cook and release steps get a timer. It keeps counting if you close the recipe.
let timers = []; let tick = 0; let actx = null;
function beep() {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.35, 0.7].forEach(off => { const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = 880; g.gain.value = 0.15; o.connect(g); g.connect(actx.destination); o.start(actx.currentTime + off); o.stop(actx.currentTime + off + 0.2); });
  } catch (e) { /* no sound available */ }
  if (navigator.vibrate) navigator.vibrate([300, 150, 300]);
}
function startTimer(min, label) {
  try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume(); } catch (e) { /* fine */ }
  timers.push({ id: Math.random().toString(36).slice(2), label, end: Date.now() + min * 60000, min });
  paintTimers(); if (!tick) tick = setInterval(paintTimers, 1000);
  toast(`${label}: ${min} min started`);
}
function paintTimers() {
  const bar = $('#timers'); const now = Date.now();
  for (const tm of timers) if (!tm.done && tm.end <= now) { tm.done = true; beep(); toast(`${tm.label}: time is up`); }
  document.body.classList.toggle('has-timers', timers.length > 0); document.body.style.setProperty('--nt', timers.length);
  if (!timers.length) { bar.hidden = true; clearInterval(tick); tick = 0; return; }
  bar.hidden = false;
  bar.replaceChildren(...timers.map(tm => {
    const s = Math.max(0, Math.round((tm.end - now) / 1000));
    return h('div', { class: 'tm' + (tm.done ? ' up' : '') },
      h('span', { text: tm.label }), h('b', { text: tm.done ? 'Done' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }),
      h('button', { type: 'button', 'aria-label': 'Dismiss timer', text: '×', onclick: () => { timers = timers.filter(x => x.id !== tm.id); paintTimers(); } }));
  }));
}

// Keep the screen on while a recipe is open, where the browser allows it.
let wake = null;
const wakeOn = async () => { try { if ('wakeLock' in navigator && !wake) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } } catch (e) { wake = null; } };
const wakeOff = () => { try { if (wake) wake.release(); } catch (e) { /* fine */ } wake = null; };

// ---------- Recipe sheet ----------
function closeSheet() { const m = $('.modal'); if (m) { m.remove(); wakeOff(); } }
function sheet(r, presetTwist) {
  closeSheet(); $('#toast').classList.remove('on');
  const kit = kitchen(); const prev = entriesFor(r.id); const last = lastOf(r.id);
  const tw0 = (r.twists || [])[0] || '';
  let twist = presetTwist || (last && last.tw) || tw0, batch = (last && last.b) || 1;
  const done = new Set(prev.map(e => e.tw || tw0));
  const preview = h('div', { class: 'preview', 'aria-live': 'polite' });
  const paintPrev = () => { const p = pointsFor(r, twist); preview.textContent = `+${p.n} momentum${p.why ? ' · ' + p.why : ''}`; };

  // Builds into / built from
  const linkChip = id => { const x = byId(id); if (!x) return null; const k = kit[id];
    return h('button', { class: 'chip' + (k ? ' have' : ''), type: 'button', onclick: () => sheet(x) }, x.n, h('small', { text: x.kind === 'cap' ? (k ? ' · in kitchen' : status(id) === 'nw' ? ' · make first' : ' · make again') : '' })); };
  let links = null;
  if (r.kind === 'cap') {
    const feeds = all().filter(x => (x.needs || []).includes(r.id) || (x.opt || []).includes(r.id));
    if (feeds.length) links = [h('p', { class: 'lab', text: 'Builds into' }), h('div', { class: 'chips' }, feeds.map(x => linkChip(x.id)))];
    if (r.needs && r.needs.length) links = [h('p', { class: 'lab', text: 'Made with' }), h('div', { class: 'chips' }, r.needs.map(linkChip)), ...(links || [])];
  } else {
    links = [h('p', { class: 'lab', text: 'Built from' }), h('div', { class: 'chips' }, (r.needs || []).map(linkChip)),
      r.opt && r.opt.length ? h('p', { class: 'lab', text: 'Even better with' }) : null, r.opt && r.opt.length ? h('div', { class: 'chips' }, r.opt.map(linkChip)) : null];
  }

  const ingBox = h('ul', { class: 'ing' });
  const paintIng = () => ingBox.replaceChildren(...(r.ing || []).map(i => h('li', { text: Array.isArray(i) ? fmtIng(i, batch) : i })));
  const batchBox = r.scale ? h('div', { class: 'chips', role: 'group', 'aria-label': 'Batch size' }) : null;
  const paintBatch = () => batchBox && batchBox.replaceChildren(...[0.5, 1, 2, 3].map(b => h('button', { class: 'chip' + (b === batch ? ' on' : ''), type: 'button', 'aria-pressed': String(b === batch), text: `${fmtQ(b)}×`, onclick: () => { batch = b; paintBatch(); paintIng(); } })));

  const steps = h('ol', { class: 'steps-l' }, (r.steps || []).map(s => {
    const x = typeof s === 'string' ? { x: s } : s;
    return h('li', {}, h('span', { text: x.x }), x.t ? h('button', { class: 'tbtn', type: 'button', text: `Start ${x.t} min timer`, onclick: () => startTimer(x.t, x.tl || r.n) }) : null);
  }));

  const twistBox = h('div', { class: 'chips', role: 'group', 'aria-label': 'Twist' });
  const paintTwists = () => twistBox.replaceChildren(...[...new Set((r.twists || []).concat([...done].filter(Boolean)))].map(tw => h('button', {
    class: 'chip' + (tw === twist ? ' on' : '') + (prev.length && !done.has(tw) ? ' isnew' : ''), type: 'button', 'aria-pressed': String(tw === twist), text: tw,
    onclick: () => { twist = tw; paintTwists(); paintPrev(); } })));
  const note = h('input', { class: 'inp', type: 'text', placeholder: 'Note (what you would change next time)', 'aria-label': 'Note' });
  const custom = h('input', { class: 'inp', type: 'text', placeholder: 'Name your own twist', 'aria-label': 'Your own twist' });
  custom.addEventListener('change', () => { const x = custom.value.trim(); if (x) { twist = x; done.add(x); custom.value = ''; paintTwists(); paintPrev(); } });

  const meta = [r.time ? `About ${r.time} min` : '', r.yields || '', r.kind === 'cap' ? `Keeps: ${r.keepTxt || (r.keep > 30 ? 'months' : r.keep + ' days')}` : ''].filter(Boolean).join(' · ');
  paintIng(); paintBatch(); paintTwists(); paintPrev();
  const box = h('div', { role: 'dialog', 'aria-modal': 'true', 'aria-label': r.n },
    h('div', { class: 'sh-h' }, h('div', { style: 'flex:1' }, h('p', { class: 'kk', text: `${KIND[r.kind]}${r.r != null ? ' · round ' + (r.r + 1) : ''}` }), h('h2', { text: r.n })), h('button', { class: 'close', type: 'button', 'aria-label': 'Close', text: '×', onclick: closeSheet })),
    h('p', { class: 'sh-cue', text: r.why || '' }),
    meta ? h('p', { class: 'meta', text: meta }) : null,
    last ? h('p', { class: 'sh-last', text: `Last made ${niceDay(last.d).toLowerCase()}${last.tw ? ' · ' + last.tw : ''}. Made ${timesMade(r.id)} time${timesMade(r.id) === 1 ? '' : 's'}.${last.note ? ' Your note: ' + last.note : ''}` }) : null,
    links,
    r.ing && r.ing.length ? h('div', { class: 'lab-row' }, h('p', { class: 'lab', text: 'You need' }), batchBox) : null,
    r.ing && r.ing.length ? ingBox : null,
    r.steps && r.steps.length ? h('p', { class: 'lab', text: 'Steps' }) : null, steps,
    r.tips && r.tips.length ? h('details', { class: 'more' }, h('summary', { text: 'Tips and food safety' }), h('ul', { class: 'tips' }, r.tips.map(t => h('li', { text: t }))),
      r.src && r.src.length ? h('p', { class: 'src' }, 'Sources: ', r.src.map(([l, u], i) => [i ? '; ' : '', h('a', { href: u, target: '_blank', rel: 'noopener', text: l })])) : null) : null,
    (r.twists && r.twists.length) || prev.length ? h('p', { class: 'lab', text: 'Twist' }) : null, twistBox,
    h('details', { class: 'more' }, h('summary', { text: 'Note, your own twist' }), h('p', { class: 'lab', text: 'Note' }), note, h('p', { class: 'lab', text: 'Your own twist' }), custom,
      S.custom.some(x => x.id === r.id) ? h('button', { class: 'btn ghost', type: 'button', style: 'margin-top:12px;color:var(--red)', text: 'Delete this from your path', onclick: () => { S.custom = S.custom.filter(x => x.id !== r.id); save(); closeSheet(); render(); toast('Deleted. Your log entries stay.'); } }) : null),
    preview,
    h('button', { class: 'btn go wide', type: 'button', text: r.id === 'rawsalmon' ? 'I bought it' : 'I made it', onclick: () => { closeSheet(); addLog(r, twist, batch, note.value.trim()); } }));
  const wrap = h('div', { class: 'modal', onclick: e => { if (e.target === wrap) closeSheet(); } }, box);
  document.body.append(wrap); wakeOn();
  setTimeout(() => box.querySelector('.close').focus({ preventScroll: true }), 30);
}

// ---------- Your own dish or capsule ----------
function addOwn() {
  closeSheet();
  let kind = 'dish', keep = 4; const uses = new Set();
  const name = h('input', { class: 'inp', type: 'text', placeholder: 'e.g. Miso salmon noodle soup', 'aria-label': 'Name' });
  const why = h('input', { class: 'inp', type: 'text', placeholder: 'What it is, or a cue to remember (optional)', 'aria-label': 'Description' });
  const stepsIn = h('textarea', { class: 'inp', rows: '4', placeholder: 'Steps, one per line (optional)', 'aria-label': 'Steps' });
  const kBox = h('div', { class: 'chips' }); const uBox = h('div', { class: 'chips' }); const keepBox = h('div', { class: 'chips' });
  const caps = all().filter(r => r.kind === 'cap');
  const paint = () => {
    kBox.replaceChildren(...[['dish', 'Dish'], ['cap', 'Capsule (made ahead)']].map(([id, l]) => h('button', { class: 'chip' + (kind === id ? ' on' : ''), type: 'button', text: l, onclick: () => { kind = id; paint(); } })));
    uBox.replaceChildren(...caps.map(c => h('button', { class: 'chip' + (uses.has(c.id) ? ' on' : ''), type: 'button', text: c.n, onclick: () => { uses.has(c.id) ? uses.delete(c.id) : uses.add(c.id); paint(); } })));
    keepBox.replaceChildren(...[1, 3, 4, 7, 14].map(d => h('button', { class: 'chip' + (keep === d ? ' on' : ''), type: 'button', text: d === 1 ? 'Same day' : d + ' days', onclick: () => { keep = d; paint(); } })));
    keepWrap.hidden = kind !== 'cap';
  };
  const keepWrap = h('div', {}, h('p', { class: 'lab', text: 'Keeps in the fridge' }), keepBox);
  const err = h('p', { class: 'hint', style: 'color:var(--red)' });
  const box = h('div', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Add your own' },
    h('div', { class: 'sh-h' }, h('h2', { text: 'Add your own' }), h('button', { class: 'close', type: 'button', 'aria-label': 'Close', text: '×', onclick: closeSheet })),
    h('p', { class: 'lab', text: 'Name' }), name,
    h('p', { class: 'lab', text: 'It is a' }), kBox, keepWrap,
    h('p', { class: 'lab', text: 'Built from these capsules' }), uBox,
    h('p', { class: 'lab', text: 'Description' }), why,
    h('p', { class: 'lab', text: 'Steps' }), stepsIn, err,
    h('div', { style: 'margin-top:16px' }, h('button', { class: 'btn go wide', type: 'button', text: 'Add it', onclick: () => {
      const n = name.value.trim(); if (!n) { err.textContent = 'Give it a name first.'; name.focus(); return; }
      if (all().some(r => r.n.toLowerCase() === n.toLowerCase())) { err.textContent = 'That one is already on your path.'; return; }
      const r = { id: 'my-' + Date.now().toString(36), n, kind, needs: [...uses], keep, why: why.value.trim(), steps: stepsIn.value.split('\n').map(s => s.trim()).filter(Boolean), twists: [], ing: [] };
      S.custom.push(r); save(); closeSheet(); render(); sheet(r);
    } })));
  const wrap = h('div', { class: 'modal', onclick: e => { if (e.target === wrap) closeSheet(); } }, box);
  document.body.append(wrap); paint(); name.focus();
}

// ---------- Backup, restore, Obsidian ----------
function download(name, text, type) {
  const a = h('a', { href: URL.createObjectURL(new Blob([text], { type })), download: name });
  document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
const backup = () => download(`frequent-cooking-${ymd()}.json`, JSON.stringify(S, null, 1), 'application/json');
function restore(file) {
  file.text().then(t => JSON.parse(t)).then(b => {
    if (!b || !Array.isArray(b.log)) throw 0;
    const ids = new Set(S.log.map(e => e.id)); for (const e of b.log) if (e && e.id && !ids.has(e.id)) S.log.push(e);
    S.log.sort((a, c) => a.t - c.t);
    const cids = new Set(S.custom.map(e => e.id)); for (const e of b.custom || []) if (!cids.has(e.id)) S.custom.push(e);
    Object.assign(S.used, b.used || {}); if (b.raw) S.raw = true;
    save(); paintMo(); render(); toast('Backup added. Nothing was erased.');
  }).catch(() => toast('That file is not a Frequent Cooking backup.'));
}
function obsidian() {
  let md = `# Frequent Cooking\n\nExported ${ymd()}.\n\n## Capsule map\n\n`;
  for (const r of all().filter(x => x.kind === 'dish')) md += `- [[${r.n}]] ← ${(r.needs || []).map(id => `[[${nameOf(id)}]]`).join(' + ')}${r.opt && r.opt.length ? ' (better with ' + r.opt.map(id => `[[${nameOf(id)}]]`).join(', ') + ')' : ''}\n`;
  const byDay = {}; for (const e of S.log) (byDay[e.d] = byDay[e.d] || []).push(e);
  if (S.log.length) md += `\n## Log\n`;
  for (const d of Object.keys(byDay).sort().reverse()) {
    md += `\n### ${d}\n\n`;
    for (const e of byDay[d]) {
      const r = byId(e.it) || { n: e.it, kind: 'dish' };
      const bits = [e.tw || '', e.b && e.b !== 1 ? `${fmtQ(e.b)}× batch` : '', e.note || ''].filter(Boolean).join(' · ');
      md += `- [[${r.n}]] ${bits} #${r.kind === 'cap' ? 'capsule' : 'dish'}${/reused/.test(e.why || '') ? ' #reuse' : ''}\n`;
    }
  }
  download(`Frequent Cooking ${ymd()}.md`, md, 'text/markdown');
}
function about() {
  closeSheet();
  const box = h('div', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'How it works' },
    h('div', { class: 'sh-h' }, h('h2', { text: 'How it works' }), h('button', { class: 'close', type: 'button', 'aria-label': 'Close', text: '×', onclick: closeSheet })),
    h('p', { text: 'Capsules are things you make ahead: rice, sauces, cooked salmon, cut vegetables. When you log one, it goes into your kitchen for as many days as it keeps. Dishes are meals built from capsules.' }),
    h('p', { text: `Every log is +${PTS.make}. Making something for the first time is +${PTS.make + PTS.newItem}. A twist you have never tried is +${PTS.make + PTS.newTwist}. A dish earns +${PTS.reuse} for each capsule it uses from your kitchen, up to three.` }),
    h('p', { text: 'Momentum fades by a seventh each day. It never goes negative, and one good meal brings it back.' }),
    h('p', { class: 'hint', text: 'Instant Pot clones label buttons differently. Pressure Cook, Manual and Pressure all mean the same thing: cook at high pressure for the time you set.' }),
    h('div', { style: 'margin-top:14px' }, h('button', { class: 'btn go wide', type: 'button', text: 'Got it', onclick: closeSheet })));
  const wrap = h('div', { class: 'modal', onclick: e => { if (e.target === wrap) closeSheet(); } }, box);
  document.body.append(wrap);
}

// ---------- Tabs ----------
let tab = 'today';
const VIEWS = { today, path, history };
const render = () => VIEWS[tab]();
function go(t) { tab = t; document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t)); render(); }
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { go(b.dataset.tab); scrollTo(0, 0); });
$('#menuB').onclick = e => { e.stopPropagation(); $('#menu').hidden = !$('#menu').hidden; };
document.addEventListener('click', e => { if (!e.target.closest('#menu')) $('#menu').hidden = true; });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
$('#menu').addEventListener('click', e => { const a = e.target.dataset.act; if (a === 'backup') backup(); if (a === 'about') about(); if (a === 'obsidian') obsidian(); if (a) $('#menu').hidden = true; });
$('#restore').onchange = e => { const f = e.target.files[0]; if (f) restore(f); e.target.value = ''; $('#menu').hidden = true; };
$('#mo').onclick = () => toast(`Momentum ${moScore()} · today +${ptsByDay()[ymd()] || 0}. Reuse a capsule for a bonus.`);
let shownDay = ymd();
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  if (ymd() !== shownDay) { shownDay = ymd(); paintMo(); render(); }
  if ($('.modal')) wakeOn(); paintTimers();
});

paintMo(); go('today');
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
