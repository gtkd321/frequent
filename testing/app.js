// Frequent Testing. © 2026 Daniel Houlis. All rights reserved. Frequent is a trademark of Daniel Houlis.
// Learn software testing by finding planted bugs in a small app and writing reports a developer can act on.
// Progress lives in this browser (localStorage "fqt"). Updates only add to it; nothing is ever wiped.
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

// ---------- Saved progress ----------
const KEY = 'fqt';
const blank = () => ({ v: 1, done: {}, pts: {}, did: {}, found: {}, last: [], reports: [], form: null, ans: {}, cur: 1, fields: null });
let S = blank();
try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && typeof s === 'object') S = Object.assign(blank(), s); } catch (e) { /* start fresh */ }
let saveT = 0;
const save = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Could not save in this browser. Save a backup file from the menu.'); } }, 150); };

function addPts(n, key) {
  const d = ymd();
  if (key) { S.did[d] = S.did[d] || []; if (S.did[d].includes(key)) return false; S.did[d].push(key); }
  S.pts[d] = (S.pts[d] || 0) + n; save(); paintMo(); toast(`+${n} momentum`); return true;
}
const moScore = () => { const t = ymd(); let s = 0; for (const [d, n] of Object.entries(S.pts)) { const ago = daysBetween(d, t); if (ago >= 0) s += n * Math.pow(6 / 7, ago); } return Math.round(s); };
const paintMo = () => { $('#moN').textContent = moScore(); };
let toastT = 0;
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 1700); }

// ---------- The app under test: a taverna bill splitter with eight planted bugs ----------
const BUGS = [
  { id: 'zero', title: 'Zero people: each pays €Infinity', group: 'Strange numbers' },
  { id: 'one', title: 'One person: "Each of 1 people"', group: 'Edges' },
  { id: 'tip100', title: 'A 100% tip is refused, though the label allows 0 to 100', group: 'Edges' },
  { id: 'neg', title: 'A negative bill is accepted', group: 'Strange numbers' },
  { id: 'comma', title: 'A decimal comma (12,50) drops the cents', group: 'Strange numbers' },
  { id: 'round', title: 'Round up rounds down', group: 'How the result shows' },
  { id: 'greek', title: 'Greek or accented names vanish from the thank-you', group: 'How the result shows' },
  { id: 'big', title: 'Over €100, the tip is added in euros instead of percent', group: 'Edges' },
];
const bugTitle = id => (BUGS.find(b => b.id === id) || {}).title || id;

function runSplit(f) {
  const total = parseFloat(f.total);
  const tip = parseFloat(f.tip) || 0;
  const people = parseInt(f.people, 10);
  const trig = [];
  if (tip === 100) trig.push('tip100');
  if (tip >= 100) return { err: 'Tip must be from 0 to 100.', trig };
  if (isNaN(total) || isNaN(people)) return { err: 'Please fill in the bill and the number of people.', trig: [] };
  if (/,/.test(f.total)) trig.push('comma');
  if (total < 0) trig.push('neg');
  if (people === 0) trig.push('zero');
  if (people === 1) trig.push('one');
  if (total > 100 && tip > 0) trig.push('big');
  const tipAmt = total > 100 ? tip : total * tip / 100;
  let each = (total + tipAmt) / people;
  if (f.round) { if (isFinite(each) && each % 1 !== 0) trig.push('round'); each = Math.floor(each); }
  const raw = (f.name || '').trim();
  const name = raw.replace(/[^a-z ]/gi, '').trim();
  if (raw && /[^\x00-\x7F]/.test(raw)) trig.push('greek');
  const lines = [`Each of ${people} people pays €${each.toFixed(2)}`];
  if (raw) lines.push(`Thanks, ${name}.`);
  return { lines, trig };
}

