// Frequent Studio. © 2026 Daniel Ilias Houlis. All rights reserved. Frequent is a trademark of Daniel Ilias Houlis.
// A narration sandbox first, a storefront later. Practice reads with intention cues, honest level checks against
// audiobook specs, and a short check-in after every take. The storefront opens only when skill, demand, joy and
// rent checks are all green. Takes' details live in localStorage "fst"; the audio itself lives in IndexedDB.
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
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const db1 = n => n == null || !isFinite(n) ? '–' : (Math.round(n * 10) / 10).toFixed(1);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ---------- State ----------
const KEY = 'fst';
const blank = () => ({ v: 1, takes: [], signals: [], rent: false, skip: 0, skipDay: '' });
let S = blank();
try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && typeof s === 'object') S = Object.assign(blank(), s); } catch (e) { /* keep old text untouched */ }
let saveT; const save = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Could not save in this browser. Save a backup file from the menu.'); } }, 100); };
const readById = id => READS.find(r => r.id === id);

// ---------- Audio storage (IndexedDB) ----------
let dbP;
const idb = () => dbP || (dbP = new Promise((res, rej) => { const r = indexedDB.open('frequent-studio', 1); r.onupgradeneeded = () => r.result.createObjectStore('audio'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
const tx = (mode, fn) => idb().then(d => new Promise((res, rej) => { const t = d.transaction('audio', mode); const q = fn(t.objectStore('audio')); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }));
const putAudio = (id, blob) => tx('readwrite', s => s.put(blob, id)).catch(() => null);
const getAudio = id => tx('readonly', s => s.get(id)).catch(() => null);
const delAudio = id => tx('readwrite', s => s.delete(id)).catch(() => null);

// ---------- Level analysis (same method as Audacity's ACX Check) ----------
const SPEC = { rmsMin: -23, rmsMax: -18, peakMax: -3, floorMax: -60, floorMin: -90, rawPeakMax: -6 };
const toDb = x => x > 0 ? 20 * Math.log10(x) : -Infinity;
async function analyze(blob) {
  const buf = await blob.arrayBuffer();
  const AC = window.AudioContext || window.webkitAudioContext; const ac = new AC();
  let ab; try { ab = await new Promise((res, rej) => { const p = ac.decodeAudioData(buf, res, rej); if (p && p.then) p.then(res, rej); }); } finally { ac.close && ac.close(); }
  const c = ab.numberOfChannels, n = ab.length, sr = ab.sampleRate, ch = [];
  for (let i = 0; i < c; i++) ch.push(ab.getChannelData(i));
  let peak = 0, sum = 0; const sq = new Float64Array(n);
  for (let j = 0; j < n; j++) { let m = 0; for (let i = 0; i < c; i++) { const v = ch[i][j]; const a = v < 0 ? -v : v; if (a > peak) peak = a; m += v * v; } m /= c; sq[j] = m; sum += m; }
  // Noise floor: quietest 0.4 s window, stepped every 0.1 s. Skip the first 0.15 s, where a recorder may click.
  const win = Math.round(sr * 0.4), step = Math.round(sr * 0.1), start = Math.min(n, Math.round(sr * 0.15));
  let floor = null;
  if (n - start >= win) {
    const pre = new Float64Array(n + 1); for (let j = 0; j < n; j++) pre[j + 1] = pre[j] + sq[j];
    let lo = Infinity; for (let s = start; s + win <= n; s += step) { const m = (pre[s + win] - pre[s]) / win; if (m < lo) lo = m; }
    floor = toDb(Math.sqrt(lo));
  }
  return { dur: n / sr, peak: toDb(peak), rms: toDb(Math.sqrt(sum / n)), floor };
}
// kind: 'raw' (unmastered: needs headroom and a quiet room) or 'master' (finished file: full audiobook spec)
function grade(m, kind) {
  const floorOk = m.floor != null && m.floor <= SPEC.floorMax;
  const peakOk = kind === 'master' ? m.peak <= SPEC.peakMax : m.peak <= SPEC.rawPeakMax;
  const rmsOk = kind === 'master' ? (m.rms >= SPEC.rmsMin && m.rms <= SPEC.rmsMax) : null;
  return { floorOk, peakOk, rmsOk, clean: floorOk && peakOk && (kind !== 'master' || rmsOk) };
}
function feedback(m, kind) {
  const g = grade(m, kind), good = [], fix = [];
  if (m.floor == null) fix.push('Too short to measure the room. Leave a second of silence at the start and end.');
  else if (g.floorOk) good.push(m.floor < SPEC.floorMin ? `Noise floor ${db1(m.floor)} dB is digital silence. It passes, but real room tone between sentences sounds more natural.` : `Noise floor ${db1(m.floor)} dB. Your room is quiet enough for audiobooks.`);
  else fix.push(`Noise floor ${db1(m.floor)} dB is ${db1(m.floor - SPEC.floorMax)} dB above the −60 limit. Listen for fans, the fridge or computer hum, and treat the source before using noise reduction.`);
  if (kind === 'master') {
    if (g.peakOk) good.push(`Peaks ${db1(m.peak)} dB, under the −3 ceiling.`); else fix.push(`Peaks reach ${db1(m.peak)} dB. Use a limiter so nothing goes above −3 dB.`);
    if (g.rmsOk) good.push(`RMS ${db1(m.rms)} dB, inside the −23 to −18 window.`);
    else if (m.rms < SPEC.rmsMin) fix.push(`RMS ${db1(m.rms)} dB is ${db1(SPEC.rmsMin - m.rms)} dB too quiet. Limit the peaks first, then raise the whole file.`);
    else fix.push(`RMS ${db1(m.rms)} dB is ${db1(m.rms - SPEC.rmsMax)} dB too loud. Lower the overall gain.`);
  } else {
    if (g.peakOk) good.push(`Peaks ${db1(m.peak)} dB. That leaves headroom for mastering.`); else fix.push(`Peaks reach ${db1(m.peak)} dB. Turn the input gain down a little so there is room to master later.`);
    good.push(`RMS ${db1(m.rms)} dB. Raw takes usually sit low; you raise this when mastering.`);
  }
  return { good, fix };
}

// ---------- Which read today ----------
const benchDue = () => { const b = S.takes.filter(t => t.r === 'bench'); return !b.length || daysBetween(b[b.length - 1].d, ymd()) >= 7; };
function todayRead() {
  const t = ymd(); if (S.skipDay !== t) { S.skip = 0; S.skipDay = t; }
  const pool = READS.filter(r => !r.bench);
  const lastG = {}; for (const k of S.takes) { const r = readById(k.r); if (r) lastG[r.g] = k.d; }
  const age = g => lastG[g] ? daysBetween(lastG[g], t) : 99;
  const seed = [...t].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const done = new Set(S.takes.map(k => k.r));
  const order = pool.slice().sort((a, b) => (done.has(a.id) - done.has(b.id)) || (age(b.g) - age(a.g)) || (((seed ^ a.id.length * 97) % 13) - ((seed ^ b.id.length * 97) % 13)));
  const list = benchDue() ? [readById('bench'), ...order] : order;
  return list[S.skip % list.length];
}

// ---------- Gates ----------
const last30 = () => S.takes.filter(k => daysBetween(k.d, ymd()) < 30);
function gates() {
  const clean = S.takes.filter(k => k.clean);
  const mastered = clean.filter(k => k.kind === 'master');
  const genres = new Set(clean.map(k => (readById(k.r) || {}).g).filter(Boolean));
  const recent = S.takes.slice(-5); const avgFeel = recent.length ? recent.reduce((a, k) => a + (k.feel || 0), 0) / recent.length : 0;
  const skill = { clean: clean.length, mastered: mastered.length, genres: genres.size, avgFeel, n: recent.length };
  skill.ok = skill.clean >= 10 && skill.mastered >= 3 && skill.genres >= 3 && skill.n >= 5 && avgFeel >= 2;
  const pilots = S.signals.filter(s => s.k === 'pilot');
  const demand = { n: S.signals.length, pilots: pilots.length, earned: pilots.reduce((a, s) => a + (+s.amt || 0), 0) };
  demand.ok = demand.n >= 3 && demand.pilots >= 1;
  const l = last30(); const want = l.filter(k => k.why === 'want').length;
  const joy = { n: l.length, share: l.length ? want / l.length : 0, feel: l.length ? l.reduce((a, k) => a + (k.feel || 0), 0) / l.length : 0 };
  joy.ok = joy.n >= 8 && joy.share >= 0.7;
  const rent = { ok: !!S.rent };
  return { skill, demand, joy, rent, open: skill.ok && demand.ok && joy.ok && rent.ok };
}
const pullBack = () => { const j = gates().joy; return j.n >= 5 && (j.share < 0.6 || j.feel < 1.8); };
const paintMode = () => { const m = $('#mode'); const o = gates().open; m.textContent = o ? 'Storefront open' : 'Sandbox'; m.classList.toggle('shop', o); };

// ---------- Toast ----------
let toastT;
function toast(t, undo) {
  const el = $('#toast'); $('#toastT').textContent = t; const u = $('#toastU');
  u.hidden = !undo; u.onclick = () => { undo && undo(); el.classList.remove('on'); };
  el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), undo ? 6000 : 3500);
}

// ---------- Recorder ----------
const R = { on: false, rec: null, stream: null, chunks: [], t0: 0, raf: 0, ac: null, an: null, maxPk: 0 };
const pickMime = () => (window.MediaRecorder && ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg'].find(m => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m))) || '';
async function startRec(read) {
  if (!navigator.mediaDevices || !window.MediaRecorder) { toast('This browser cannot record. Use "Check a file" with a take from your DAW.'); return; }
  try {
    R.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 } });
  } catch (e) { toast('Microphone permission was not granted.'); return; }
  const mime = pickMime(); R.chunks = []; R.read = read; R.maxPk = 0;
  R.rec = new MediaRecorder(R.stream, mime ? { mimeType: mime } : undefined);
  R.rec.ondataavailable = e => e.data && e.data.size && R.chunks.push(e.data);
  R.rec.onstop = finishRec;
  const AC = window.AudioContext || window.webkitAudioContext; R.ac = new AC();
  const src = R.ac.createMediaStreamSource(R.stream); R.an = R.ac.createAnalyser(); R.an.fftSize = 2048; src.connect(R.an);
  R.rec.start(250); R.on = true; R.t0 = performance.now(); paintRec(); meterLoop();
}
function stopRec() { if (R.rec && R.on) { R.on = false; R.rec.stop(); } }
function meterLoop() {
  const data = new Float32Array(R.an.fftSize);
  const tick = () => {
    if (!R.on) return;
    R.an.getFloatTimeDomainData(data); let pk = 0; for (const v of data) { const a = Math.abs(v); if (a > pk) pk = a; }
    R.maxPk = Math.max(R.maxPk, pk);
    const db = toDb(pk); const pct = Math.max(0, Math.min(100, (db + 60) / 60 * 100));
    const bar = $('#mBar'); if (bar) { bar.style.width = pct + '%'; bar.className = db > -3 ? 'clip' : db > -6 ? 'hot' : ''; }
    const cl = $('#clock'); if (cl) cl.textContent = mmss((performance.now() - R.t0) / 1000);
    R.raf = requestAnimationFrame(tick);
  };
  tick();
}
async function finishRec() {
  cancelAnimationFrame(R.raf); R.stream.getTracks().forEach(t => t.stop()); try { R.ac.close(); } catch (e) { }
  const blob = new Blob(R.chunks, { type: (R.rec && R.rec.mimeType) || 'audio/webm' });
  paintRec();
  if (blob.size < 2000) { toast('That take was too short to keep.'); return; }
  toast('Checking levels…');
  let m; try { m = await analyze(blob); } catch (e) { m = { dur: (performance.now() - R.t0) / 1000, peak: toDb(R.maxPk), rms: null, floor: null }; }
  checkIn({ blob, m, kind: 'raw', src: 'rec', r: R.read.id });
}
function paintRec() {
  const b = $('#recB'); if (!b) return;
  b.classList.toggle('on', R.on); b.lastChild.textContent = R.on ? 'Stop' : 'Record';
  $('#recHint').textContent = R.on ? 'Leave a second of room tone before you start and after you finish.' : sessionHint();
  if (!R.on) { $('#mBar').style.width = '0'; $('#clock').textContent = '0:00'; }
}
const T_OPEN = Date.now();
const sessionHint = () => { const m = Math.floor((Date.now() - T_OPEN) / 60000); return m >= 35 ? `You've been in the studio ${m} minutes. A good place to stop; short blocks keep this sustainable.` : 'Raw take. Levels are checked for headroom and room noise.'; };

