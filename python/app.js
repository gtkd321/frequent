// Frequent Python. © 2026 Daniel Houlis. All rights reserved. Frequent is a trademark of Daniel Houlis.
// Learn the words real Python uses most, five a day, with one small real project a week.
// Progress lives in this browser (localStorage "fpy"). Updates only add to it; nothing is ever wiped.
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
const ymd = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 864e5);

// ---------- Saved progress ----------
const KEY = 'fpy';
const blank = () => ({ v: 1, day: 1, colors: {}, pts: {}, did: {}, codes: {}, passed: {}, play: '', playIn: '' });
let S = blank();
try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && typeof s === 'object') S = Object.assign(blank(), s); } catch (e) { /* start fresh, keep the old text untouched */ }
let saveT = 0;
const save = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Could not save in this browser. Save a backup file from the menu.'); } }, 150); };

// ---------- Momentum: points for practice, fading by 1/7 a day ----------
function addPts(n, key) {
  const d = ymd();
  if (key) { S.did[d] = S.did[d] || []; if (S.did[d].includes(key)) return false; S.did[d].push(key); }
  S.pts[d] = (S.pts[d] || 0) + n; save(); paintMo(); toast(`+${n} momentum`); return true;
}
const moScore = () => { const t = ymd(); let s = 0; for (const [d, n] of Object.entries(S.pts)) { const ago = daysBetween(d, t); if (ago >= 0) s += n * Math.pow(6 / 7, ago); } return Math.round(s); };
const paintMo = () => { $('#moN').textContent = moScore(); };
let toastT = 0;
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 1600); }

// ---------- Python, in a worker so a loop that never ends can be stopped ----------
let worker = null, ready = false, seq = 0;
const waiting = new Map();
function newWorker() {
  worker = new Worker('worker.js'); ready = false;
  worker.onmessage = e => { const m = e.data; if (m.ready) ready = true; const f = waiting.get(m.id); if (f) { waiting.delete(m.id); f(m); } };
  worker.onerror = () => { for (const f of waiting.values()) f({ err: { type: 'LoadError', msg: 'Python could not start. Check the connection and try again.', tb: '' } }); waiting.clear(); };
}
const TIMEOUT = 12000;
async function runPy(code, lines, check, folder) {
  if (!worker) newWorker();
  // The first run downloads Python (about 10 MB, once, then the browser keeps it). The stop clock starts after that.
  if (!ready) {
    const r = await new Promise(res => { waiting.set('warm', res); worker.postMessage({ id: 'warm', code: '' }); });
    if (r.err) { worker.terminate(); worker = null; return r; }
  }
  const id = ++seq;
  return new Promise(res => {
    const t = setTimeout(() => { if (!waiting.has(id)) return; waiting.delete(id); worker.terminate(); worker = null; ready = false; res({ err: { type: 'Stopped', msg: 'Stopped after 12 seconds. Look for a loop that never ends, like while True with no break.', tb: '' } }); }, TIMEOUT);
    waiting.set(id, m => { clearTimeout(t); res(m); });
    worker.postMessage({ id, code, lines, check, folder });
  });
}
const WHY = {
  NameError: 'Python does not know that name yet. Check the spelling, or make it first with =.',
  SyntaxError: 'Python could not read a line. Look for a missing colon, quote or bracket.',
  IndentationError: 'The spaces at the start of a line do not line up. Blocks after a colon are indented 4 spaces.',
  TypeError: 'The value is the wrong kind for this, like adding text and a number.',
  ValueError: 'Right kind of value, wrong content, like int("five").',
  ZeroDivisionError: 'Something was divided by zero.',
  IndexError: 'There is no item at that place in the list.',
  KeyError: 'That key is not in the dictionary.',
  AttributeError: 'That value does not have that part. Check the name after the dot.',
  EOFError: 'The program asked for input. Type the answer in the Input box, one answer per line.',
  Stopped: '', LoadError: '',
};
const byLabel = {};
function showResult(box, m) {
  box.replaceChildren(); box.className = 'out';
  if (m.out) box.append(h('span', { class: 'lbl', text: 'Output' }), m.out);
  if (m.err) {
    box.classList.add('err');
    const last = m.err.type + (m.err.msg ? ': ' + m.err.msg : '');
    const tbLines = (m.err.tb || '').trim().split('\n'); const lineNo = (m.err.tb.match(/line (\d+)/g) || []).pop();
    box.append(h('span', { class: 'lbl', text: m.out ? 'Then an error' : 'Error' }), last + (lineNo ? `  (${lineNo})` : ''));
    const why = WHY[m.err.type]; if (why) box.append(h('span', { class: 'why', text: why }));
    const w = byLabel[m.err.type]; if (w) box.append(h('span', { class: 'why' }, h('a', { href: '#', onclick: ev => { ev.preventDefault(); openWord(w.id); }, text: `Open the ${w.label} card` })));
    void tbLines;
  }
  if (!m.out && !m.err) box.append(h('span', { class: 'lbl', text: 'Output' }), h('span', { class: 'hint', text: '(nothing printed)' }));
}