// ---------- Lessons: three weeks, four a week ----------
const SPLIT_PY = [
  'total = float(bill)',
  'if tip >= 100:',
  '    error("Tip must be from 0 to 100")',
  'if total > 100:',
  '    tip_amount = tip',
  'else:',
  '    tip_amount = total * tip / 100',
  'each = (total + tip_amount) / people',
];
const SPLIT_JS = [
  'const total = parseFloat(bill);',
  'if (tip >= 100) {',
  '  error("Tip must be from 0 to 100");',
  '} if (total > 100) {',
  '  tipAmount = tip;',
  '} else {',
  '  tipAmount = total * tip / 100;',
  '} const each = (total + tipAmount) / people;',
];
const PW = [
  "test('splits a bill', async ({ page }) => {",
  "  await page.goto('/split');",
  "  await page.fill('#total', '40');",
  "  await page.fill('#tip', '10');",
  "  await page.fill('#people', '4');",
  "  await page.click('text=Split');",
  "  await expect(page.locator('#each')).toHaveText('€11.00');",
  '});',
];
const L = [
  { n: 1, wk: 'The tester\'s eye', title: 'Expected and actual',
    idea: 'A bug is a gap between what should happen and what does. Your job is to show that gap so clearly that anyone can see it too.',
    do: { type: 'find', any: 1, hint: 'Open Bug hunt. Split an ordinary bill first, then try one strange number. When something looks wrong, write the report.' } },
  { n: 2, wk: 'The tester\'s eye', title: 'Describe, don\'t prescribe',
    idea: 'Say what you did and what happened, not how to change the code. The developer knows the code. You know the behavior.',
    do: { type: 'pick', qs: [
      { q: 'Which line belongs in a bug report?', o: ['Change parseFloat to handle commas on line 1.', 'Typed 12,50 as the bill. Each pays was worked out from €12, not €12.50.', 'The math is broken.'], a: 1, why: 'It gives the input, the expected result and the actual result. The first one prescribes a fix; the last one gives nothing to repeat.' },
      { q: 'Your steps should let…', o: ['the developer guess what you meant', 'anyone repeat the bug without asking you', 'the manager decide who to blame'], a: 1, why: 'If a stranger can repeat it from your steps, the developer can too.' },
    ] } },
  { n: 3, wk: 'The tester\'s eye', title: 'Groups of inputs',
    idea: 'Inputs fall into groups that should behave alike: ordinary numbers, zero, negatives, decimals, words. Test one from each group, not a hundred from one.',
    do: { type: 'find', of: ['neg', 'comma', 'zero'], hint: 'Try one value from a group you have not tried yet: a negative bill, a decimal written the Greek way (12,50), or zero people.' } },
  { n: 4, wk: 'The tester\'s eye', title: 'Edges',
    idea: 'Bugs live at edges. If the rule says 0 to 100, test 0, 100 and 101. Test just under and just over every limit you can see or guess.',
    do: { type: 'find', of: ['tip100', 'big', 'one'], hint: 'The tip label says 0 to 100. Try both ends. Then try a bill just over a round number like 100.' } },
  { n: 5, wk: 'Read what you test', title: 'Explore with a mission',
    idea: 'Exploratory testing is learning the app while you test it. Pick one mission, give it ten minutes, and note what you tried.',
    do: { type: 'find', of: ['round', 'greek'], hint: 'Mission: everything about how the result is shown. Tick Round up. Type a name, then a Greek name.' } },
  { n: 6, wk: 'Read what you test', title: 'Severity and priority',
    idea: 'Severity is how much harm a bug does. Priority is how soon it should be fixed. A typo on the home page can be low severity and high priority.',
    do: { type: 'pick', qs: [
      { q: 'The page says "Each of 1 people". Severity?', o: ['Low', 'High', 'Critical'], a: 0, why: 'It looks careless, but nobody pays the wrong amount.' },
      { q: 'Over €100, a 15% tip adds €15 instead of €30. Severity?', o: ['Low', 'High'], a: 1, why: 'People pay the wrong amount, quietly, on the biggest bills.' },
    ] } },
  { n: 7, wk: 'Read what you test', title: 'Read an if',
    idea: 'You don\'t have to write code to test it, but reading it shows you where bugs hide. These are the shared words from Frequent Python: if, else, =, >, >=.',
    do: { type: 'line', qs: [
      { q: 'The tip should always be a percent. Which line breaks that for big bills?', a: 4 },
      { q: 'Which line refuses a 100% tip?', a: 1, why: '>= means "100 or more". To allow 100, the line would say > 100. One character is often the whole bug.' },
    ] } },
  { n: 8, wk: 'Read what you test', title: 'Plain-English tests',
    idea: 'Many teams write tests as Given, When, Then. This is Gherkin, and a tool called Cucumber turns each line into an automatic check.',
    do: { type: 'gherkin', ex: 'Given a bill of 40 euros and a tip of 10\nWhen 4 people split it\nThen each pays 11 euros', task: 'Write one scenario for zero people. What should the person see?' } },
  { n: 9, wk: 'Look under the screen', title: 'Check the data with SQL',
    idea: 'A screen can look right while the saved data is wrong. Testers ask the database directly, with SQL.',
    do: { type: 'sql' } },
  { n: 10, wk: 'Look under the screen', title: 'The app behind the app',
    idea: 'Apps talk to servers with requests. Every reply starts with a status code: 200 means OK, 400 means the request was wrong, 404 means not found, 500 means the server broke.',
    do: { type: 'api' } },
  { n: 11, wk: 'Look under the screen', title: 'Read an automated test',
    idea: 'Automated tests click and type for you, then check the result. You can read one with the words you already know.',
    do: { type: 'pw', qs: [
      { q: 'Which line checks the result?', a: 6 },
      { kind: 'pick', q: 'This test passes. Which of your eight bugs would it catch?', o: ['All of them', 'Only the rounding bug', 'None: it only tries ordinary numbers'], a: 2, why: 'Automation repeats what someone thought of. Your strange inputs are what it\'s missing.' },
    ] } },
  { n: 12, wk: 'Look under the screen', title: 'Test a real app',
    idea: 'Start a portfolio. Test one of your own Frequent apps and file a report about anything that confuses you, breaks or looks wrong.',
    do: { type: 'real', hint: 'Open Frequent Notes in another tab. Try a strange input in each box. In Reports, choose "Another app" before you save.' } },
];
const lessonDone = n => !!S.done[n];
const firstOpen = () => (L.find(l => !lessonDone(l.n)) || L[L.length - 1]).n;