// ---------- Check-in sheet ----------
function sheet(...kids) {
  const wrap = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', onclick: e => { if (e.target === wrap) close(); } }, h('div', {}, ...kids));
  const close = () => { wrap.remove(); document.removeEventListener('keydown', esc); };
  const esc = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', esc); document.body.append(wrap); return close;
}
function resultTiles(m, kind) {
  const g = grade(m, kind);
  const tile = (ok, val, lbl) => h('div', { class: ok == null ? 'na' : ok ? 'ok' : 'no' }, h('b', { text: db1(val) }), h('span', { text: lbl }));
  return h('div', { class: 'res' },
    tile(g.rmsOk, m.rms, kind === 'master' ? 'RMS · −23 to −18' : 'RMS · info'),
    tile(g.peakOk, m.peak, kind === 'master' ? 'Peak · under −3' : 'Peak · under −6'),
    tile(m.floor == null ? null : g.floorOk, m.floor, 'Noise floor · under −60'));
}
function checkIn(take) {
  let why = null, feel = null; const url = URL.createObjectURL(take.blob);
  const read = readById(take.r);
  const fbBox = h('div');
  const paintFb = () => { const f = feedback(take.m, take.kind); fbBox.replaceChildren(resultTiles(take.m, take.kind), h('ul', { class: 'fb' }, f.good.map(t => h('li', { text: t })), f.fix.map(t => h('li', { text: t })))); };
  paintFb();
  const kindRow = take.src === 'file' ? h('div', {}, h('p', { class: 'lab', text: 'This file is' }), h('div', { class: 'chips feel' },
    ...[['raw', 'A raw take'], ['master', 'Mastered and finished']].map(([k, t]) => h('button', { class: 'chip' + (take.kind === k ? ' on' : ''), text: t, onclick: e => { take.kind = k; [...e.target.parentNode.children].forEach(c => c.classList.toggle('on', c === e.target)); paintFb(); } })))) : null;
  const readSel = take.src === 'file' ? h('select', { class: 'inp', onchange: e => { take.r = e.target.value; } }, h('option', { value: '', text: 'Something else (not from the app)' }), READS.map(r => h('option', { value: r.id, text: `${r.t} · ${GENRES[r.g]}`, selected: r.id === take.r }))) : null;
  const choose = (opts, set) => h('div', { class: 'chips feel' }, ...opts.map(([k, t]) => h('button', { class: 'chip', text: t, onclick: e => { set(k); [...e.target.parentNode.children].forEach(c => c.classList.toggle('on', c === e.target)); warn.textContent = ''; } })));
  const note = h('input', { class: 'inp', placeholder: 'Optional note: a word to look up, what to try next time' });
  const warn = h('p', { class: 'hint', role: 'status' });
  const close = sheet(
    h('div', { class: 'sh-h' }, h('h2', { text: read ? read.t : take.name || 'Your take' }), h('button', { class: 'close', 'aria-label': 'Discard', text: '×', onclick: () => { URL.revokeObjectURL(url); close(); } })),
    h('p', { class: 'sh-cue', text: `${mmss(take.m.dur || 0)} · ${take.src === 'rec' ? 'recorded here' : take.name}` }),
    h('audio', { controls: true, src: url, preload: 'metadata' }),
    kindRow, readSel ? h('div', {}, h('p', { class: 'lab', text: 'Which read was it?' }), readSel) : null,
    fbBox,
    h('p', { class: 'lab', text: 'Why did you come in today?' }),
    choose([['want', 'I wanted to'], ['should', 'I felt I should'], ['due', 'A deadline or client']], v => why = v),
    h('p', { class: 'lab', text: 'How did it feel?' }),
    choose([[1, 'Drained'], [2, 'Okay'], [3, 'Lit up']], v => feel = v),
    h('p', { class: 'lab', text: 'Note' }), note, warn,
    h('div', { class: 'row', style: 'margin-top:14px' },
      h('button', { class: 'btn go wide', text: 'Keep this take', onclick: async () => {
        if (!why || !feel) { warn.textContent = 'Two quick taps above, then keep it. They power the joy check.'; return; }
        const g = grade(take.m, take.kind);
        const k = { id: uid(), d: ymd(), t: Date.now(), r: take.r || '', name: take.name || '', src: take.src, kind: take.kind, dur: Math.round(take.m.dur * 10) / 10,
          rms: take.m.rms, peak: take.m.peak, floor: take.m.floor, clean: g.clean, why, feel, note: note.value.trim() };
        const stored = take.blob.size < 40e6 ? await putAudio(k.id, take.blob) : null; k.audio = stored !== null && take.blob.size < 40e6;
        S.takes.push(k); save(); URL.revokeObjectURL(url); close(); paintMode();
        toast(g.clean ? 'Kept. Clean take.' : 'Kept. The notes above say what to adjust next time.');
        render();
      } }))
  );
}
function pickFile() {
  const inp = h('input', { type: 'file', accept: 'audio/*,.wav,.mp3,.m4a,.aif,.aiff,.flac,.ogg,.webm' });
  inp.onchange = async () => {
    const f = inp.files[0]; if (!f) return; toast('Checking levels…');
    try { const m = await analyze(f); checkIn({ blob: f, m, kind: /master|final|acx/i.test(f.name) ? 'master' : 'raw', src: 'file', name: f.name, r: '' }); }
    catch (e) { toast('This browser could not read that file. Try WAV or MP3.'); }
  };
  inp.click();
}