// ---------- A small code editor: a textarea with a tab key and a few keys phones lack ----------
function editor(code, onChange) {
  const ta = h('textarea', { class: 'ed', spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', autocorrect: 'off', 'aria-label': 'Python code', rows: Math.min(14, Math.max(2, code.split('\n').length)) });
  ta.value = code;
  const ins = t => { const a = ta.selectionStart, b = ta.selectionEnd; ta.setRangeText(t, a, b, 'end'); const pair = { '()': 1, '[]': 1, '""': 1, '{}': 1 }; if (pair[t]) ta.selectionStart = ta.selectionEnd = a + 1; ta.focus(); fire(); };
  const fire = () => { ta.rows = Math.min(14, Math.max(2, ta.value.split('\n').length)); onChange && onChange(ta.value); };
  ta.addEventListener('input', fire);
  ta.addEventListener('keydown', e => {
    if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); ins('    '); }
    else if (e.key === 'Enter') {
      const a = ta.selectionStart, line = ta.value.slice(0, a).split('\n').pop(), ind = line.match(/^\s*/)[0] + (/:\s*$/.test(line) ? '    ' : '');
      if (ind) { e.preventDefault(); ins('\n' + ind); }
    }
  });
  const keys = h('div', { class: 'keys', 'aria-label': 'Extra keys' }, ...[['⇥', '    '], [':', ':'], ['( )', '()'], ['[ ]', '[]'], ['" "', '""'], ['=', '='], ['{ }', '{}'], ['#', '# '], ['_', '_']].map(([l, t]) => h('button', { type: 'button', text: l, 'aria-label': l === '⇥' ? 'Indent' : 'Type ' + t, onmousedown: e => e.preventDefault(), onclick: () => ins(t) })));
  return { el: h('div', { class: 'ed-wrap' }, ta, keys), ta };
}