function markDone(n) {
  if (S.done[n]) return;
  S.done[n] = ymd(); save(); addPts(5, 'lesson:' + n);
}

// ---------- Today ----------
function today() {
  const main = $('#main'); main.replaceChildren();
  if (!L.some(l => l.n === S.cur)) S.cur = firstOpen();
  const l = L.find(x => x.n === S.cur);
  const path = h('div', { class: 'path', role: 'list', 'aria-label': 'Lessons' });
  for (const x of L) {
    const b = h('button', { type: 'button', class: (lessonDone(x.n) ? 'done' : '') + (x.n === l.n ? ' cur' : ''), 'aria-label': `Lesson ${x.n}: ${x.title}${lessonDone(x.n) ? ', done' : ''}`, text: x.n });
    b.onclick = () => { S.cur = x.n; save(); today(); };
    path.append(b);
  }
  const box = h('section', { class: 'lesson' },
    h('p', { class: 'k', text: `Lesson ${l.n} of ${L.length} · ${l.wk}` }),
    h('h1', { text: l.title }),
    h('p', { class: 'idea', text: l.idea }));
  main.append(path, box);
  const step = h('div', { class: 'step' + (lessonDone(l.n) ? ' passed' : '') });
  box.append(step);
  const pass = () => {
    const was = lessonDone(l.n); markDone(l.n); step.classList.add('passed');
    if (step.querySelector('.pass-box')) return;
    const nx = L.find(x => x.n > l.n && !lessonDone(x.n)) || L.find(x => !lessonDone(x.n));
    const pb = h('div', { class: 'pass-box' }, h('b', { text: 'Done. ' }), nx ? `Next: ${nx.title}.` : 'You finished all twelve. Keep filing reports on real apps.');
    if (nx) pb.append(' ', h('button', { class: 'btn run', type: 'button', text: 'Next lesson', onclick: () => { S.cur = nx.n; save(); today(); scrollTo(0, 0); } }));
    step.append(pb);
    if (!was && !nx) addPts(10, 'finished');
  };
  PRACTICE[l.do.type](step, l, pass);
  if (lessonDone(l.n)) pass();
  main.append(h('p', { class: 'foot', text: '© 2026 Daniel Houlis. Frequent is a trademark of Daniel Houlis. Your progress stays in this browser.' }));
}