// ---------- Views ----------
const main = $('#main');
const show = (...kids) => main.replaceChildren(...kids.flat().filter(k => k != null && k !== false));
function studio() {
  const r = todayRead();
  const g = gates();
  const head = h('div', {}, h('h1', { text: 'Today’s read' }), h('p', { class: 'sub', text: 'One read, at your pace. Nothing here is for sale; this is the sandbox.' }));
  const card = h('section', { class: 'read' },
    h('p', { class: 'k', text: GENRES[r.g] }), h('h3', { text: r.t }), h('p', { class: 'src', text: r.src }),
    ...r.p.map(([i, txt]) => h('div', { class: 'para' }, h('span', { class: 'int ' + i, title: INTENTS[i][1], text: INTENTS[i][0] }), h('p', { text: txt }))),
    h('div', { class: 'row', style: 'margin-top:10px' }, h('button', { class: 'btn ghost', text: 'A different read', onclick: () => { S.skip++; save(); render(); } }), h('button', { class: 'btn ghost', text: 'Check a file from my DAW', onclick: pickFile })));
  const bench = r.bench ? h('div', { class: 'bench', text: 'Benchmark week. Record this same read once a week; in Takes you can play your first one next to your latest.' }) : null;
  const pull = pullBack() ? pullCard() : null;
  const intents = h('details', { class: 'more' }, h('summary', { text: 'Intention without big emotion' }),
    h('p', { class: 'hint', text: 'Before each paragraph, read its tag. It tells you the job of the paragraph, so emphasis comes from structure rather than from performing a feeling.' }),
    h('div', { class: 'list' }, Object.entries(INTENTS).map(([k, [n, d]]) => h('div', { class: 'tk' }, h('span', { class: 'int ' + k, style: 'width:6em;flex:none', text: n }), h('div', { class: 'what' }, h('small', { text: d }))))));
  const recBar = h('section', { class: 'rec', 'aria-label': 'Recorder' },
    h('div', { class: 'row' }, h('button', { class: 'recb', id: 'recB', onclick: () => R.on ? stopRec() : startRec(r) }, h('span', { text: 'Record' })), h('span', { class: 'clock', id: 'clock', text: '0:00' })),
    h('div', { class: 'meter', 'aria-hidden': 'true' }, h('i', { id: 'mBar' }), h('b', { style: 'left:90%' })),
    h('p', { class: 'hint', id: 'recHint', style: 'margin:0', text: sessionHint() }));
  const recent = S.takes.slice(-3).reverse();
  const recentBox = recent.length ? [h('h2', { text: 'Latest takes' }), h('div', { class: 'list' }, recent.map(takeRow))] : null;
  show(head, pull, bench, card, recBar, intents, recentBox, foot());
  paintRec();
}
function dots(k) { const g = grade(k, k.kind); return h('span', { class: 'dots', 'aria-label': k.clean ? 'clean' : 'needs adjusting' }, [g.rmsOk, g.peakOk, g.floorOk].filter(x => x !== null).map(ok => h('i', { class: ok ? 'ok' : 'no' }))); }
const WHY = { want: 'wanted to', should: 'felt I should', due: 'deadline' }, FEEL = { 1: 'drained', 2: 'okay', 3: 'lit up' };
let playing = null;
function takeRow(k) {
  const r = readById(k.r);
  const play = k.audio ? h('button', { class: 'ic', 'aria-label': 'Play', text: '▶', onclick: async e => {
    const btn = e.currentTarget;
    if (playing && playing.btn === btn) { playing.a.pause(); playing.btn.textContent = '▶'; playing = null; return; }
    if (playing) { playing.a.pause(); playing.btn.textContent = '▶'; }
    const b = await getAudio(k.id); if (!b) { toast('The audio for this take is not on this device.'); return; }
    const a = new Audio(URL.createObjectURL(b)); a.onended = () => { btn.textContent = '▶'; playing = null; }; a.play(); btn.textContent = '❚❚'; playing = { a, btn };
  } }) : h('span', { class: 'ic', style: 'border:0' });
  return h('div', { class: 'tk' }, play,
    h('div', { class: 'what' }, h('b', {}, r ? r.t : (k.name || 'Take'), dots(k)),
      h('small', { text: [niceDay(k.d), mmss(k.dur || 0), k.kind === 'master' ? 'mastered' : 'raw', WHY[k.why], FEEL[k.feel], k.note].filter(Boolean).join(' · ') })),
    k.audio ? h('button', { class: 'x', 'aria-label': 'Download', title: 'Download', text: '↓', onclick: async () => { const b = await getAudio(k.id); if (!b) return; const a = h('a', { href: URL.createObjectURL(b), download: `${(r ? r.id : 'take')}-${k.d}.${/mp4|m4a/.test(b.type) ? 'm4a' : /wav/.test(b.type) ? 'wav' : /mpeg|mp3/.test(b.type) ? 'mp3' : 'webm'}` }); document.body.append(a); a.click(); a.remove(); } }) : null,
    h('button', { class: 'x', 'aria-label': 'Delete take', text: '×', onclick: () => {
      S.takes = S.takes.filter(x => x.id !== k.id); save(); render(); paintMode();
      const timer = setTimeout(() => delAudio(k.id), 6500);
      toast('Take deleted.', () => { clearTimeout(timer); S.takes.push(k); S.takes.sort((a, b) => a.t - b.t); save(); render(); paintMode(); });
    } }));
}
function takes() {
  const head = [h('h1', { text: 'Takes' }), h('p', { class: 'sub', text: 'Green dots are in range. Raw takes are checked for headroom and room noise; mastered files against the full audiobook spec.' })];
  if (!S.takes.length) return show(head, h('div', { class: 'empty', text: 'No takes yet. Record today’s read, or check a file from your DAW.' }), foot());
  const b = S.takes.filter(k => k.r === 'bench' && k.audio);
  const prog = b.length >= 2 ? h('section', { class: 'read' }, h('p', { class: 'k', text: 'Hear your progress' }), h('h3', { text: 'Benchmark: first and latest' }),
    h('p', { class: 'src', text: `${niceDay(b[0].d)} and ${niceDay(b[b.length - 1].d)}` }), h('div', { id: 'cmp' })) : null;
  if (prog) Promise.all([getAudio(b[0].id), getAudio(b[b.length - 1].id)]).then(([x, y]) => { const c = $('#cmp'); if (c && x && y) c.replaceChildren(h('p', { class: 'lab', text: 'First' }), h('audio', { controls: true, src: URL.createObjectURL(x) }), h('p', { class: 'lab', text: 'Latest' }), h('audio', { controls: true, src: URL.createObjectURL(y) })); });
  const days = {}; for (const k of S.takes.slice().reverse()) (days[k.d] = days[k.d] || []).push(k);
  show(head, prog, Object.entries(days).map(([d, list]) => h('div', { class: 'day' }, h('h3', {}, niceDay(d), h('span', { text: `${list.length} take${list.length > 1 ? 's' : ''}` })), h('div', { class: 'list' }, list.map(takeRow)))), foot());
}
function gateCard(title, ok, desc, rows, extra) {
  return h('section', { class: 'gate' + (ok ? ' green' : '') }, h('div', { class: 'gh' }, h('b', { text: title }), h('span', { class: 'st', text: ok ? 'Green' : 'Not yet' })), h('p', { text: desc }),
    rows.map(([lbl, n, of, txt]) => h('div', {}, h('div', { class: 'prog' }, h('i', { style: `width:${Math.min(100, of ? n / of * 100 : 0)}%` })), h('div', { class: 'sub2', text: txt || `${lbl}: ${n} of ${of}` }))), extra);
}
function pullCard() {
  return h('section', { class: 'pull' }, h('h3', { text: 'Time to pull back a little' }),
    h('p', { class: 'hint', style: 'margin:0', text: 'Lately more sessions feel like obligations than choices. Keep the project; remove the pressure first:' }),
    h('ul', {}, h('li', { text: 'Drop self-imposed deadlines and posting quotas for two weeks.' }), h('li', { text: 'Finish paid work you owe, but pause taking new clients.' }), h('li', { text: 'Record one read a week that is only for you, and do not check its levels.' })));
}
function storefront() {
  const g = gates();
  const head = [h('h1', { text: 'Storefront' }), h('p', { class: 'sub', text: 'It opens when all four checks are green. Until then you can still do a few paid pilots; they count as demand.' })];
  const skill = gateCard('Skill', g.skill.ok, 'You can deliver clean audio across genres, and it doesn’t fill you with dread.', [
    ['Clean takes', g.skill.clean, 10], ['Mastered files in full spec', g.skill.mastered, 3], ['Genres with a clean take', g.skill.genres, 3],
    ['', Math.min(g.skill.avgFeel, 3) / 3 * 100, g.skill.avgFeel >= 2 && g.skill.n >= 5 ? 100 : 100, g.skill.n < 5 ? `Recent feel: needs 5 takes (${g.skill.n} so far)` : `Recent feel: ${g.skill.avgFeel.toFixed(1)} of 3 (needs 2.0, “okay”)`]]);
  const sigList = S.signals.length ? h('div', { class: 'list', style: 'margin-top:8px' }, S.signals.slice().reverse().map(s => h('div', { class: 'tk' },
    h('div', { class: 'what' }, h('b', { text: SIG[s.k] + (s.who ? ` · ${s.who}` : '') }), h('small', { text: [niceDay(s.d), s.amt ? `$${s.amt}` : '', s.note].filter(Boolean).join(' · ') })),
    h('button', { class: 'x', 'aria-label': 'Delete', text: '×', onclick: () => { S.signals = S.signals.filter(x => x.id !== s.id); save(); render(); paintMode(); toast('Removed.', () => { S.signals.push(s); S.signals.sort((a, b) => a.t - b.t); save(); render(); paintMode(); }); } })))) : null;
  const demand = gateCard('Demand', g.demand.ok, 'People want it without being chased. Log it when someone asks, pays for a pilot, comes back or refers someone.', [
    ['Demand signals', g.demand.n, 3], ['Paid pilots', g.demand.pilots, 1, `Paid pilots: ${g.demand.pilots} of 1${g.demand.earned ? ` · $${g.demand.earned} so far` : ''}`]],
    h('div', {}, h('button', { class: 'btn', style: 'margin-top:8px', text: 'Log a demand signal', onclick: logSignal }), g.demand.pilots >= 3 && !g.open ? h('p', { class: 'hint', text: 'You have three pilots. Hold off on more until the other checks catch up.' }) : null, sigList));
  const joy = gateCard('Joy', g.joy.ok, 'You still come in because you want to. This is the measure the research uses: what you do in free time, unprompted.', [
    ['Sessions in the last 30 days', g.joy.n, 8], ['', g.joy.share * 100, 70, `“I wanted to”: ${Math.round(g.joy.share * 100)}% (needs 70%)`]]);
  const rent = gateCard('Rent', g.rent.ok, 'Other income covers your bills, so the studio never has to.', [],
    h('label', { class: 'sw' }, h('input', { type: 'checkbox', checked: S.rent, onchange: e => { S.rent = e.target.checked; save(); render(); paintMode(); } }), h('span', { text: 'The studio is not paying my rent. Other income covers it.' })));
  const open = g.open ? h('section', { class: 'open' }, h('h3', { text: 'The storefront is open' }), h('p', { class: 'hint', style: 'margin:0', text: 'Grow it in small steps:' }),
    h('ol', {}, h('li', { text: 'Pick your best three clean takes in your strongest genres as a demo reel.' }), h('li', { text: 'Set one simple rate and publish it. Take one client at a time.' }),
      h('li', { text: 'Keep one sandbox read a week that is never for sale.' }), h('li', { text: 'Keep the day job. If the joy check drops, this page will say so.' }))) : null;
  const why = h('details', { class: 'more why' }, h('summary', { text: 'Why these four checks?' }),
    h('p', { html: 'Expected, tangible rewards reduced how often people chose an activity in their free time across <a href="https://pubmed.ncbi.nlm.nih.gov/10589297/" target="_blank" rel="noopener">128 experiments</a>, while positive, informational feedback increased it. So the sandbox gives you feedback, not points.' }),
    h('p', { html: 'Pay and passion can coexist: incentives mostly drive quantity, intrinsic motivation drives quality (<a href="https://psycnet.apa.org/record/2014-03897-001" target="_blank" rel="noopener">40-year meta-analysis</a>). The joy check watches for the crowding out.' }),
    h('p', { html: 'People who started a business while keeping a day job had a 33% lower risk of failing (<a href="https://www.jstor.org/stable/43589291" target="_blank" rel="noopener">Raffiee and Feng</a>). That is the rent check.' }),
    h('p', { html: 'The most cited reason startups fail is building something nobody needed (<a href="https://www.cbinsights.com/reports/The-20-Reasons-Startups-Fail.pdf" target="_blank" rel="noopener">CB Insights</a>). That is why demand is a gate, and why pilots are allowed early.' }),
    h('p', { html: 'Level targets follow the <a href="https://help.acx.com/s/article/what-are-the-acx-audio-submission-requirements" target="_blank" rel="noopener">ACX audio submission requirements</a>. Browser meters differ a little from DAW meters, so confirm finished files in your DAW or ACX Audio Lab.' }));
  show(head, pullBack() ? pullCard() : null, open, skill, demand, joy, rent, why, foot());
}
const SIG = { asked: 'Someone asked, unprompted', pilot: 'Paid pilot', back: 'Came back for more', referral: 'Referral' };
function logSignal() {
  let kind = 'asked';
  const who = h('input', { class: 'inp', placeholder: 'Who (optional): an author, a course creator, a friend’s business' });
  const amt = h('input', { class: 'inp', type: 'number', min: '0', step: '1', inputmode: 'numeric', placeholder: 'Amount paid, in dollars' });
  const amtBox = h('div', { hidden: true }, h('p', { class: 'lab', text: 'Paid' }), amt);
  const note = h('input', { class: 'inp', placeholder: 'Note (optional)' });
  const close = sheet(h('div', { class: 'sh-h' }, h('h2', { text: 'Log a demand signal' }), h('button', { class: 'close', 'aria-label': 'Close', text: '×', onclick: () => close() })),
    h('p', { class: 'sh-cue', text: 'Only real behavior counts: asking, paying, returning, referring. “That sounds cool” does not.' }),
    h('div', { class: 'chips feel' }, ...Object.entries(SIG).map(([k, t], i) => h('button', { class: 'chip' + (i ? '' : ' on'), text: t, onclick: e => { kind = k; [...e.target.parentNode.children].forEach(c => c.classList.toggle('on', c === e.target)); amtBox.hidden = k !== 'pilot'; } }))),
    h('p', { class: 'lab', text: 'Who' }), who, amtBox, h('p', { class: 'lab', text: 'Note' }), note,
    h('div', { class: 'row', style: 'margin-top:14px' }, h('button', { class: 'btn go wide', text: 'Log it', onclick: () => {
      S.signals.push({ id: uid(), d: ymd(), t: Date.now(), k: kind, who: who.value.trim(), amt: kind === 'pilot' ? Math.max(0, +amt.value || 0) : 0, note: note.value.trim() });
      save(); close(); render(); paintMode(); toast('Logged.');
    } })));
}
const foot = () => h('p', { class: 'foot', html: '© 2026 Daniel Ilias Houlis. All rights reserved. Frequent™ is a trademark of Daniel Ilias Houlis. Your takes stay on this device. <a href="../">More Frequent apps</a>' });

