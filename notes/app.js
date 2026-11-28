// Frequent Notes. © 2026 Daniel Ilias Houlis. All rights reserved. Frequent is a trademark of Daniel Ilias Houlis.
// One inbox for everything you capture: typed here, texted to MindChuk, or written on a reMarkable or
// Rocketbook page. Each inbox card becomes a note or joins today's daily note. Notes link with [[Title]],
// tags use #tag, and any line ending in ? comes back for review on a growing schedule.
// Everything lives in this browser (localStorage "fnt"). Updates only add to it; nothing is ever wiped.
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
const niceDay = d => { const t = ymd(); if (d === t) return 'Today'; if (d === addDays(t, -1)) return 'Yesterday'; return new Date(d + 'T12:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: daysBetween(d, t) > 300 ? 'numeric' : undefined }); };
const hm = () => new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const low = s => String(s).trim().toLowerCase();

// ---------- Rules ----------
const STEPS = [1, 3, 7, 14, 30, 60, 120]; // days until a review line comes back
const SRC = { typed: 'Typed', mindchuk: 'MindChuk', paper: 'Paper', file: 'File' };

// Handwriting recognition makes the same few mistakes. Fix them before reading the symbols.
const tidy = t => String(t || '').replace(/\r\n?/g, '\n').split('\n').map(l => l
  .replace(/^\s*[•·*●▪]\s*/, '- ')
  .replace(/[☐□▢]\s*/g, '[ ] ').replace(/[☑☒✓✔]\s*/g, '[x] ')
  .replace(/\[\s?\]/g, '[ ]').replace(/\[\s*[xX]\s*\]/g, '[x]')
  .replace(/\[\s+\[/g, '[[').replace(/\]\s+\]/g, ']]')
  .replace(/\s+\?$/, '?')
  .replace(/\s+$/, '')).join('\n').replace(/\n{3,}/g, '\n\n').trim();
const TAG_RE = /(^|[\s(])#([\p{L}\p{N}_-]*\p{L}[\p{L}\p{N}_-]*)/gu;
const tagsOf = t => [...new Set([...String(t).matchAll(TAG_RE)].map(m => m[2].toLowerCase()))];
const linksOf = t => [...new Set([...String(t).matchAll(/\[\[([^\]\n]+)\]\]/g)].map(m => m[1].trim()))];
const isQ = l => /\?$/.test(l.trim()) && l.replace(/[-#?\s\[\]x]/g, '').length > 2;
const qText = l => l.trim().replace(/^(#+\s+|-\s+(\[[ x]\]\s+)?|\[[ x]\]\s+|>\s+)/, '');
const titleOf = t => { const ls = String(t).split('\n').map(l => l.trim()).filter(Boolean); const hd = ls.find(l => /^#+\s/.test(l));
  const s = (hd || ls[0] || 'Untitled').replace(/^#+\s+|^-\s+(\[[ x]\]\s+)?/, '').replace(/\[\[|\]\]/g, '').replace(TAG_RE, '$1').trim();
  return (s.length > 60 ? s.slice(0, 57).trim() + '…' : s) || 'Untitled'; };

// ---------- State ----------
const KEY = 'fnt';
const blank = () => ({ v: 1, inbox: [], notes: [], cards: [], cleared: [] });
let S = blank();
try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && typeof s === 'object') S = Object.assign(blank(), s); } catch (e) { /* keep old text untouched */ }
let saveT; const save = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Could not save in this browser. Save a backup file from the menu.'); } }, 100); };

const noteById = id => S.notes.find(n => n.id === id);
const noteByTitle = t => S.notes.find(n => low(n.title) === low(t));
const dailyTitle = (d = ymd()) => d;
const backlinks = n => S.notes.filter(o => o.id !== n.id && linksOf(o.body).some(l => low(l) === low(n.title)));
const dueCards = () => { const t = ymd(); return S.cards.filter(c => c.due <= t && noteById(c.note)); };

function newNote(title, body = '') {
  const n = { id: uid(), title: title || 'Untitled', body, made: ymd(), upd: Date.now(), seen: ymd() };
  S.notes.push(n); syncCards(n); return n;
}
// Every "?" line in a note gets one review card. Edits keep the schedule of lines that stay the same.
function syncCards(n) {
  const qs = [...new Set(n.body.split('\n').filter(isQ).map(qText))];
  const mine = S.cards.filter(c => c.note === n.id);
  for (const c of mine) if (!qs.includes(c.q)) S.cards.splice(S.cards.indexOf(c), 1);
  for (const q of qs) if (!mine.some(c => c.q === q)) S.cards.push({ id: uid(), note: n.id, q, step: 0, due: addDays(ymd(), 1) });
}
function ensureNote(title) { return noteByTitle(title) || newNote(title.trim(), ''); }
function appendDaily(text, src) {
  const n = ensureNote(dailyTitle());
  const stamp = `- ${hm()}${src && src !== 'typed' ? ' · ' + SRC[src] : ''}`;
  n.body = (n.body ? n.body.replace(/\s+$/, '') + '\n\n' : '') + stamp + '\n' + text;
  n.upd = Date.now(); syncCards(n); return n;
}
function capture(text, src = 'typed', d = ymd()) {
  const t = tidy(text); if (!t) return null;
  const it = { id: uid(), t, src, d }; S.inbox.unshift(it); return it;
}

// ---------- UI shell ----------
let tab = 'today', view = null, q = '';
const paintTop = () => {
  $('#moN').textContent = S.inbox.length;
  const d = dueCards().length, b = $('#dueN'); b.hidden = !d; b.textContent = d;
};
let toastT, undoFn;
function toast(msg, undo) {
  $('#toastT').textContent = msg; undoFn = undo; $('#toastU').hidden = !undo;
  const t = $('#toast'); t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), undo ? 5000 : 2600);
}
$('#toastU').onclick = () => { if (undoFn) undoFn(); undoFn = null; $('#toast').classList.remove('on'); };
const snap = () => JSON.stringify(S);
const undoTo = s => () => { S = JSON.parse(s); save(); render(); };

function go(t, v = null) { tab = t; view = v; document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t)); render(); window.scrollTo(0, 0); }
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => go(b.dataset.tab));
$('#mo').onclick = () => { go('today'); setTimeout(() => $('#inbox')?.scrollIntoView({ behavior: 'smooth' }), 30); };
$('#menuB').onclick = e => { e.stopPropagation(); $('#menu').hidden = !$('#menu').hidden; };
document.addEventListener('click', e => { if (!$('#menu').hidden && !e.target.closest('#menu')) $('#menu').hidden = true; });
$('#menu').addEventListener('click', e => { const a = e.target.closest('button')?.dataset.act; if (!a) return; $('#menu').hidden = true;
  ({ symbols: symbolsSheet, template: downloadTemplate, obsidian: exportObsidian, backup: saveBackup })[a]?.(); });

function render() {
  paintTop();
  const m = $('#main'); m.replaceChildren();
  if (tab === 'today') today(m);
  else if (tab === 'notes') view ? noteView(m, view) : notesList(m);
  else review(m);
  m.append(h('p', { class: 'foot' }, '© 2026 Daniel Ilias Houlis. Your notes stay on this device. ', h('a', { href: '../' }, 'More Frequent apps')));
}

// ---------- Today ----------
function today(m) {
  const t = ymd();
  m.append(h('h1', { text: new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) }));
  // Capture
  const ta = h('textarea', { class: 'cap', rows: 2, placeholder: 'An idea, a link, a [[Note]]… end with ? to review it', 'aria-label': 'Capture an idea' });
  const add = () => { if (!ta.value.trim()) return ta.focus(); capture(ta.value); ta.value = ''; save(); render(); toast('In your inbox'); $('.cap')?.focus(); };
  ta.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); add(); } });
  m.append(h('div', { class: 'capbox' }, ta, h('div', { class: 'row' },
    h('button', { class: 'btn go', onclick: add }, 'Add'),
    h('button', { class: 'btn', onclick: bringIn }, 'Bring in'),
    h('span', { class: 'hint grow' }), h('button', { class: 'btn ghost', onclick: symbolsSheet, 'aria-label': 'Handwriting symbols' }, '# - [ ] ?'))));

  // Review nudge
  const due = dueCards().length;
  if (due) m.append(h('button', { class: 'nudge', onclick: () => go('review') }, h('b', {}, `${due} to review`), h('span', {}, 'A minute or two →')));

  // Inbox
  m.append(h('h2', { id: 'inbox' }, 'Inbox ', S.inbox.length ? h('span', { class: 'n' }, S.inbox.length) : null));
  if (!S.inbox.length) m.append(h('div', { class: 'empty' }, 'Inbox clear.', h('br'), h('span', { class: 'hint' }, 'Type above, or bring in MindChuk texts and handwritten pages.')));
  else {
    if (S.inbox.length > 1) m.append(h('div', { class: 'row end' }, h('button', { class: 'btn ghost sm', onclick: () => { const s = snap(); const n = S.inbox.length; [...S.inbox].reverse().forEach(it => appendDaily(it.t, it.src)); S.cleared.push(...S.inbox.map(i => i.id)); S.inbox = []; save(); render(); toast(`${n} added to today’s note`, undoTo(s)); } }, 'All to today’s note')));
    for (const it of S.inbox) m.append(inboxCard(it));
  }

  // Resurface
  const old = resurface(t);
  if (old.length) {
    m.append(h('h2', {}, 'From your notes'));
    const l = h('div', { class: 'list' });
    for (const n of old) l.append(h('button', { class: 'nrow', onclick: () => go('notes', n.id) },
      h('b', {}, n.title), h('span', {}, `${niceDay(n.seen)} · ${preview(n.body) || 'Empty'}`)));
    m.append(l);
  }
}
// Three notes you have not opened in a while, the same three all day.
function resurface(t) {
  const pool = S.notes.filter(n => n.title !== dailyTitle(t) && n.body.trim() && daysBetween(n.seen, t) >= 3);
  pool.sort((a, b) => a.seen.localeCompare(b.seen) || a.id.localeCompare(b.id));
  return pool.slice(0, 3);
}
const preview = b => b.split('\n').map(l => l.replace(/^#+\s+|^-\s+(\[[ x]\]\s+)?|^>\s+/, '').replace(/\[\[|\]\]/g, '').trim()).filter(Boolean).slice(0, 2).join(' · ').slice(0, 120);

function inboxCard(it) {
  const qs = it.t.split('\n').filter(isQ).length;
  const card = h('article', { class: 'ib' },
    h('div', { class: 'ib-h' }, h('span', { class: 'src s-' + it.src }, SRC[it.src] || 'Typed'), h('span', { class: 'hint' }, niceDay(it.d)),
      qs ? h('span', { class: 'qpill' }, `${qs} to review`) : null),
    h('div', { class: 'md' }, md(it.t, { inert: true })));
  const edit = () => {
    const ta = h('textarea', { class: 'inp', rows: Math.min(14, it.t.split('\n').length + 2) }); ta.value = it.t;
    card.querySelector('.md').replaceWith(ta); ta.focus();
    ta.addEventListener('blur', () => { it.t = tidy(ta.value) || it.t; save(); render(); });
  };
  card.querySelector('.md').addEventListener('click', edit);
  const done = (msg, fn) => { const s = snap(); fn(); S.inbox = S.inbox.filter(x => x.id !== it.id); S.cleared.push(it.id); save(); render(); toast(msg, undoTo(s)); };
  card.append(h('div', { class: 'row acts' },
    h('button', { class: 'btn go', onclick: () => done('Added to today’s note', () => appendDaily(it.t, it.src)) }, 'Today’s note'),
    h('button', { class: 'btn', onclick: () => { let n; done('Saved as a note', () => { n = existingOrNew(it); }); } }, 'New note'),
    h('button', { class: 'btn ghost', onclick: () => done('Cleared', () => {}) }, 'Clear')));
  return card;
}
// If a card starts with a heading that matches a note, add to that note instead of making a twin.
function existingOrNew(it) {
  const title = titleOf(it.t), ex = noteByTitle(title);
  if (ex) { ex.body = (ex.body.replace(/\s+$/, '') + '\n\n' + it.t.replace(/^#+\s+.*\n?/, '')).trim(); ex.upd = Date.now(); syncCards(ex); return ex; }
  return newNote(title, it.t.replace(/^#\s+.*\n?/, '').trim());
}

// ---------- Bring in ----------
function sheet(title, body, cue) {
  const close = () => { wrap.remove(); render(); };
  const wrap = h('div', { class: 'modal', onclick: e => { if (e.target === wrap) close(); } },
    h('div', { role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h('div', { class: 'sh-h' }, h('h2', {}, title), h('button', { class: 'close', 'aria-label': 'Close', onclick: close }, '×')),
      cue ? h('p', { class: 'sh-cue' }, cue) : null, body));
  document.body.append(wrap); wrap.close = close;
  const esc = e => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } }; document.addEventListener('keydown', esc);
  return wrap;
}
function bringIn() {
  const ta = h('textarea', { class: 'inp', rows: 7, placeholder: 'Paste the converted text of a handwritten page' });
  const file = h('input', { type: 'file', multiple: true, accept: '.csv,.json,.txt,.md,.markdown,text/*,application/json', hidden: true });
  const body = h('div', {},
    h('p', { class: 'lab' }, 'A handwritten page'),
    h('p', { class: 'hint tight' }, 'reMarkable: Convert to text, then copy. Rocketbook: the transcription email or .txt file.'),
    ta,
    h('div', { class: 'row' }, h('button', { class: 'btn go', onclick: () => { if (!ta.value.trim()) return ta.focus(); capture(ta.value, 'paper'); save(); w.close(); toast('Page added to your inbox'); } }, 'Add page')),
    h('p', { class: 'lab' }, 'Files'),
    h('p', { class: 'hint tight' }, 'A MindChuk export (Account › Data), Rocketbook .txt files, or Markdown notes.'),
    h('button', { class: 'btn wide', onclick: () => file.click() }, 'Choose files'), file);
  const w = sheet('Bring in', body);
  file.onchange = async () => {
    let n = 0;
    for (const f of file.files) { const txt = await f.text(); n += importFile(f.name, txt); }
    save(); w.close(); toast(n ? `${n} added to your inbox` : 'Nothing found in that file');
  };
}
function importFile(name, txt) {
  const ext = (name.split('.').pop() || '').toLowerCase(); let items = [];
  try {
    if (ext === 'json' || /^\s*[\[{]/.test(txt)) items = fromJSON(JSON.parse(txt));
    else if (ext === 'csv') items = fromCSV(txt);
  } catch (e) { items = []; }
  if (items.length) { items.reverse().forEach(i => capture(i.t, 'mindchuk', i.d)); return items.length; }
  // Plain text: a MindChuk text export separates notes with blank-line runs or ---; a page is one card.
  const looksLikeFeed = /mindchuk/i.test(name) && /\n\s*(-{3,}|\n)\s*\n/.test(txt);
  const parts = looksLikeFeed ? txt.split(/\n\s*-{3,}\s*\n|\n{3,}/).map(s => s.trim()).filter(Boolean) : [txt];
  const src = looksLikeFeed ? 'mindchuk' : (ext === 'md' || ext === 'markdown') ? 'file' : 'paper';
  let n = 0; for (const p of parts.reverse()) if (capture(p, src)) n++;
  return n;
}
const TEXT_KEYS = ['text', 'body', 'content', 'note', 'message', 'title', 'value'];
const DATE_KEYS = ['created_at', 'createdat', 'created', 'date', 'timestamp', 'time', 'sent_at'];
const pickDate = v => { if (!v) return ymd(); const d = new Date(typeof v === 'number' && v < 1e12 ? v * 1000 : v); return isNaN(d) ? ymd() : ymd(d); };
function rowToItem(o) {
  const k = Object.fromEntries(Object.entries(o).map(([a, b]) => [a.toLowerCase().replace(/\s+/g, '_'), b]));
  let t = TEXT_KEYS.map(x => k[x]).find(v => typeof v === 'string' && v.trim());
  if (!t) return null;
  if (k.title && k.body && k.title !== k.body) t = `# ${k.title}\n${k.body}`;
  const tags = k.tags || k.tag || k.labels; const tl = Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(/[,;\s]+/) : [];
  const extra = tl.map(x => String(x).replace(/^#/, '').trim()).filter(x => x && !tagsOf(t).includes(x.toLowerCase())).map(x => '#' + x).join(' ');
  if (k.url && !t.includes(k.url)) t += '\n' + k.url;
  return { t: extra ? t + '\n' + extra : t, d: pickDate(DATE_KEYS.map(x => k[x]).find(Boolean)) };
}
function fromJSON(j) {
  const arr = Array.isArray(j) ? j : Object.values(j).find(Array.isArray) || [];
  return arr.map(x => typeof x === 'string' ? { t: x, d: ymd() } : x && typeof x === 'object' ? rowToItem(x) : null).filter(Boolean);
}
function fromCSV(txt) {
  const rows = []; let row = [], cell = '', inQ = false;
  for (let i = 0; i < txt.length; i++) { const c = txt[i];
    if (inQ) { if (c === '"' && txt[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') inQ = false; else cell += c; }
    else if (c === '"') inQ = true; else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && txt[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c; }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...rest] = rows.filter(r => r.some(x => x.trim())); if (!head) return [];
  return rest.map(r => rowToItem(Object.fromEntries(head.map((k, i) => [k, r[i] || ''])))).filter(Boolean);
}

// ---------- Markdown ----------
function inline(s) {
  let x = esc(s);
  x = x.replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[\[([^\]\n]+)\]\]/g, (_, t) => `<a class="wl${noteByTitle(t) ? '' : ' unmade'}" href="#" data-l="${t.trim()}">${t.trim()}</a>`)
    .replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
    .replace(TAG_RE, (_, p, t) => `${p}<a class="tg" href="#" data-t="${t.toLowerCase()}">#${t}</a>`);
  return x;
}
function md(text, opt = {}) {
  const wrap = h('div'); let list = null, para = [];
  const flushP = () => { if (para.length) { wrap.append(h('p', { html: para.map(inline).join('<br>') })); para = []; } };
  const flushL = () => { list = null; };
  String(text).split('\n').forEach((raw, i) => {
    const l = raw.trimEnd(), q = isQ(l);
    let mm;
    if (!l.trim()) { flushP(); flushL(); return; }
    if ((mm = l.match(/^(#{1,3})\s+(.*)$/))) { flushP(); flushL(); wrap.append(h('h' + (mm[1].length + 2), { class: q ? 'q' : null, html: inline(mm[2]) })); return; }
    if ((mm = l.match(/^\s*(?:-\s+)?\[( |x)\]\s+(.*)$/))) { flushP();
      if (!list || !list.classList.contains('tasks')) wrap.append(list = h('ul', { class: 'tasks' }));
      const cb = h('input', { type: 'checkbox', 'data-line': i, 'aria-label': mm[2] }); cb.checked = mm[1] === 'x'; if (opt.inert) cb.disabled = true;
      list.append(h('li', { class: (cb.checked ? 'done ' : '') + (q ? 'q' : '') }, h('label', {}, cb, h('span', { html: inline(mm[2]) })))); return; }
    if ((mm = l.match(/^\s*[-]\s+(.*)$/))) { flushP();
      if (!list || list.classList.contains('tasks')) wrap.append(list = h('ul'));
      list.append(h('li', { class: q ? 'q' : null, html: inline(mm[1]) })); return; }
    if ((mm = l.match(/^>\s?(.*)$/))) { flushP(); flushL(); wrap.append(h('blockquote', { html: inline(mm[1]) })); return; }
    flushL();
    if (q) { flushP(); wrap.append(h('p', { class: 'q', html: inline(l) })); return; }
    para.push(l);
  });
  flushP();
  if (!opt.inert) wrap.addEventListener('click', e => {
    const a = e.target.closest('a.wl, a.tg'); if (!a) return; e.preventDefault(); e.stopPropagation();
    if (a.dataset.l) { const n = ensureNote(a.dataset.l); save(); go('notes', n.id); }
    else { q = '#' + a.dataset.t; go('notes'); }
  });
  else wrap.addEventListener('click', e => { if (e.target.closest('a.wl, a.tg')) e.preventDefault(); });
  return wrap;
}

// ---------- Notes ----------
function notesList(m) {
  const inp = h('input', { class: 'search', type: 'search', placeholder: 'Search notes, or #tag', value: q, 'aria-label': 'Search notes' });
  m.append(h('div', { class: 'row head' }, h('h1', { class: 'grow' }, 'Notes'), h('button', { class: 'btn go', onclick: () => { const n = newNote('Untitled'); save(); go('notes', n.id); setTimeout(() => editNote(n), 0); } }, 'New note')));
  m.append(inp);
  const tagRow = h('div', { class: 'filters' });
  const counts = {}; for (const n of S.notes) for (const t of tagsOf(n.body)) counts[t] = (counts[t] || 0) + 1;
  Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12).forEach(([t]) =>
    tagRow.append(h('button', { class: 'chip' + (low(q) === '#' + t ? ' on' : ''), onclick: () => { q = low(q) === '#' + t ? '' : '#' + t; render(); } }, '#' + t)));
  if (tagRow.childNodes.length) m.append(tagRow);
  const box = h('div'); m.append(box);
  const paint = () => {
    box.replaceChildren(); const s = low(q);
    const hit = S.notes.filter(n => !s || (s.startsWith('#') && !s.includes(' ') ? tagsOf(n.body).includes(s.slice(1)) : low(n.title + ' ' + n.body).includes(s)))
      .sort((a, b) => b.upd - a.upd);
    if (!S.notes.length) return box.append(h('div', { class: 'empty' }, 'No notes yet. File something from your inbox, or start one.'));
    if (!hit.length) return box.append(h('div', { class: 'empty' }, 'Nothing matches.'));
    const l = h('div', { class: 'list' });
    for (const n of hit) l.append(h('button', { class: 'nrow', onclick: () => go('notes', n.id) },
      h('b', {}, n.title), h('span', {}, `${niceDay(ymd(new Date(n.upd)))} · ${preview(n.body) || 'Empty'}`)));
    box.append(l);
  };
  inp.oninput = () => { q = inp.value; paint(); };
  paint();
}
function noteView(m, id) {
  const n = noteById(id); if (!n) { view = null; return notesList(m); }
  if (n.seen !== ymd()) { n.seen = ymd(); save(); }
  m.append(h('div', { class: 'row head' }, h('button', { class: 'btn ghost back', onclick: () => go('notes') }, '← Notes'), h('span', { class: 'grow' }),
    h('button', { class: 'btn', onclick: () => editNote(n) }, 'Edit')));
  m.append(h('h1', { class: 'ntitle' }, n.title));
  const body = n.body.trim() ? md(n.body) : h('div', { class: 'empty' }, 'Empty. Tap Edit to write.');
  body.classList?.add('md', 'note');
  body.addEventListener('change', e => { const cb = e.target; if (cb.dataset.line == null) return;
    const ls = n.body.split('\n'), i = +cb.dataset.line; ls[i] = ls[i].replace(/\[( |x)\]/, cb.checked ? '[x]' : '[ ]'); n.body = ls.join('\n'); n.upd = Date.now(); save(); render(); });
  m.append(body);
  const cards = S.cards.filter(c => c.note === n.id);
  if (cards.length) m.append(h('p', { class: 'hint' }, `${cards.length} line${cards.length > 1 ? 's' : ''} in review · next ${niceDay(cards.map(c => c.due).sort()[0])}`));
  const bl = backlinks(n);
  if (bl.length) {
    m.append(h('h2', {}, 'Linked from'));
    const l = h('div', { class: 'list' });
    for (const o of bl) { const line = o.body.split('\n').find(x => low(x).includes('[[' + low(n.title) + ']]')) || '';
      l.append(h('button', { class: 'nrow', onclick: () => go('notes', o.id) }, h('b', {}, o.title), h('span', {}, line.replace(/\[\[|\]\]/g, '').replace(/^-\s+/, '').trim()))); }
    m.append(l);
  }
}
function editNote(n) {
  const ti = h('input', { class: 'inp', value: n.title, 'aria-label': 'Title' });
  const ta = h('textarea', { class: 'inp ed', rows: 14, 'aria-label': 'Note' }); ta.value = n.body;
  const w = sheet('Edit note', h('div', {}, ti, ta,
    h('p', { class: 'hint tight' }, '# heading · - bullet · [ ] task · [[link]] · #tag · end with ? to review'),
    h('div', { class: 'row' }, h('button', { class: 'btn go', onclick: () => {
      const old = n.title, nt = ti.value.trim() || 'Untitled';
      if (low(nt) !== low(old) && noteByTitle(nt)) { toast('Another note already has that title'); return ti.focus(); }
      n.title = nt; n.body = tidy(ta.value); n.upd = Date.now(); syncCards(n);
      // Renaming keeps links working: [[Old]] becomes [[New]] everywhere.
      if (nt !== old) for (const o of S.notes) if (o !== n) o.body = o.body.replace(new RegExp('\\[\\[' + old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\]\\]', 'gi'), `[[${nt}]]`);
      save(); w.close(); go('notes', n.id);
    } }, 'Done'), h('span', { class: 'grow' }),
      h('button', { class: 'btn ghost', onclick: () => { const s = snap(); S.notes = S.notes.filter(x => x !== n); S.cards = S.cards.filter(c => c.note !== n.id); save(); w.close(); go('notes'); toast('Note deleted', undoTo(s)); } }, 'Delete'))));
  setTimeout(() => (n.title === 'Untitled' ? ti : ta).focus(), 30);
}

// ---------- Review ----------
let shown = false;
function review(m) {
  m.append(h('h1', {}, 'Review'));
  const due = dueCards();
  if (!due.length) {
    const next = S.cards.map(c => c.due).sort()[0];
    m.append(h('div', { class: 'empty' }, 'Nothing due.', h('br'), h('span', { class: 'hint' }, next ? `Next one ${niceDay(next).toLowerCase() === 'today' ? 'today' : 'on ' + niceDay(next)}.` : 'Lines you end with ? come back here.')));
    return;
  }
  const c = due[0], n = noteById(c.note);
  m.append(h('p', { class: 'sub' }, `${due.length} left`));
  const card = h('div', { class: 'rv' }, h('p', { class: 'k' }, n.title), h('p', { class: 'rq', html: inline(c.q) }));
  if (shown) {
    const ctx = n.body.split('\n'); const i = ctx.findIndex(l => qText(l) === c.q);
    const around = ctx.slice(Math.max(0, i - 2), i + 5).filter(l => qText(l) !== c.q).join('\n').trim();
    card.append(h('div', { class: 'md ctx' }, around ? md(around, { inert: true }) : h('p', { class: 'hint' }, 'Just this line in the note.')));
    card.append(h('div', { class: 'row' },
      h('button', { class: 'btn', onclick: () => grade(c, false) }, 'Again tomorrow'),
      h('button', { class: 'btn green', onclick: () => grade(c, true) }, `Got it · ${STEPS[Math.min(c.step + 1, STEPS.length - 1)]} days`),
      h('span', { class: 'grow' }), h('button', { class: 'btn ghost', onclick: () => { shown = false; go('notes', n.id); } }, 'Open note')));
  } else card.append(h('div', { class: 'row' }, h('button', { class: 'btn go wide', onclick: () => { shown = true; render(); } }, 'Show the note')));
  m.append(card);
}
function grade(c, ok) {
  c.step = ok ? Math.min(c.step + 1, STEPS.length - 1) : 0;
  c.due = addDays(ymd(), ok ? STEPS[c.step] : 1); shown = false; save(); render();
}

// ---------- Symbols, template, export ----------
const SYMBOLS = [['# Olive harvest', 'A heading. The first one names the note.'], ['- prune the north row', 'A bullet'], ['[ ] call the Classy Cruet', 'A task you can tick'],
  ['[[Volos trip]]', 'A link to another note'], ['#greek', 'A tag'], ['Which oil is greener?', 'End with ? and it comes back for review']];
function symbolsSheet() {
  const t = h('div', { class: 'sym' }); for (const [a, b] of SYMBOLS) t.append(h('div', {}, h('code', {}, a), h('span', {}, b)));
  sheet('Handwriting symbols', h('div', {}, t,
    h('p', { class: 'hint' }, 'Write big brackets and leave a space after each symbol, so the tablet reads them right.'),
    h('div', { class: 'row' }, h('button', { class: 'btn', onclick: downloadTemplate }, 'Download a reMarkable page'))),
  'The same six marks work typed, on a reMarkable and on a Rocketbook.');
}
// A 1404 × 1872 PNG, the reMarkable 2 screen size, to load as a custom template.
function downloadTemplate() {
  const W = 1404, H = 1872, c = h('canvas', { width: W, height: H }), x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
  x.strokeStyle = '#bdbdbd'; x.lineWidth = 2; x.fillStyle = '#7a7a7a'; x.font = '600 30px system-ui, sans-serif';
  x.fillText('#', 90, 132); x.beginPath(); x.moveTo(130, 140); x.lineTo(W - 90, 140); x.stroke();
  x.lineWidth = 1.5; x.strokeStyle = '#d6d6d6';
  for (let y = 230; y < H - 240; y += 74) { x.beginPath(); x.moveTo(90, y); x.lineTo(W - 90, y); x.stroke(); }
  x.strokeStyle = '#bdbdbd'; x.beginPath(); x.moveTo(90, H - 200); x.lineTo(W - 90, H - 200); x.stroke();
  x.font = '26px system-ui, sans-serif'; x.fillStyle = '#6a6a6a';
  const key = ['# heading', '- bullet', '[ ] task', '[[link]]', '#tag', 'ends in ? = review'];
  let px = 90; for (const k of key) { x.fillText(k, px, H - 150); px += x.measureText(k).width + 48; }
  x.font = '22px system-ui, sans-serif'; x.fillStyle = '#9a9a9a'; x.fillText('Frequent Notes', 90, H - 100);
  c.toBlob(b => dl(b, 'frequent-notes-page.png'), 'image/png');
  toast('Page saved. Send it to your reMarkable and write on it.');
}
function dl(blob, name) { const a = h('a', { href: URL.createObjectURL(blob), download: name }); document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
function saveBackup() { dl(new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' }), `frequent-notes-${ymd()}.json`); toast('Backup saved'); }
$('#restore').onchange = async e => { const f = e.target.files[0]; if (!f) return; $('#menu').hidden = true;
  try { const s = JSON.parse(await f.text()); if (!s || !Array.isArray(s.notes)) throw 0; const old = snap(); S = Object.assign(blank(), s); save(); render(); toast('Backup restored', undoTo(old)); }
  catch (er) { toast('That file is not a Frequent Notes backup'); } e.target.value = ''; };

// Obsidian reads a folder of .md files. This builds a plain zip (no compression) of one file per note.
function exportObsidian() {
  if (!S.notes.length) return toast('No notes to export yet');
  const enc = new TextEncoder(), used = new Set(), files = [];
  for (const n of S.notes) { let base = n.title.replace(/[\\/:*?"<>|#^[\]]/g, '').trim() || 'Untitled', name = base, i = 2;
    while (used.has(low(name))) name = `${base} ${i++}`; used.add(low(name));
    files.push([`Frequent Notes/${name}.md`, enc.encode(n.body + '\n')]); }
  dl(zip(files), `frequent-notes-obsidian-${ymd()}.zip`); toast(`${files.length} notes exported`);
}
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function zip(files) {
  const enc = new TextEncoder(), parts = [], central = []; let off = 0;
  const d = new Date(), time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  for (const [name, data] of files) {
    const nm = enc.encode(name), crc = crc32(data);
    const lh = new DataView(new ArrayBuffer(30));
    [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x0800, 2], [8, 0, 2], [10, time, 2], [12, date, 2], [14, crc, 4], [18, data.length, 4], [22, data.length, 4], [26, nm.length, 2], [28, 0, 2]]
      .forEach(([o, v, s]) => s === 4 ? lh.setUint32(o, v, true) : lh.setUint16(o, v, true));
    parts.push(lh, nm, data);
    const ch = new DataView(new ArrayBuffer(46));
    [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x0800, 2], [10, 0, 2], [12, time, 2], [14, date, 2], [16, crc, 4], [20, data.length, 4], [24, data.length, 4], [28, nm.length, 2], [30, 0, 2], [32, 0, 2], [34, 0, 2], [36, 0, 2], [38, 0, 4], [42, off, 4]]
      .forEach(([o, v, s]) => s === 4 ? ch.setUint32(o, v, true) : ch.setUint16(o, v, true));
    central.push(ch, nm); off += 30 + nm.length + data.length;
  }
  const size = central.reduce((a, p) => a + p.byteLength, 0), end = new DataView(new ArrayBuffer(22));
  [[0, 0x06054b50, 4], [4, 0, 2], [6, 0, 2], [8, files.length, 2], [10, files.length, 2], [12, size, 4], [16, off, 4], [20, 0, 2]]
    .forEach(([o, v, s]) => s === 4 ? end.setUint32(o, v, true) : end.setUint16(o, v, true));
  return new Blob([...parts, ...central, end], { type: 'application/zip' });
}

render();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