const PRACTICE = {
  find(step, l, pass) {
    const d = l.do;
    const need = d.of ? d.of : null;
    const got = need ? need.filter(id => S.found[id]) : Object.keys(S.found);
    step.append(h('h3', { text: need ? 'Find one of these bugs and report it' : 'Find a bug and report it' }), h('p', { text: d.hint }));
    const ok = need ? got.length > 0 : got.length >= (d.any || 1);
    if (ok) { step.append(h('p', { class: 'ok', text: 'Found: ' + got.map(bugTitle).join('; ') })); pass(); return; }
    step.append(h('div', { class: 'row' }, h('button', { class: 'btn run', type: 'button', text: 'Open Bug hunt', onclick: () => go('hunt') })));
  },
  pick(step, l, pass) { askAll(step, l, l.do.qs, pass); },
  line(step, l, pass) {
    let lang = S.lang || 'py';
    const seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Language' });
    const qs = h('div');
    const paint = () => {
      seg.replaceChildren(...[['py', 'Python'], ['js', 'JavaScript']].map(([k, t]) => h('button', { type: 'button', class: lang === k ? 'on' : '', text: t, onclick: () => { lang = k; S.lang = k; save(); paint(); } })));
      qs.replaceChildren(); askAll(qs, l, l.do.qs.map(q => Object.assign({ kind: 'line', lines: lang === 'py' ? SPLIT_PY : SPLIT_JS }, q)), pass);
    };
    step.append(h('h3', { text: 'Tap the line' }), h('p', { class: 'hint', text: 'The same bill splitter, in two languages. The words that matter are shared by both.' }), seg, qs);
    paint();
  },
  pw(step, l, pass) {
    step.append(h('h3', { text: 'A Playwright test, the kind that checks your Frequent apps' }));
    askAll(step, l, l.do.qs.map(q => Object.assign({ kind: 'line', lines: PW }, q)), pass);
  },
  gherkin(step, l, pass) {
    const k = 'g' + l.n;
    step.append(h('h3', { text: 'Example' }), h('div', { class: 'pre', text: l.do.ex }), h('p', { text: l.do.task }));
    const ta = h('textarea', { class: 'sqlbox', 'aria-label': 'Your scenario', rows: 4, spellcheck: 'false' });
    ta.value = S.ans[k] || 'Given a bill of 40 euros\nWhen 0 people split it\nThen ';
    const msg = h('p', { class: 'why-box' });
    const check = () => {
      const t = ta.value; S.ans[k] = t; save();
      const lines = t.split('\n').map(s => s.trim().toLowerCase());
      const has = w => lines.some(s => s.startsWith(w + ' ') && s.length > w.length + 3);
      const miss = ['given', 'when', 'then'].filter(w => !has(w));
      if (miss.length) { msg.textContent = 'Each of Given, When and Then needs its own line with something after it. Missing: ' + miss.join(', ') + '.'; return; }
      if (!/\b0\b|zero|no one|nobody/i.test(t)) { msg.textContent = 'Close. Make the When line about zero people.'; return; }
      msg.textContent = 'That is a real test. A team could automate it as written, and it would catch the Infinity bug.'; pass();
    };
    step.append(ta, h('div', { class: 'row' }, h('button', { class: 'btn run', type: 'button', text: 'Check', onclick: check })), msg);
  },
  sql(step, l, pass) {
    const TASKS = [
      { q: 'Show every saved bill where people is 0.', start: 'SELECT * FROM bills WHERE people = 0', ref: 'SELECT * FROM bills WHERE people = 0' },
      { q: 'Count the bills with a negative total.', start: 'SELECT COUNT(*) FROM bills WHERE ', ref: 'SELECT COUNT(*) FROM bills WHERE total < 0' },
    ];
    const k = 'sql' + l.n;
    const st = S.ans[k] || (S.ans[k] = { i: 0, code: {} });
    step.append(h('h3', { text: 'The bills table, as the splitter saved it' }), h('p', { class: 'hint', text: 'Columns: id, total, tip, people, each. SELECT picks columns, FROM names the table, WHERE keeps the rows you ask for.' }));
    const area = h('div'); step.append(area);
    loadSql().then(db => {
      const run = sql => { try { const r = db.exec(sql); return { r: r[0] || { columns: [], values: [] } }; } catch (e) { return { err: e.message }; } };
      const table = r => h('table', { class: 't' }, h('tr', {}, r.columns.map(c => h('th', { text: c }))), r.values.map(v => h('tr', {}, v.map(x => h('td', { text: x === null ? 'NULL' : String(x) })))));
      area.append(table(run('SELECT * FROM bills').r));
      const paint = () => {
        area.querySelectorAll('.sqlt').forEach(e => e.remove());
        TASKS.forEach((t, i) => {
          if (i > st.i) return;
          const box = h('div', { class: 'sqlt' }, h('p', { class: 'q', text: `${i + 1}. ${t.q}` }));
          const ta = h('textarea', { class: 'sqlbox', rows: 2, spellcheck: 'false', 'aria-label': 'SQL query' });
          ta.value = st.code[i] || t.start;
          const out = h('div', { class: 'why-box' });
          const go1 = () => {
            st.code[i] = ta.value; save();
            const m = run(ta.value); out.replaceChildren();
            if (m.err) { out.append(h('p', { class: 'hint', text: 'SQL could not read that: ' + m.err })); return; }
            out.append(table(m.r));
            const want = JSON.stringify(run(t.ref).r.values);
            if (JSON.stringify(m.r.values) === want) {
              out.append(h('p', { class: 'ok', text: i === 0 ? 'Right. Two bills were saved with Infinity in them: the screen bug reached the data.' : 'Right. The splitter saved bills nobody can pay.' }));
              if (st.i === i) { st.i = i + 1; save(); if (st.i >= TASKS.length) pass(); else paint(); }
            } else out.append(h('p', { class: 'hint', text: i === 1 ? 'Not yet. A negative total is total < 0.' : 'Not yet. Keep the WHERE line about people = 0.' }));
          };
          box.append(ta, h('div', { class: 'row' }, h('button', { class: 'btn run', type: 'button', text: 'Run', onclick: go1 })), out);
          area.append(box);
        });
      };
      paint();
      if (st.i >= TASKS.length) pass();
    }).catch(() => area.append(h('p', { class: 'hint', text: 'SQL could not load. Check the connection and open this lesson again.' })));
  },
  api(step, l, pass) {
    const REQ = [
      ['GET /split?total=40&tip=10&people=4', '200 OK', '{"each": 11.00}'],
      ['GET /split?total=40&tip=10&people=abc', '400 Bad Request', '{"error": "people must be a number"}'],
      ['GET /split?total=40&tip=10&people=0', '500 Internal Server Error', '{"error": "division by zero"}'],
      ['GET /splitt?total=40', '404 Not Found', '{"error": "no such page"}'],
    ];
    const k = 'api' + l.n; const seen = S.ans[k] || (S.ans[k] = []);
    const out = h('div', { class: 'pre', text: 'Send a request to see the reply.' });
    const qbox = h('div');
    step.append(h('h3', { text: 'Send each request' }), h('div', { class: 'api' }, REQ.map(([r, c, b], i) => h('button', { type: 'button', text: r, onclick: () => { out.textContent = c + '\n' + b; if (!seen.includes(i)) { seen.push(i); save(); } if (seen.length === REQ.length) ask(); } }))), out, qbox);
    const ask = () => { if (qbox.childElementCount) return; askAll(qbox, l, [{ q: 'people=0 got a 500. What does that tell you?', o: ['Nothing: 500 is normal', 'The server crashed on input it should have refused with a 400 and a clear message', 'The page address is wrong'], a: 1, why: 'A 400 says "you asked wrong". A 500 says "I broke". Bad input should never break the server, and you can report that without seeing any code.' }], pass); };
    if (seen.length === REQ.length) ask();
  },
  real(step, l, pass) {
    const other = S.reports.filter(r => r.app && r.app !== 'Bill splitter');
    step.append(h('h3', { text: 'File one report on a real app' }), h('p', { text: l.do.hint }));
    if (other.length) { step.append(h('p', { class: 'ok', text: `${other.length} report${other.length > 1 ? 's' : ''} on real apps. That is a portfolio.` })); pass(); return; }
    step.append(h('div', { class: 'row' }, h('a', { class: 'btn', href: '../notes/', target: '_blank', rel: 'noopener', text: 'Open Frequent Notes' }), h('button', { class: 'btn run', type: 'button', text: 'Write the report', onclick: () => { S.form = Object.assign(S.form || {}, { app: 'Another app', appName: 'Frequent Notes' }); save(); go('reports'); } })));
  },
};