// ---------- Menu ----------
function download(name, text, type) { const a = h('a', { href: URL.createObjectURL(new Blob([text], { type })), download: name }); document.body.append(a); a.click(); a.remove(); }
function obsidian() {
  const g = gates(); const L = [`# Frequent Studio`, '', `Exported ${ymd()}. Mode: ${g.open ? 'storefront open' : 'sandbox'}.`, '', '## Checks', '',
    `- [${g.skill.ok ? 'x' : ' '}] Skill: ${g.skill.clean}/10 clean, ${g.skill.mastered}/3 mastered in spec, ${g.skill.genres}/3 genres`,
    `- [${g.demand.ok ? 'x' : ' '}] Demand: ${g.demand.n}/3 signals, ${g.demand.pilots}/1 paid pilots`,
    `- [${g.joy.ok ? 'x' : ' '}] Joy: ${g.joy.n}/8 sessions in 30 days, ${Math.round(g.joy.share * 100)}% wanted to`,
    `- [${g.rent.ok ? 'x' : ' '}] Rent: other income covers bills`, '', '## Takes', '', '| Date | Read | Kind | RMS | Peak | Floor | Clean | Why | Feel | Note |', '|---|---|---|---|---|---|---|---|---|---|'];
  for (const k of S.takes) { const r = readById(k.r); L.push(`| ${k.d} | ${r ? r.t : k.name} | ${k.kind} | ${db1(k.rms)} | ${db1(k.peak)} | ${db1(k.floor)} | ${k.clean ? 'yes' : 'no'} | ${WHY[k.why] || ''} | ${FEEL[k.feel] || ''} | ${(k.note || '').replace(/\|/g, '/')} |`); }
  L.push('', '## Demand signals', ''); for (const s of S.signals) L.push(`- ${s.d} · ${SIG[s.k]}${s.who ? ' · ' + s.who : ''}${s.amt ? ' · $' + s.amt : ''}${s.note ? ' · ' + s.note : ''}`);
  download(`Frequent Studio ${ymd()}.md`, L.join('\n'), 'text/markdown');
}
function about() {
  const close = sheet(h('div', { class: 'sh-h' }, h('h2', { text: 'How the sandbox works' }), h('button', { class: 'close', 'aria-label': 'Close', text: '×', onclick: () => close() })),
    h('div', { class: 'why' },
      h('p', { text: 'Studio is the sandbox: one read a day, honest level checks, and two taps after each take. No points, no streaks, no quotas. The checks are feedback on your craft, not a score.' }),
      h('p', { text: 'Every take asks why you came in and how it felt. That builds the joy check, and the app tells you to pull back if obligation starts to outweigh choice.' }),
      h('p', { text: 'Storefront is where money comes in, and it opens only when skill, demand, joy and rent are green. A few paid pilots are allowed before that, because demand is information.' }),
      h('p', { text: 'Backups save the take details and signals. Audio files stay on this device; download any take from the Takes tab.' })));
}
$('#menuB').onclick = e => { e.stopPropagation(); $('#menu').hidden = !$('#menu').hidden; };
document.addEventListener('click', e => { if (!$('#menu').contains(e.target)) $('#menu').hidden = true; });
$('#menu').addEventListener('click', e => {
  const a = e.target.dataset && e.target.dataset.act; if (!a) return; $('#menu').hidden = true;
  if (a === 'obsidian') obsidian();
  if (a === 'backup') download(`frequent-studio-backup-${ymd()}.json`, JSON.stringify(S, null, 1), 'application/json');
  if (a === 'about') about();
});
$('#restore').onchange = async e => {
  const f = e.target.files[0]; if (!f) return; $('#menu').hidden = true;
  try { const d = JSON.parse(await f.text()); if (!d || !Array.isArray(d.takes)) throw 0;
    const ids = new Set(S.takes.map(k => k.id)); for (const k of d.takes) if (!ids.has(k.id)) S.takes.push(k);
    const sids = new Set(S.signals.map(k => k.id)); for (const s of (d.signals || [])) if (!sids.has(s.id)) S.signals.push(s);
    S.takes.sort((a, b) => a.t - b.t); S.signals.sort((a, b) => a.t - b.t); S.rent = S.rent || !!d.rent; save(); render(); paintMode(); toast('Backup merged in. Nothing was removed.');
  } catch (err) { toast('That file is not a Frequent Studio backup.'); }
  e.target.value = '';
};

// ---------- Tabs ----------
let tab = 'studio';
const VIEWS = { studio, takes, storefront };
function render() { if (R.on && tab === 'studio') return; VIEWS[tab](); }
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
  if (R.on) { toast('Stop the recording first.'); return; }
  tab = b.dataset.tab; document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b)); render(); window.scrollTo(0, 0);
});
$('#mode').onclick = () => $('.tabs button[data-tab="storefront"]').click();
render(); paintMode();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