// A runnable block: editor, optional input box, Run, output.
function runner({ code, saveKey, inp, check, onRun, expected }) {
  const folder = (saveKey || 'main').replace(/[^\w.-]/g, '_');
  const start = saveKey && S.codes[saveKey] != null ? S.codes[saveKey] : code;
  const inBox = h('textarea', { class: 'inp', rows: 1, placeholder: 'Input: one answer per line', 'aria-label': 'Input for input()' });
  inBox.value = (inp || []).join('\n');
  const ed = editor(start, v => { if (saveKey) { S.codes[saveKey] = v; save(); } inBox.hidden = !/\binput\s*\(/.test(v); });
  inBox.hidden = !/\binput\s*\(/.test(start);
  const out = h('div', { class: 'out' });
  if (expected != null) { out.append(h('span', { class: 'lbl', text: 'It prints' }), expected || '(nothing)'); }
  const status = h('span', { class: 'status' });
  const run = h('button', { class: 'btn run', type: 'button', text: 'Run' });
  const reset = h('button', { class: 'btn', type: 'button', text: 'Reset', onclick: () => { ed.ta.value = code; if (saveKey) { delete S.codes[saveKey]; save(); } ed.ta.dispatchEvent(new Event('input')); } });
  run.onclick = async () => {
    run.disabled = true; status.textContent = ready ? 'Running…' : 'Starting Python (the first time takes a few seconds)…';
    const m = await runPy(ed.ta.value, inBox.value.split('\n'), check, folder);
    run.disabled = false; status.textContent = '';
    showResult(out, m); onRun && onRun(m, ed.ta.value);
  };
  return { el: h('div', {}, ed.el, inBox, h('div', { class: 'row' }, run, reset, status), out), out, ta: ed.ta };
}

// ---------- Data ----------
let D = null;
const COLORS = [['red', "Don't have it"], ['yellow', 'Kind of'], ['green', 'Have it']];
const fmt = n => n.toLocaleString('en-US');
const dayWords = n => D.words.filter(w => w.day === n);
const maxDay = () => Math.max(...D.words.map(w => w.day));
const weekOf = n => Math.ceil(n / 6);

function wordCard(w, open) {
  const c = S.colors[w.id];
  const dot = h('span', { class: 'dot' + (c ? ' ' + c : ''), 'aria-label': c ? c + ' word' : 'new word' });
  const card = h('section', { class: 'card' + (open ? ' open' : ''), id: 'w-' + w.id });
  const head = h('button', { class: 'card-h', type: 'button', 'aria-expanded': String(!!open) }, dot, h('span', { class: 'lab', text: w.label }), h('span', { class: 'en', text: w.en }), h('span', { class: 'chev', 'aria-hidden': 'true', text: '›' }));
  head.onclick = () => { const o = card.classList.toggle('open'); head.setAttribute('aria-expanded', String(o)); if (o && !card.dataset.built) build(); };
  const body = h('div', { class: 'card-b' });
  const build = () => {
    card.dataset.built = '1';
    body.append(h('p', { class: 'freq', text: `#${w.rank} of ${D.meta.ranked} in Python's own code · ${fmt(w.count)} times in ${D.meta.files} files` }), h('p', { class: 'meaning', text: w.en }));
    if (w.xl) {
      const x = h('p', { class: 'xl' }, h('b', { text: w.xl.in.length ? `Shared ${w.xl.score}: ` : 'Python only. ' }), w.xl.in.length ? 'also works in ' + w.xl.in.join(', ') + '.' : '');
      if (w.xl.ff) x.append(' ', h('span', { class: 'ff', text: 'Watch out: ' + w.xl.ff }));
      body.append(x);
    }
    const r = runner({ code: w.ex, saveKey: 'w:' + w.id, inp: w.inp, expected: w.out, onRun: (m, code) => {
      addPts(1, 'run:' + w.id);
      if (!m.err && code.trim() !== w.ex.trim()) addPts(2, 'try:' + w.id);
    } });
    body.append(r.el, h('p', { class: 'try' }, h('b', { text: 'Try it: ' }), w.tr));
    const grp = h('div', { class: 'colors', role: 'group', 'aria-label': 'How well do you know it?' });
    for (const [k, l] of COLORS) {
      const b = h('button', { type: 'button', class: 'c-' + k + (S.colors[w.id] === k ? ' on' : ''), text: l });
      b.onclick = () => {
        S.colors[w.id] = k; save(); addPts(1, 'color:' + w.id);
        grp.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
        dot.className = 'dot ' + k; dot.setAttribute('aria-label', k + ' word');
        card.dispatchEvent(new CustomEvent('colored', { bubbles: true }));
      };
      grp.append(b);
    }
    body.append(grp);
  };
  if (open) build();
  card.append(head, body);
  return card;
}

// ---------- Today ----------
function today() {
  const m = $('#main'); m.replaceChildren();
  const n = Math.min(S.day, maxDay()), wk = D.weeks[weekOf(n) - 1], list = dayWords(n);
  const dow = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][(n - 1) % 6];
  m.append(h('h1', { text: `Day ${n} of ${maxDay()}` }), h('p', { class: 'sub', text: `Week ${wk.n} · ${dow}. Five words, most frequent first, each one used in the week's project.` }));
  const proj = D.projects[wk.n - 1], passed = proj.steps.filter((_, i) => S.passed[`${wk.n}.${i}`]).length;
  m.append(h('div', { class: 'scene' }, h('b', { text: `This week: ${wk.title}` }), wk.scene, h('div', { class: 'bar', 'aria-label': `${passed} of ${proj.steps.length} project steps` }, h('i', { style: `width:${passed / proj.steps.length * 100}%` })), h('div', { class: 'row' }, h('span', { class: 'hint', text: `${passed} of ${proj.steps.length} steps done` }), h('button', { class: 'btn', type: 'button', text: 'Open the project', onclick: () => go('project') }))));
  m.append(h('h2', { text: "Today's five" }));
  const firstOpen = list.find(w => !S.colors[w.id]) || null;
  const wrap = h('div');
  for (const w of list) wrap.append(wordCard(w, w === firstOpen));
  m.append(wrap);
  const end = h('div');
  const paintEnd = () => {
    end.replaceChildren();
    const left = list.filter(w => !S.colors[w.id]).length;
    if (left) { end.append(h('p', { class: 'hint', text: `Run each example, change it, then mark how well you know it. ${left} to go.` })); return; }
    const box = h('div', { class: 'scene done-box' }, h('b', { text: 'Day done. See you tomorrow.' }));
    if (n < maxDay()) box.append(h('div', { class: 'row', style: 'justify-content:center' }, h('button', { class: 'btn run', type: 'button', text: `Start day ${n + 1}`, onclick: () => { S.day = n + 1; save(); addPts(3, 'day:' + n); today(); scrollTo(0, 0); } })));
    else box.append(h('p', { class: 'hint', text: 'That is all 180 words. Keep the red and yellow ones coming back below, and finish the projects.' }));
    end.append(box);
  };
  wrap.addEventListener('colored', ev => {
    paintEnd();
    const cur = ev.target.closest('.card'), next = [...wrap.children].find(c => c !== cur && !S.colors[c.id.slice(2)]);
    if (next && !next.classList.contains('open')) setTimeout(() => { next.querySelector('.card-h').click(); next.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 350);
  });
  paintEnd(); m.append(end);
  // Spaced review: red and yellow words from earlier days, oldest touch first, five at most.
  const rev = D.words.filter(w => w.day < n && (S.colors[w.id] === 'red' || S.colors[w.id] === 'yellow')).sort((a, b) => (S.colors[a.id] === 'red' ? 0 : 1) - (S.colors[b.id] === 'red' ? 0 : 1) || a.day - b.day).slice(0, 5);
  if (rev.length) { m.append(h('h2', { text: 'Back again' }), h('p', { class: 'hint', text: 'Red and yellow words from earlier days. Run one, then change its color when it sticks.' })); for (const w of rev) m.append(wordCard(w, false)); }
  foot(m);
}

// ---------- Words ----------
let wFilter = 'all', wSort = 'course', wQuery = '';
function words() {
  const m = $('#main'); m.replaceChildren();
  const counts = { red: 0, yellow: 0, green: 0 }; for (const w of D.words) if (S.colors[w.id]) counts[S.colors[w.id]]++;
  m.append(h('h1', { text: 'All 180 words' }), h('p', { class: 'sub', text: `${counts.green} green, ${counts.yellow} yellow, ${counts.red} red. Black dots are new.` }));
  const q = h('input', { class: 'search', type: 'search', placeholder: 'Search: append, loop, error…', value: wQuery, 'aria-label': 'Search words' });
  const fl = h('div', { class: 'filters' });
  const list = h('div');
  const chips = [['all', 'All'], ['new', 'New'], ['red', 'Red'], ['yellow', 'Yellow'], ['green', 'Green']];
  const paint = () => {
    fl.replaceChildren(...chips.map(([k, l]) => h('button', { type: 'button', class: 'chip' + (wFilter === k ? ' on' : ''), text: l, onclick: () => { wFilter = k; paint(); } })),
      h('button', { type: 'button', class: 'chip', text: wSort === 'course' ? 'Order: course' : 'Order: frequency', onclick: () => { wSort = wSort === 'course' ? 'freq' : 'course'; paint(); } }));
    const t = wQuery.trim().toLowerCase();
    let ws = D.words.filter(w => (wFilter === 'all' || (wFilter === 'new' ? !S.colors[w.id] : S.colors[w.id] === wFilter)) && (!t || (w.label + ' ' + w.en + ' ' + w.ex).toLowerCase().includes(t)));
    if (wSort === 'freq') ws = ws.slice().sort((a, b) => a.rank - b.rank);
    list.replaceChildren(...(ws.length ? ws.map(w => wordCard(w, false)) : [h('p', { class: 'hint', text: 'No words match.' })]));
  };
  q.oninput = () => { wQuery = q.value; paint(); };
  m.append(q, fl, list); paint(); foot(m);
}
function openWord(id) { go('words'); wQuery = ''; wFilter = 'all'; words(); const c = $('#w-' + id); if (c) { c.querySelector('.card-h').click(); c.scrollIntoView({ block: 'start' }); } }

// ---------- Project ----------
let pWeek = null;
function project() {
  const m = $('#main'); m.replaceChildren();
  const cur = weekOf(Math.min(S.day, maxDay())); if (!pWeek) pWeek = cur;
  const p = D.projects[pWeek - 1];
  m.append(h('div', { class: 'weeks', role: 'group', 'aria-label': 'Week' }, ...D.projects.map(x => h('button', { type: 'button', class: 'chip' + (x.n === pWeek ? ' on' : ''), text: `Week ${x.n}`, onclick: () => { pWeek = x.n; project(); } }))));
  m.append(h('h1', { text: p.title, style: 'margin-top:14px' }), h('p', { class: 'sub', text: p.scene + (pWeek > cur ? ` The words for it come in week ${pWeek}; you can start any time.` : '') }));
  p.steps.forEach((st, i) => {
    const k = `${p.n}.${i}`, box = h('section', { class: 'step' + (S.passed[k] ? ' passed' : '') });
    const badge = h('span', { class: 'ok', text: S.passed[k] ? 'Done' : '' });
    box.append(h('h3', {}, h('span', { class: 'n', text: `Step ${i + 1}` }), h('span', { style: 'flex:1' }, st.task), badge));
    const res = h('div', { class: 'out' });
    const r = runner({ code: st.start, saveKey: 'p:' + k, inp: st.inp, check: st.check, onRun: m2 => {
      if (m2.passed === true) {
        res.className = 'out'; res.replaceChildren(h('span', { class: 'ok', text: 'Passed. ' }), 'Nicely done.');
        if (!S.passed[k]) { S.passed[k] = ymd(); save(); addPts(5); }
        box.classList.add('passed'); badge.textContent = 'Done';
      } else if (m2.passed) { res.className = 'out err'; res.replaceChildren(h('span', { class: 'lbl', text: 'Not yet' }), String(m2.passed).replace(/^AssertionError: /, '')); }
      else res.replaceChildren();
    } });
    box.append(r.el, res, h('details', {}, h('summary', { text: 'Hint' }), h('p', { text: st.hint })), h('details', {}, h('summary', { text: 'Show one way to do it' }), h('pre', { text: st.sol })));
    m.append(box);
  });
  foot(m);
}

// ---------- Code: a free playground ----------
function code() {
  const m = $('#main'); m.replaceChildren();
  m.append(h('h1', { text: 'Your code' }), h('p', { class: 'sub', text: 'Anything you like. It is saved in this browser as you type. Files you write last until you reload.' }));
  const start = S.play || '# Write anything here, then press Run\nwords = ["νερό", "ψωμί", "καφές"]\nfor i, w in enumerate(words, 1):\n    print(i, w)\n';
  const r = runner({ code: start, onRun: m2 => { if (!m2.err) { const d = ymd(), c = (S.did[d] || []).filter(x => x.startsWith('play')).length; if (c < 5) addPts(1, 'play' + c); } } });
  r.ta.addEventListener('input', () => { S.play = r.ta.value; save(); });
  r.ta.rows = 12;
  m.append(r.el); foot(m);
}

function foot(m) {
  m.append(h('p', { class: 'foot' }, 'Frequent Python, part of the Frequent series. Word ranks come from counting every token in Python ' + D.meta.python + "'s standard library (" + D.meta.files + ' files, ' + fmt(D.meta.tokens) + ' tokens). Python runs in your browser with Pyodide; nothing is sent anywhere. © 2026 Daniel Houlis. All rights reserved. Frequent™ is a trademark of Daniel Houlis.'));
}

// ---------- Menu: backup and restore (restore only adds, never erases) ----------
function backup() {
  const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
  const a = h('a', { href: URL.createObjectURL(blob), download: `frequent-python-backup-${ymd()}.json` }); document.body.append(a); a.click(); a.remove();
  toast('Backup saved');
}
function restore(file) {
  file.text().then(t => {
    const b = JSON.parse(t); if (!b || typeof b !== 'object') throw 0;
    S.day = Math.max(S.day, +b.day || 1);
    for (const k of ['colors', 'codes', 'passed']) S[k] = Object.assign({}, b[k] || {}, S[k]);
    for (const [d, n] of Object.entries(b.pts || {})) S.pts[d] = Math.max(S.pts[d] || 0, n);
    for (const [d, l] of Object.entries(b.did || {})) S.did[d] = [...new Set([...(S.did[d] || []), ...l])];
    if (!S.play && b.play) S.play = b.play;
    save(); paintMo(); go(tab); toast('Backup added. Nothing was erased.');
  }).catch(() => toast('That file is not a Frequent Python backup.'));
}
function about() {
  const top = D.words.slice().sort((a, b) => a.rank - b.rank).slice(0, 12).map(w => `${w.label} (${fmt(w.count)})`).join(', ');
  const box = h('div', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'About the word list' },
    h('h2', { text: 'Where the words come from', style: 'margin-top:0' }),
    h('p', { text: `Every keyword, built-in name, method, operator and literal in Python ${D.meta.python}'s standard library was counted: ${D.meta.files} files and ${fmt(D.meta.tokens)} tokens, leaving out the test suites. The 180 most useful for a beginner are here, grouped into six weekly projects. Each card shows its real rank.` }),
    h('p', { text: 'Most frequent: ' + top + '.' }),
    h('p', { text: 'Shared score: how much of the programming world the word also works in, from 0 to 100. Each of the 11 most used languages counts by its share of developers in the Stack Overflow 2026 survey (survey.stackoverflow.co/2026). Most shared: ' + D.words.filter(w => w.xl && w.xl.in.length).sort((a, b) => b.xl.score - a.xl.score || a.rank - b.rank).slice(0, 12).map(w => `${w.label} (${w.xl.score})`).join(', ') + '. "Watch out" marks false friends: the same word doing a different job elsewhere.' }),
    h('p', { class: 'hint', text: 'Library code leans on self, raise and isinstance more than a beginner script would, and print less, so the weeks start with what you need first and keep the counts honest on each card.' }),
    h('div', { class: 'row' }, h('button', { class: 'btn run', type: 'button', text: 'Close', onclick: () => wrap.remove() })));
  const wrap = h('div', { class: 'modal', onclick: e => { if (e.target === wrap) wrap.remove(); } }, box);
  document.body.append(wrap);
}

// ---------- Tabs ----------
let tab = 'today';
const VIEWS = { today, words, project, code };
function go(t) { tab = t; document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t)); VIEWS[t](); }
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { go(b.dataset.tab); scrollTo(0, 0); });
$('#menuB').onclick = e => { e.stopPropagation(); $('#menu').hidden = !$('#menu').hidden; };
document.addEventListener('click', e => { if (!e.target.closest('#menu')) $('#menu').hidden = true; });
$('#menu').addEventListener('click', e => { const a = e.target.dataset.act; if (a === 'backup') backup(); if (a === 'about') about(); if (a) $('#menu').hidden = true; });
$('#restore').onchange = e => { const f = e.target.files[0]; if (f) restore(f); e.target.value = ''; $('#menu').hidden = true; };
$('#mo').onclick = () => toast(`Momentum ${moScore()}: today ${S.pts[ymd()] || 0} points. It fades a little each day you rest.`);

fetch('data.json').then(r => r.json()).then(d => {
  D = d; for (const w of D.words) byLabel[w.label] = w;
  paintMo(); go('today');
}).catch(() => { $('#main').textContent = 'Could not load the word list. Reload the page.'; });