// Questions: multiple choice or tap-a-line. All right in order → pass.
function askAll(el, l, qs, pass) {
  const k = 'q' + l.n; const st = S.ans[k] || (S.ans[k] = {});
  const wrap = h('div'); el.append(wrap);
  const paint = () => {
    wrap.replaceChildren();
    for (let i = 0; i < qs.length; i++) {
      const q = qs[i]; const right = st[i] === true;
      wrap.append(h('p', { class: 'q', text: q.q }));
      if (q.kind === 'line') {
        const box = h('div', { class: 'codepick', role: 'group', 'aria-label': 'Code lines' });
        q.lines.forEach((t, j) => {
          const b = h('button', { type: 'button', class: 'code-line' + (right && j === q.a ? ' right' : ''), text: t || ' ', disabled: right });
          b.onclick = () => { if (j === q.a) { st[i] = true; save(); paint(); check(); } else { b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 700); } };
          box.append(b);
        });
        wrap.append(box);
      } else {
        const box = h('div', { class: 'opts' });
        q.o.forEach((t, j) => {
          const b = h('button', { type: 'button', class: 'opt' + (right && j === q.a ? ' right' : ''), text: t, disabled: right });
          b.onclick = () => { if (j === q.a) { st[i] = true; save(); paint(); check(); } else b.classList.add('wrong'); };
          box.append(b);
        });
        wrap.append(box);
      }
      if (right && q.why) wrap.append(h('p', { class: 'why-box', text: q.why }));
      if (!right) break;
    }
  };
  const check = () => { if (qs.every((_, i) => st[i] === true)) pass(); };
  paint();
  if (qs.every((_, i) => st[i] === true)) pass();
}

let sqlP = null;
function loadSql() {
  if (sqlP) return sqlP;
  sqlP = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js';
    s.onload = () => initSqlJs({ locateFile: f => 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/' + f }).then(SQL => {
      const db = new SQL.Database();
      db.run(`CREATE TABLE bills (id INTEGER, total REAL, tip REAL, people INTEGER, each TEXT);
        INSERT INTO bills VALUES (1, 40, 10, 4, '11.00'), (2, 62.5, 15, 3, '23.96'), (3, 18, 0, 0, 'Infinity'), (4, -30, 10, 2, '-16.50'),
        (5, 120, 15, 4, '33.75'), (6, 12, 10, 1, '13.20'), (7, 55, 0, 0, 'Infinity'), (8, -5, 0, 1, '-5.00');`);
      res(db);
    }).catch(e => { sqlP = null; rej(e); });
    s.onerror = () => { sqlP = null; rej(new Error('load')); };
    document.head.append(s);
  });
  return sqlP;
}

