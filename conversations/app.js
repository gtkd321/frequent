// Frequent Conversations. © 2026 Daniel Houlis. All rights reserved. Frequent is a trademark of Daniel Houlis.
// Practice an opener, get the reply most people give, pick your next line, and land it.
// Everything lives in this browser (localStorage "fcv"). Updates only add to it; nothing is ever wiped.
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const h = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
};

// ---------- Storage ----------
const KEY = 'fcv';
const blank = () => ({ reps: {}, best: {}, last: {}, real: {}, total: 0, bestTotal: 0 });
let S;
try { S = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { S = blank(); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };

const BY_ID = Object.fromEntries(SCRIPTS.map(s => [s.id, s]));
const KIND = { typical: 'Most common reply', warm: 'Warm reply', cold: 'Cold reply' };
const RANK = { best: 'Best move', ok: 'Workable', miss: 'Stalls it' };

// Odds: your real tries once you have 5 for this script; the written estimate before that.
function odds(sc) {
  const r = S.real[sc.id] || {};
  const n = (r.typical || 0) + (r.warm || 0) + (r.cold || 0);
  if (n >= 5) return { real: true, n, p: Object.fromEntries(sc.replies.map(x => [x.kind, (r[x.kind] || 0) / n * 100])), c: r };
  return { real: false, n, p: Object.fromEntries(sc.replies.map(x => [x.kind, x.p])) };
}
function draw(sc) {
  const o = odds(sc); let t = Math.random() * 100, acc = 0;
  for (const r of sc.replies) { acc += o.p[r.kind]; if (t < acc) return r; }
  return sc.replies[0];
}
function oddsText(sc, kind) {
  const o = odds(sc);
  if (o.real) return `${o.c[kind] || 0} of your ${o.n} real tries`;
  return `about ${o.p[kind]}% of people (estimate)`;
}

// Today's script: alternate dating and sales; new ones first, then the one you practiced longest ago.
function order() {
  const d = SCRIPTS.filter(s => s.track === 'dating'), s = SCRIPTS.filter(s => s.track === 'sales'), out = [];
  for (let i = 0; i < Math.max(d.length, s.length); i++) { if (d[i]) out.push(d[i]); if (s[i]) out.push(s[i]); }
  return out;
}
function pickToday(skip) {
  const list = order().filter(s => s.id !== skip);
  const fresh = list.find(s => !S.reps[s.id]);
  if (fresh) return fresh;
  return list.slice().sort((a, b) => (S.last[a.id] || 0) - (S.last[b.id] || 0))[0];
}

// ---------- UI ----------
const main = $('#main');
let tab = 'today', current = null, from = 'today';

function setTab(t) {
  tab = t; current = null;
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  render(); main.focus({ preventScroll: true }); scrollTo(0, 0);
}
document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));

function updatePill() { $('#repN').textContent = S.total; }

function render() {
  updatePill();
  main.replaceChildren();
  if (tab === 'today') return renderPractice(current || pickToday(), true);
  if (tab === 'scripts') return current ? renderPractice(current, false) : renderScripts();
  if (tab === 'experts') return renderExperts();
}

function bubble(who, text, extra) {
  return h('div', { class: 'msg ' + who }, extra ? h('p', { class: 'meta' }, extra) : null, h('p', { class: 'say' }, text));
}
function expertTag(id) { const e = EXPERTS[id]; return e ? h('button', { class: 'who', onclick: () => openExpert(id) }, e.name) : null; }