// ---------- Bug hunt ----------
function hunt() {
  const main = $('#main'); main.replaceChildren();
  const f = S.fields || (S.fields = { total: '', tip: '', people: '', name: '', round: false });
  const n = Object.keys(S.found).length;
  const bar = h('div', { class: 'found', 'aria-hidden': 'true' }, BUGS.map(b => h('i', { class: S.found[b.id] ? 'on' : '' })));
  main.append(h('h1', { text: 'Bug hunt' }), h('p', { class: 'sub', text: `This bill splitter has 8 bugs. You have found ${n}. When something looks wrong, write it up below.` }), bar);
  const inp = (key, label, mode) => {
    const i = h('input', { type: 'text', inputmode: mode, autocomplete: 'off', id: 'f-' + key });
    i.value = f[key]; i.oninput = () => { f[key] = i.value; save(); };
    return h('label', { class: 'fld' }, label, i);
  };
  const rb = h('input', { type: 'checkbox', id: 'f-round' }); rb.checked = !!f.round; rb.onchange = () => { f.round = rb.checked; save(); };
  const res = h('div', { class: 'res', id: 'res', 'aria-live': 'polite', text: 'The result shows here.' });
  const app = h('section', { class: 'split', 'aria-label': 'Bill splitter, the app you are testing' },
    h('div', { class: 'ttl' }, h('b', { text: 'Taverna bill splitter' }), h('span', { class: 'hint', text: 'the app you test' })),
    h('div', { class: 'two' }, inp('total', 'Bill (€)', 'decimal'), inp('tip', 'Tip % (0 to 100)', 'decimal')),
    h('div', { class: 'two' }, inp('people', 'People', 'numeric'), inp('name', 'Who paid? (optional)', 'text')),
    h('label', { class: 'chk' }, rb, 'Round up to whole euros'),
    h('button', { class: 'btn run', type: 'button', text: 'Split', id: 'splitB', onclick: () => {
      const r = runSplit(f);
      S.last = r.trig; S.lastIn = { ...f }; save(); addPts(1, 'split:' + JSON.stringify(f));
      res.className = 'res' + (r.err ? ' err' : '');
      res.replaceChildren(...(r.err ? [r.err] : r.lines.map(t => h('div', { text: t }))));
    } }),
    res);
  if (S.form) S.form.app = 'Bill splitter';
  main.append(app, reportForm('Bill splitter'));
}

// ---------- Report form (shared by Bug hunt and Reports) ----------
const PRESCRIBE = /\b(fix(ed)? (it|this|the)|fix by|change the code|you (need|should) to|should (use|change|replace)|just (add|use|change)|replace \w+ with|parse(int|float)|math\.(floor|ceil|round)|line \d+)\b/i;
function reportForm(defApp) {
  const fm = S.form || (S.form = {});
  if (!fm.app) fm.app = defApp || 'Bill splitter';
  if (!fm.steps) fm.steps = '1. ';
  const wrap = h('section', { class: 'form step', 'aria-label': 'Bug report' }, h('h2', { text: 'Write a bug report', style: 'margin-top:0' }));
  const field = (key, label, tip, tag = 'input') => {
    const e = tag === 'textarea' ? h('textarea', { id: 'r-' + key }) : h('input', { type: 'text', id: 'r-' + key });
    e.value = fm[key] || ''; e.oninput = () => { fm[key] = e.value; save(); paintChecks(); };
    return [h('label', { for: 'r-' + key }, h('b', { text: label }), tip ? ' · ' + tip : ''), e];
  };
  const appSeg = h('div', { class: 'seg', role: 'group', 'aria-label': 'What did you test?' });
  const appName = h('input', { type: 'text', id: 'r-appName', placeholder: 'Which app?' });
  appName.value = fm.appName || ''; appName.oninput = () => { fm.appName = appName.value; save(); };
  const paintApp = () => {
    appSeg.replaceChildren(...['Bill splitter', 'Another app'].map(a => h('button', { type: 'button', class: fm.app === a ? 'on' : '', text: a, onclick: () => { fm.app = a; save(); wrap.replaceWith(reportForm(defApp)); } })));
    appName.hidden = fm.app !== 'Another app';
  };
  paintApp();
  const sev = h('div', { class: 'sev', role: 'group', 'aria-label': 'Severity' });
  const paintSev = () => sev.replaceChildren(...['Low', 'Medium', 'High', 'Critical'].map(s => h('button', { type: 'button', class: 'chip' + (fm.sev === s ? ' on' : ''), text: s, onclick: () => { fm.sev = s; save(); paintSev(); } })));
  paintSev();
  const checks = h('ul', { class: 'checks' });
  const all = () => [fm.title, fm.steps, fm.expected, fm.actual].join('\n');
  const stepsOk = () => (fm.steps || '').replace(/^\s*\d+\.\s*$/gm, '').trim().length > 8;
  const paintChecks = () => {
    const items = [
      [!!(fm.title || '').trim(), 'A short title that names the problem'],
      [stepsOk(), 'Steps anyone can repeat, with the exact values you typed'],
      [!!(fm.expected || '').trim(), 'What should have happened'],
      [!!(fm.actual || '').trim(), 'What did happen, word for word'],
      [!PRESCRIBE.test(all()), 'Describes the behavior; leaves the fix to the developer'],
    ];
    checks.replaceChildren(...items.map(([ok, t], i) => h('li', { class: ok ? 'ok' : (i === 4 ? 'no' : '') , text: i === 4 && !ok ? 'Describe, don\'t prescribe: take out the fix and say what you saw' : t })));
    return items.every(x => x[0]);
  };
  const fill = fm.app === 'Bill splitter' ? h('button', { type: 'button', class: 'btn', text: 'Copy my last try into the steps', onclick: () => {
    const x = S.lastIn; if (!x || !(x.total || x.people || x.tip)) { toast('Tap Split first'); return; } const st = ['Open the bill splitter.'];
    if (x.total) st.push(`Type ${x.total} in Bill.`); if (x.tip) st.push(`Type ${x.tip} in Tip %.`); if (x.people) st.push(`Type ${x.people} in People.`);
    if (x.name) st.push(`Type ${x.name} in Who paid.`); if (x.round) st.push('Tick Round up.'); st.push('Tap Split.');
    fm.steps = st.map((s, i) => `${i + 1}. ${s}`).join('\n'); fm.actual = fm.actual || ($('#res') ? $('#res').innerText.trim() : ''); save();
    wrap.replaceWith(reportForm(defApp));
  } }) : null;
  const msg = h('p', { class: 'why-box' });
  const saveB = h('button', { class: 'btn run', type: 'button', text: 'Save report', onclick: () => {
    if (!paintChecks()) {
      if (PRESCRIBE.test(all()) && fm.title && stepsOk() && fm.expected && fm.actual) { msg.replaceChildren('This report tells the developer how to fix it. Take that out, or ', h('button', { type: 'button', class: 'btn', text: 'save it anyway', onclick: () => commit(true) })); return; }
      msg.textContent = 'Fill in the empty parts first. They are what make a report useful.'; return;
    }
    commit(false);
  } });
  const commit = presc => {
    const matched = fm.app === 'Bill splitter' ? (S.last || []).slice() : [];
    const fresh = matched.filter(id => !S.found[id]);
    const r = { id: Date.now(), at: new Date().toISOString(), app: fm.app === 'Another app' ? (fm.appName || 'Another app').trim() : 'Bill splitter', title: fm.title.trim(), steps: fm.steps.trim(), expected: fm.expected.trim(), actual: fm.actual.trim(), sev: fm.sev || '', env: envLine(), bugs: matched, presc };
    S.reports.unshift(r);
    for (const id of fresh) S.found[id] = r.id;
    S.last = []; S.form = { app: fm.app === 'Another app' ? 'Another app' : 'Bill splitter', appName: fm.appName, steps: '1. ' }; save();
    addPts(3, 'report:' + r.id); if (fresh.length) addPts(5 * fresh.length, 'found:' + fresh.join());
    toast(fresh.length ? `New bug found: ${bugTitle(fresh[0])}` : 'Report saved');
    VIEWS[tab]();
  };
  wrap.append(h('label', {}, h('b', { text: 'What did you test?' })), appSeg, appName,
    ...field('title', 'Title', 'e.g. Zero people shows €Infinity'),
    ...field('steps', 'Steps', 'numbered, with the values you typed', 'textarea'), fill && h('div', { class: 'row' }, fill),
    ...field('expected', 'Expected'), ...field('actual', 'Actual'),
    h('label', {}, h('b', { text: 'Severity' }), ' · how much harm it does'), sev,
    checks, h('div', { class: 'row' }, saveB), msg,
    h('p', { class: 'hint', text: 'Your browser and screen size are added for you. Developers always ask.' }));
  paintChecks();
  return wrap;
}
const envLine = () => { const u = navigator.userAgent; const b = /Edg\//.test(u) ? 'Edge' : /Chrome\//.test(u) ? 'Chrome' : /Firefox\//.test(u) ? 'Firefox' : /Safari\//.test(u) ? 'Safari' : 'Browser'; const os = /iPhone|iPad/.test(u) ? 'iOS' : /Android/.test(u) ? 'Android' : /Mac/.test(u) ? 'Mac' : /Windows/.test(u) ? 'Windows' : /Linux/.test(u) ? 'Linux' : ''; return `${b}${os ? ' on ' + os : ''}, ${innerWidth}×${innerHeight}`; };

// ---------- Reports ----------
function reports() {
  const main = $('#main'); main.replaceChildren();
  const n = Object.keys(S.found).length;
  main.append(h('h1', { text: 'Reports' }), h('p', { class: 'sub', text: S.reports.length ? `${S.reports.length} report${S.reports.length > 1 ? 's' : ''}. Bill splitter bugs found: ${n} of 8.` : 'Your reports collect here. Copy one into an email, a Jira ticket or a portfolio.' }));
  if (n) main.append(h('div', { class: 'step' }, h('h3', { text: 'Bugs you found' }), h('ul', {}, BUGS.filter(b => S.found[b.id]).map(b => h('li', { text: b.title }))), n < 8 ? h('p', { class: 'hint', text: `${8 - n} still hiding. Groups left: ${[...new Set(BUGS.filter(b => !S.found[b.id]).map(b => b.group))].join(', ')}.` }) : h('p', { class: 'ok', text: 'All eight. Now try a real app.' })));
  for (const r of S.reports) {
    const md = `## ${r.title}\n\nApp: ${r.app}\nSeverity: ${r.sev || 'not set'}\nWhere: ${r.env}\n\n### Steps\n${r.steps}\n\n### Expected\n${r.expected}\n\n### Actual\n${r.actual}\n`;
    main.append(h('article', { class: 'rep' },
      h('h3', { text: r.title }),
      h('p', { class: 'meta', text: `${r.app} · ${r.sev || 'severity not set'} · ${new Date(r.at).toLocaleDateString()} · ${r.env}` }),
      r.bugs && r.bugs.length ? r.bugs.map(id => h('span', { class: 'tag', text: bugTitle(id) })) : null,
      h('dl', {}, h('dt', { text: 'Steps' }), h('dd', { text: r.steps }), h('dt', { text: 'Expected' }), h('dd', { text: r.expected }), h('dt', { text: 'Actual' }), h('dd', { text: r.actual })),
      h('div', { class: 'row' },
        h('button', { class: 'btn', type: 'button', text: 'Copy', onclick: () => navigator.clipboard.writeText(md).then(() => toast('Copied as Markdown'), () => toast('Could not copy here')) }),
        h('button', { class: 'btn', type: 'button', text: 'Delete', onclick: () => { const i = S.reports.indexOf(r); S.reports.splice(i, 1); save(); reports(); toast('Deleted'); undoBar(() => { S.reports.splice(i, 0, r); save(); reports(); }); } }))));
  }
  main.append(reportForm(S.form && S.form.app === 'Another app' ? 'Another app' : 'Bill splitter'));
}
function undoBar(fn) {
  const el = $('#toast'); el.replaceChildren('Deleted. ', h('button', { type: 'button', class: 'btn', text: 'Undo', onclick: () => { fn(); el.classList.remove('on'); } }));
  el.style.pointerEvents = 'auto'; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => { el.classList.remove('on'); el.style.pointerEvents = ''; }, 5000);
}