function renderPractice(sc, isToday) {
  current = sc;
  const wrap = h('section', { class: 'card track-' + sc.track });
  const head = h('div', { class: 'card-h' },
    isToday ? null : h('button', { class: 'back', onclick: () => { current = null; render(); }, 'aria-label': 'Back to scripts' }, '\u2190'),
    h('p', { class: 'k' }, (isToday ? 'Today \u00b7 ' : '') + (sc.track === 'dating' ? 'Dating' : 'Sales')));
  const convo = h('div', { class: 'convo', 'aria-live': 'polite' });
  const actions = h('div', { class: 'actions' });
  wrap.append(head, h('h1', {}, sc.title), h('p', { class: 'scene' }, sc.scene), convo, actions);
  main.append(wrap);

  // Step 1: the opener
  convo.append(h('p', { class: 'tone' }, h('b', {}, 'Tone '), sc.tone));
  convo.append(bubble('you', sc.opener, 'You open'));
  const go = h('button', { class: 'btn go wide', onclick: () => step2() }, 'Say it');
  actions.replaceChildren(go);

  function step2() {
    const r = draw(sc);
    convo.append(bubble('them', r.say, `${KIND[r.kind]} \u00b7 ${oddsText(sc, r.kind)}`));
    const moves = r.moves.slice().sort(() => Math.random() - .5);
    const box = h('div', { class: 'moves' }, h('p', { class: 'lab' }, 'Your move'));
    moves.forEach(m => box.append(h('button', { class: 'move', onclick: () => step3(r, m, box) }, m.t)));
    actions.replaceChildren(box);
    box.querySelector('.move').focus({ preventScroll: true });
    box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function step3(r, m, box) {
    const best = r.moves.find(x => x.r === 'best');
    convo.append(bubble('you', m.t, 'You'));
    const fb = h('div', { class: 'fb ' + m.r },
      h('p', { class: 'fb-h' }, RANK[m.r]),
      h('p', {}, m.why, ' ', expertTag(m.by)));
    if (m.r !== 'best') fb.append(h('p', { class: 'fb-best' }, h('b', {}, 'Best move: '), best.t), h('p', { class: 'hint' }, best.why, ' ', expertTag(best.by)));
    convo.append(fb);
    if (m.r !== 'best') convo.append(h('p', { class: 'replay' }, 'With the best move, it goes like this'));
    convo.append(bubble('them', r.then, 'Then they say'));
    convo.append(bubble('you land', r.close, 'You land it'));

    if (sc.loop) {
      const L = sc.loop;
      convo.append(h('div', { class: 'loop' },
        h('p', { class: 'loop-h' }, 'Open a curiosity loop ', expertTag('loewenstein')),
        bubble('you', L.plant, 'Before you go'),
        bubble('them', L.react, 'They say'),
        h('p', { class: 'loop-c' }, h('b', {}, 'Close it: '), L.close)));
    }
    S.reps[sc.id] = (S.reps[sc.id] || 0) + 1; S.total++; S.last[sc.id] = Date.now();
    if (m.r === 'best') { S.best[sc.id] = (S.best[sc.id] || 0) + 1; S.bestTotal++; }
    save(); updatePill(); const f = $('.foot', main); if (f) f.textContent = footText(); $('#rep').classList.remove('bump'); void $('#rep').offsetWidth; $('#rep').classList.add('bump');

    const real = h('div', { class: 'real' },
      h('p', { class: 'lab' }, 'Tried it for real? How did they reply?'),
      h('div', { class: 'row' }, ...['typical', 'warm', 'cold'].map(k => h('button', { class: 'chip', onclick: e => logReal(sc, k, e.currentTarget) }, k === 'typical' ? 'Like most' : k === 'warm' ? 'Warm' : 'Cold'))));
    const next = h('div', { class: 'row end' },
      h('button', { class: 'btn', onclick: () => { current = sc; render(); } }, 'Run it again'),
      isToday ? h('button', { class: 'btn go', onclick: () => { current = pickToday(sc.id); render(); scrollTo(0, 0); } }, 'Next script') : null);
    actions.replaceChildren(next, real);
    fb.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  if (isToday) main.append(h('p', { class: 'foot' }, footText()));
}

const footText = () => `${S.total} rep${S.total === 1 ? '' : 's'} \u00b7 ${S.bestTotal} best move${S.bestTotal === 1 ? '' : 's'}`;

function logReal(sc, kind, btn) {
  const r = S.real[sc.id] || (S.real[sc.id] = {});
  r[kind] = (r[kind] || 0) + 1; save();
  const n = (r.typical || 0) + (r.warm || 0) + (r.cold || 0);
  btn.parentElement.querySelectorAll('.chip').forEach(c => c.disabled = true);
  btn.classList.add('on');
  toast(n >= 5 ? `Logged. This script now uses your ${n} real tries.` : `Logged. ${5 - n} more and this script uses your real numbers.`);
}

function renderScripts() {
  main.append(h('h1', {}, 'Scripts'));
  for (const [track, label] of [['dating', 'Dating'], ['sales', 'Sales']]) {
    main.append(h('p', { class: 'group' }, label));
    const list = h('div', { class: 'list' });
    for (const sc of SCRIPTS.filter(s => s.track === track)) {
      const n = S.reps[sc.id] || 0, o = odds(sc);
      const stat = n ? `${n} rep${n > 1 ? 's' : ''}` + (o.n ? ` \u00b7 ${o.n} real` : '') : 'New';
      list.append(h('button', { class: 'row-b', onclick: () => { current = sc; render(); scrollTo(0, 0); } },
        h('span', { class: 'dot ' + track }), h('span', { class: 'name' }, h('b', {}, sc.title), h('span', {}, sc.opener)), h('em', {}, stat)));
    }
    main.append(list);
  }
}

function renderExperts() {
  main.append(h('h1', {}, 'The experts'));
  main.append(h('p', { class: 'sub' }, 'Every move is graded by one of these ideas. Tap a name anywhere to see it.'));
  const list = h('div', { class: 'experts' });
  for (const [id, e] of Object.entries(EXPERTS)) {
    const uses = SCRIPTS.reduce((n, s) => n + s.replies.reduce((m, r) => m + r.moves.filter(x => x.by === id).length, 0), 0) + (id === 'loewenstein' ? SCRIPTS.filter(s => s.loop).length : 0);
    list.append(h('article', { class: 'ex-card' },
      h('h2', {}, e.name), h('p', { class: 'role' }, e.role), h('p', {}, e.idea),
      h('p', { class: 'links' }, ...e.links.map(([t, u]) => h('a', { href: u, target: '_blank', rel: 'noopener' }, t))),
      h('p', { class: 'hint' }, id === 'loewenstein' ? `Shapes ${uses} curiosity loops` : `Grades ${uses} moves`)));
  }
  main.append(list);
  main.append(h('p', { class: 'foot' }, 'Reply odds are estimates written from these ideas, not measured rates. Log your real tries and each script switches to your own numbers after five.'));
}

function openExpert(id) {
  const e = EXPERTS[id];
  const m = h('div', { class: 'modal', onclick: ev => { if (ev.target === m) m.remove(); } },
    h('div', { role: 'dialog', 'aria-modal': 'true', 'aria-label': e.name },
      h('div', { class: 'sh-h' }, h('h2', {}, e.name), h('button', { class: 'close', 'aria-label': 'Close', onclick: () => m.remove() }, '\u00d7')),
      h('p', { class: 'role' }, e.role), h('p', {}, e.idea),
      h('p', { class: 'links' }, ...e.links.map(([t, u]) => h('a', { href: u, target: '_blank', rel: 'noopener' }, t)))));
  document.body.append(m); m.querySelector('.close').focus();
  const esc = ev => { if (ev.key === 'Escape') { m.remove(); removeEventListener('keydown', esc); } };
  addEventListener('keydown', esc);
}

let tt;
function toast(t) { const el = $('#toast'); $('#toastT').textContent = t; el.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('on'), 2600); }

render();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