// ---------- Menu ----------
function career() {
  const A = (t, u) => h('a', { href: u, target: '_blank', rel: 'noopener', text: t });
  const box = h('div', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Where testing leads' },
    h('h2', { text: 'Where testing leads', style: 'margin-top:0' }),
    h('p', {}, 'Most entry testing jobs don\'t ask you to write code. They ask you to find problems and describe them clearly (', A('Coding Temple', 'https://www.codingtemple.com/blog/how-to-become-a-qa-tester-your-step-by-step-guide-to-breaking-in/'), ').'),
    h('p', {}, 'In 2026, even manual roles list API testing, SQL and basic automation literacy, which is lessons 9 to 11 here (', A('SoftwareTestPilot', 'https://www.softwaretestpilot.com/qa-job-market-report'), '). Pure click-through jobs are shrinking, while testers who also automate are growing (', A('SQA Experts', 'https://www.sqaexperts.com/is-qa-a-dying-career-what-2026-job-market-data-actually-shows'), ').'),
    h('p', {}, 'The usual first certificate is ISTQB Foundation Level. Its syllabus asks for clear defect reports that compare expected with actual results, exactly what you practice here (', A('ISTQB syllabus', 'https://istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf'), ').'),
    h('p', { class: 'hint', text: 'Path: tester → QA engineer (adds automation) → SDET (writes test frameworks). Frequent Python covers the code reading each step needs.' }),
    h('div', { class: 'row' }, h('button', { class: 'btn run', type: 'button', text: 'Close', onclick: () => wrap.remove() })));
  const wrap = h('div', { class: 'modal', onclick: e => { if (e.target === wrap) wrap.remove(); } }, box);
  document.body.append(wrap);
}
function backup() {
  const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
  const a = h('a', { href: URL.createObjectURL(blob), download: `frequent-testing-${ymd()}.json` }); document.body.append(a); a.click(); a.remove();
}
$('#restore').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  f.text().then(t => {
    const b = JSON.parse(t); if (!b || typeof b !== 'object' || !('found' in b)) throw 0;
    const ids = new Set(S.reports.map(r => r.id));
    S.reports = S.reports.concat((b.reports || []).filter(r => !ids.has(r.id))).sort((x, y) => y.id - x.id);
    S.found = Object.assign({}, b.found, S.found); S.done = Object.assign({}, b.done, S.done);
    for (const [d, n] of Object.entries(b.pts || {})) S.pts[d] = Math.max(S.pts[d] || 0, n);
    save(); paintMo(); go(tab); toast('Backup added. Nothing was erased.');
  }).catch(() => toast('That file is not a Frequent Testing backup.'));
  e.target.value = '';
};
$('#menu').addEventListener('click', e => { const a = e.target.dataset.act; if (a === 'backup') backup(); if (a === 'career') career(); if (a) $('#menu').hidden = true; });
$('#mo').onclick = () => toast('Momentum: points for practice, fading a little each day you rest.');

// ---------- Tabs ----------
let tab = 'today';
const VIEWS = { today, hunt, reports };
function go(t) { tab = t; document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t)); VIEWS[t](); scrollTo(0, 0); }
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => go(b.dataset.tab));
$('#menuB').onclick = e => { e.stopPropagation(); $('#menu').hidden = !$('#menu').hidden; };
document.addEventListener('click', e => { if (!e.target.closest('#menu')) $('#menu').hidden = true; });
paintMo();
S.cur = S.cur && !lessonDone(S.cur) ? S.cur : firstOpen();
go('today');
