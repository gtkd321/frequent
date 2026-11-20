// Frequent Workouts. © 2026 Daniel Ilias Houlis. All rights reserved. Frequent is a trademark of Daniel Ilias Houlis.
// Log a set in one tap. Momentum grows most when you try something new: a new exercise or a new twist on one you know.
// Everything lives in this browser (localStorage "fwo"). Updates only add to it; nothing is ever wiped.
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
const addDays = (d, n) => { const x = new Date(d + 'T12:00'); x.setDate(x.getDate() + n); return ymd(x); };
const niceDay = d => { const t = ymd(); if (d === t) return 'Today'; if (d === addDays(t, -1)) return 'Yesterday'; return new Date(d + 'T12:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); };

// ---------- The exercise library ----------
// k: load = weight × reps × sets, body = reps × sets, time = minutes. u = what a rep counts (sec, lengths).
// d = starting numbers [weight, reps, sets] or [minutes]. They come from the gym inventory where one existed.
const REGIONS = { legs: 'Legs & knees', back: 'Back & posture', push: 'Push & arms', core: 'Core', cardio: 'Cardio', mob: 'Mobility' };
const LIB = [
  ['legpress', 'Leg press', 'legs', 'load', [140, 15, 3], 'Feet hip-width on the platform. Lower until your knees reach about 90°, then press through the whole foot.'],
  ['splitsq', 'Smith machine split squat', 'legs', 'load', [95, 8, 3], 'Long stance. Drop the back knee straight down; the front heel stays planted.'],
  ['deadlift', 'Deadlift', 'legs', 'load', [95, 15, 1], 'Hinge at the hips, keep the bar close to your legs and push the floor away.'],
  ['legcurl', 'Seated leg curl', 'legs', 'load', [47.5, 12, 3], 'Pad just above the heels. Curl, squeeze, and return slowly.'],
  ['pronecurl', 'Prone leg curl', 'legs', 'load', [40, 15, 3], 'Hips stay pressed into the pad. Curl without lifting your hips.'],
  ['legext', 'Leg extension', 'legs', 'load', [40, 12, 3], 'Pause at the top and lower over 2–3 seconds. Build to 15 × 3 before adding weight.'],
  ['abd', 'Hip abduction', 'legs', 'load', [65, 12, 3], '1–2 seconds out, 1–2 second squeeze, 2–3 seconds back.'],
  ['add', 'Hip adduction', 'legs', 'load', [50, 15, 3], '1–2 seconds in, 1–2 second squeeze, 2–3 seconds back.'],
  ['bridge', 'Glute bridge', 'legs', 'load', [70, 10, 3], 'Glutes first: squeeze before you lift, so the knees do not take over.'],
  ['calf', 'Calf raise', 'legs', 'load', [140, 15, 3], 'Full stretch at the bottom, pause at the top.'],
  ['goblet', 'Goblet squat', 'legs', 'load', [30, 8, 2], 'Hold the dumbbell at your chest and sit down between your heels. Try a pause at the bottom.'],
  ['cossack', 'Cossack squat', 'legs', 'body', [0, 6, 2], 'Wide stance. Shift onto one leg and keep the other straight. Go only as deep as the knee feels good.'],
  ['peterson', 'Peterson step-up', 'legs', 'body', [0, 10, 2], 'Stand on a low step, working heel slightly raised. Straighten the knee slowly, keeping it over your toes.'],
  ['tke', 'Terminal knee extension', 'legs', 'body', [0, 15, 2], 'Band behind the knee, anchored in front. Step back and straighten the knee fully against the band.'],
  ['spanish', 'Spanish squat', 'legs', 'body', [0, 10, 2], 'Heavy band behind both knees, anchored in front. Sit back with shins vertical; hold or squat.'],
  ['stepdown', 'Lateral step-down', 'legs', 'body', [0, 10, 2], 'On a low step, slowly lower the free heel to tap the floor. Keep the standing knee over your toes.'],
  ['sled', 'Reverse sled drag', 'legs', 'load', [45, 4, 1], 'Face the sled and walk backward with small steps, staying low. Count each length.', 'lengths'],
  ['kbswing', 'Kettlebell swing', 'legs', 'load', [25, 15, 3], 'Hike the bell back, then snap your hips forward. Your arms only guide it. Good for hip tension.'],
  ['lowrow', 'Low row', 'back', 'load', [55, 15, 3], 'Sit tall, pull to your belly, and squeeze your shoulder blades together.'],
  ['seatrow', 'Seated row machine', 'back', 'load', [60, 15, 3], 'Chest on the pad. Lead with the elbows and pause at the back.'],
  ['pulldown', 'Front pulldown', 'back', 'load', [40, 12, 3], 'Pull the handles to your upper chest. Shoulders stay down, away from your ears.'],
  ['reardelt', 'Rear-delt machine', 'back', 'load', [55, 15, 3], 'Arms nearly straight. Sweep back and stop when your hands line up with your shoulders.'],
  ['rotcuff', 'Cable external rotation', 'back', 'load', [15, 7, 2], 'Elbow pinned to your side. Rotate out slowly. This is for control, not fatigue.'],
  ['singlerow', 'Single-arm cable row', 'back', 'load', [15, 7, 3], 'Low cable, pull straight back like starting a mower, and let the shoulder blade glide forward on the return.'],
  ['pullover', 'Standing cable pullover', 'back', 'load', [25, 10, 1], 'Back to the stack, rope overhead. Sweep your arms forward and down with straight elbows.'],
  ['chop', 'Half-kneeling cable chop', 'back', 'load', [20, 10, 2], 'Kneel sideways to the cable. Pull high to low across your body; hips stay square.'],
  ['yraise', 'Incline Y raise', 'back', 'body', [0, 10, 2], 'Chest on a 30–45° bench, thumbs up. Raise your arms in a Y to ear height. Works the lower traps.'],
  ['facepull', 'Face pull', 'back', 'load', [30, 15, 3], 'Rope at forehead height. Pull to your face with elbows high, then rotate your hands back.'],
  ['pullapart', 'Band pull-apart', 'back', 'body', [0, 15, 2], 'Arms straight at chest height. Pull the band apart by squeezing your shoulder blades.'],
  ['pronew', 'Prone W raise', 'back', 'body', [0, 10, 2], 'Face down, elbows bent into a W. Lift and squeeze the shoulder blades down and back.'],
  ['chestpress', 'Chest press machine', 'push', 'load', [100, 15, 3], 'Handles at mid-chest. Press without locking out, lower slowly.'],
  ['pecfly', 'Pec fly', 'push', 'load', [70, 15, 3], 'Soft elbows. Hug a big tree and squeeze at the middle.'],
  ['shpress', 'Shoulder press machine', 'push', 'load', [40, 12, 3], 'Sit tall and press up without shrugging.'],
  ['inclinepush', 'Incline push-up', 'push', 'body', [0, 10, 3], 'Hands on a bench, body in one straight line. Lower your chest to the edge.'],
  ['latraise', 'Lateral raise', 'push', 'load', [10, 12, 3], 'Lift to shoulder height, leading with the elbows. Lower slowly.'],
  ['curl', 'Dumbbell curl', 'push', 'load', [20, 12, 3], 'Elbows stay at your sides. No swinging.'],
  ['pushdown', 'Triceps pushdown', 'push', 'load', [30, 12, 3], 'Elbows pinned. Push down until your arms are straight, then return slowly.'],
  ['plank', 'Plank', 'core', 'body', [0, 30, 3], 'Forearms down, body in one line. Squeeze glutes and brace like someone will poke your belly.', 'sec'],
  ['sideplank', 'Side plank', 'core', 'body', [0, 20, 2], 'Elbow under shoulder, hips high. Knees down is a fine start.', 'sec'],
  ['deadbug', 'Dead bug', 'core', 'body', [0, 10, 2], 'Low back pressed to the floor. Slowly extend the opposite arm and leg.'],
  ['birddog', 'Bird dog', 'core', 'body', [0, 10, 2], 'On hands and knees, reach the opposite arm and leg long without tipping your hips.'],
  ['pallof', 'Pallof press', 'core', 'load', [20, 10, 2], 'Stand sideways to the cable. Press straight out and resist the twist.'],
  ['suitcase', 'Suitcase carry', 'core', 'load', [30, 4, 1], 'One heavy dumbbell at your side. Walk tall without leaning. Count each length.', 'lengths'],
  ['walk', 'Treadmill walk', 'cardio', 'time', [6], 'Brisk enough that talking takes a little effort.'],
  ['recumbent', 'Recumbent bike', 'cardio', 'time', [6], 'Easy, steady pedaling. Short bouts between lifts all count toward the 5K.'],
  ['stair', 'Stair climber', 'cardio', 'time', [6], 'Light hands on the rails, upright posture, steady pace.'],
  ['rower', 'Rowing machine', 'cardio', 'time', [6], 'Legs, then lean, then arms. Reverse that order on the way back.'],
  ['elliptical', 'Elliptical', 'cardio', 'time', [6], 'Smooth strides. Push and pull the handles to bring in the upper body.'],
  ['jogwalk', 'Jog-walk intervals', 'cardio', 'time', [6], 'Jog 1 minute, walk 1–2 minutes, repeat. The classic road to a 5K.'],
  ['chintuck', 'Chin tuck', 'mob', 'body', [0, 10, 2], 'Glide your head straight back, as if making a double chin. Hold 3 seconds.'],
  ['catcow', 'Cat-cow', 'mob', 'body', [0, 8, 1], 'On hands and knees, round your back slowly, then let it sag gently. Move with your breath.'],
  ['hip9090', '90/90 hip switch', 'mob', 'body', [0, 8, 2], 'Sit with both knees bent at 90°. Rotate both knees to the other side and back.'],
  ['openbook', 'Open book rotation', 'mob', 'body', [0, 8, 2], 'Lie on your side, knees bent and together. Open the top arm across to the other side.'],
  ['hang', 'Dead hang', 'mob', 'body', [0, 20, 2], 'Hang from a bar with shoulders gently engaged. Feet can stay on a box.', 'sec'],
  ['couch', 'Couch stretch', 'mob', 'body', [0, 30, 2], 'Back knee against a wall or bench, front foot forward. Squeeze the back glute.', 'sec'],
].map(([id, n, g, k, d, cue, u]) => ({ id, n, g, k, d, cue, u }));

// Twists: a twist on an exercise you know earns momentum the first time too.
const TWISTS = {
  lift: ['Standard', '5-second squeeze', 'Slow lowering', 'Pause at the bottom', 'One side at a time', 'Fatigued finisher'],
  hold: ['Standard', 'Longer hold', 'Harder angle', 'Add a reach'],
  time: ['Standard', 'Intervals', 'Incline or resistance up', 'Faster pace'],
};
const twistsFor = ex => ex.k === 'time' ? TWISTS.time : ex.u === 'sec' ? TWISTS.hold : TWISTS.lift;

// ---------- Saved progress ----------
const KEY = 'fwo';
const blank = () => ({ v: 1, log: [], custom: [], weigh: [], skip: 0, skipDay: '' });
let S = blank();
try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && typeof s === 'object') S = Object.assign(blank(), s); } catch (e) { /* keep the old text untouched */ }
let saveT = 0;
const save = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Could not save in this browser. Save a backup file from the menu.'); } }, 120); };
const allEx = () => LIB.concat(S.custom);
const exById = id => allEx().find(e => e.id === id);

// ---------- What you have done ----------
const entriesFor = id => S.log.filter(e => e.ex === id);
const lastOf = id => { for (let i = S.log.length - 1; i >= 0; i--) if (S.log[i].ex === id) return S.log[i]; return null; };
const daysOf = id => new Set(entriesFor(id).map(e => e.d)).size;
const status = id => { const n = daysOf(id); return n === 0 ? 'nw' : n < 3 ? 'tried' : 'reg'; };
const STATUS_TXT = { nw: 'Not tried yet', tried: 'Tried', reg: 'Regular' };
// Frequency: each logged day counts, fading over about a month, so recent habits rise to the top.
const freqScore = id => { const t = ymd(); let s = 0; for (const d of new Set(entriesFor(id).map(e => e.d))) s += Math.pow(0.95, daysBetween(d, t)); return s; };

// ---------- Momentum: points that fade by 1/7 a day, like every Frequent app ----------
const PTS = { log: 1, newEx: 5, newTwist: 3, back: 2 };
function pointsFor(ex, twist) {
  const prev = entriesFor(ex.id);
  if (!prev.length) return { n: PTS.log + PTS.newEx, why: 'new exercise', tag: 'n' };
  if (twist !== 'Standard' && !prev.some(e => e.tw === twist)) return { n: PTS.log + PTS.newTwist, why: 'new twist', tag: 't' };
  const last = prev[prev.length - 1].d;
  if (daysBetween(last, ymd()) >= 21) return { n: PTS.log + PTS.back, why: 'welcome back', tag: '' };
  return { n: PTS.log, why: '', tag: '' };
}
const ptsByDay = () => { const m = {}; for (const e of S.log) m[e.d] = (m[e.d] || 0) + (e.p || 0); return m; };
const moScore = () => { const t = ymd(); let s = 0; for (const [d, n] of Object.entries(ptsByDay())) { const ago = daysBetween(d, t); if (ago >= 0) s += n * Math.pow(6 / 7, ago); } return Math.round(s); };
const paintMo = (bump) => { $('#moN').textContent = moScore(); if (bump) { const m = $('#mo'); m.classList.remove('bump'); void m.offsetWidth; m.classList.add('bump'); } };

const fmtNum = n => (Math.round(n * 10) / 10).toString();
function fmtSet(ex, e) {
  if (!e) return '';
  if (ex.k === 'time') return `${fmtNum(e.m)} min`;
  const reps = ex.u === 'sec' ? `${e.r} s` : ex.u === 'lengths' ? `${e.r} lengths` : e.r;
  const core = ex.k === 'load' ? `${fmtNum(e.w)} lb × ${reps}` : `${reps}`;
  return e.s > 1 ? `${core} × ${e.s}` : core;
}
const startOf = ex => ex.k === 'time' ? { m: ex.d[0] } : { w: ex.d[0], r: ex.d[1], s: ex.d[2] };

function addLog(ex, vals, twist, feel, note) {
  const p = pointsFor(ex, twist);
  const e = Object.assign({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), d: ymd(), t: Date.now(), ex: ex.id, tw: twist, p: p.n, why: p.why }, vals);
  if (feel) e.f = feel; if (note) e.note = note;
  S.log.push(e); save(); paintMo(true);
  toast(`+${p.n} momentum${p.why ? ' · ' + p.why : ''}`, () => { S.log = S.log.filter(x => x.id !== e.id); save(); paintMo(); render(); toast('Removed'); });
  render();
}
function quickLog(ex) {
  const last = lastOf(ex.id);
  const vals = last ? (ex.k === 'time' ? { m: last.m } : { w: last.w, r: last.r, s: last.s }) : startOf(ex);
  addLog(ex, vals, last ? last.tw || 'Standard' : 'Standard', '', '');
}

let toastT = 0;
function toast(t, undo) {
  const el = $('#toast'); $('#toastT').textContent = t; const u = $('#toastU');
  u.hidden = !undo; u.onclick = undo ? () => { el.classList.remove('on'); undo(); } : null;
  el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), undo ? 4500 : 1800);
}

// ---------- Try something new ----------
// Untried exercises, starting with the body area you have not worked for the longest.
function newPicks() {
  const t = ymd(); const lastIn = {};
  for (const e of S.log) { const ex = exById(e.ex); if (ex) lastIn[ex.g] = e.d; }
  const age = g => lastIn[g] ? daysBetween(lastIn[g], t) : 99;
  const seed = [...t].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const hash = s => [...s].reduce((a, c) => (a * 33 + c.charCodeAt(0)) >>> 0, seed);
  const cands = allEx().filter(e => status(e.id) === 'nw');
  return cands.sort((a, b) => (age(b.g) - age(a.g)) || (hash(a.id) - hash(b.id)));
}
function twistPick() {
  // When everything has been tried, suggest a twist you have not done on a frequent exercise.
  const fav = allEx().filter(e => status(e.id) !== 'nw').sort((a, b) => freqScore(b.id) - freqScore(a.id));
  for (const ex of fav) { const done = new Set(entriesFor(ex.id).map(e => e.tw)); const tw = twistsFor(ex).find(x => !done.has(x)); if (tw) return { ex, tw }; }
  return null;
}

// ---------- Views ----------
const main = $('#main');
const show = (...kids) => main.replaceChildren(...kids.flat().filter(k => k != null && k !== false));
function exRow(ex, opts = {}) {
  const st = status(ex.id); const last = lastOf(ex.id);
  const detail = opts.detail || (last ? `${fmtSet(ex, last)}${last.tw && last.tw !== 'Standard' ? ' · ' + last.tw : ''}` : `Start: ${fmtSet(ex, startOf(ex))}`);
  return h('div', { class: 'ex' },
    h('i', { class: 'dot ' + st, title: STATUS_TXT[st], 'aria-label': STATUS_TXT[st] }),
    h('button', { class: 'name', type: 'button', onclick: () => sheet(ex) }, h('b', { text: ex.n }), h('span', { text: detail })),
    st === 'nw'
      ? h('button', { class: 'plus newb', type: 'button', 'aria-label': 'Try ' + ex.n, onclick: () => sheet(ex), text: 'Try' })
      : h('button', { class: 'plus', type: 'button', 'aria-label': 'Log ' + ex.n + ' again', onclick: () => quickLog(ex), text: '+ Log' }));
}

function today() {
  const t = ymd(); const pd = ptsByDay();
  const spark = h('div', { class: 'spark', 'aria-label': 'Momentum points, last 14 days' });
  const vals = []; for (let i = 13; i >= 0; i--) vals.push([addDays(t, -i), pd[addDays(t, -i)] || 0]);
  const max = Math.max(6, ...vals.map(v => v[1]));
  for (const [d, n] of vals) spark.append(h('i', { class: (n ? 'has' : '') + (d === t ? ' today' : ''), style: `height:${Math.max(6, n / max * 100)}%`, title: `${niceDay(d)}: ${n}` }));
  const month = t.slice(0, 7);
  const firsts = {}; for (const e of S.log) if (!firsts[e.ex]) firsts[e.ex] = e.d;
  const newMonth = Object.values(firsts).filter(d => d.startsWith(month)).length;
  const twistsMonth = S.log.filter(e => e.d.startsWith(month) && e.why === 'new twist').length;
  const todayN = S.log.filter(e => e.d === t).length;

  const mom = h('section', { class: 'mom' },
    h('div', {}, h('div', { class: 'big', text: moScore() }), h('div', { class: 'lbl', text: 'momentum' })),
    spark,
    h('div', { class: 'facts' },
      h('span', {}, 'Today ', h('b', { text: '+' + (pd[t] || 0) })),
      h('span', {}, 'New this month ', h('b', { text: newMonth })),
      h('span', {}, 'Twists this month ', h('b', { text: twistsMonth }))));

  // Try something new
  const picks = newPicks(); let card;
  if (S.skipDay !== t) { S.skipDay = t; S.skip = 0; }
  if (picks.length) {
    const ex = picks[S.skip % picks.length];
    card = h('section', { class: 'new' },
      h('p', { class: 'k', text: `Try something new · +${PTS.log + PTS.newEx}` }),
      h('h3', { text: ex.n }),
      h('p', { class: 'reg', text: REGIONS[ex.g] + (ex.k === 'time' ? '' : ' · start with ' + fmtSet(ex, startOf(ex))) }),
      h('p', { class: 'cue', text: ex.cue }),
      h('div', { class: 'row' },
        h('button', { class: 'btn green', type: 'button', text: 'I tried it', onclick: () => sheet(ex) }),
        picks.length > 1 && h('button', { class: 'btn ghost', type: 'button', text: 'Show another', onclick: () => { S.skip++; save(); today(); } })));
  } else {
    const tp = twistPick();
    card = tp && h('section', { class: 'new' },
      h('p', { class: 'k', text: `Try a new twist · +${PTS.log + PTS.newTwist}` }),
      h('h3', { text: `${tp.ex.n}: ${tp.tw.toLowerCase()}` }),
      h('p', { class: 'reg', text: 'You have tried every exercise here. Add your own in Exercises, or change one you know.' }),
      h('div', { class: 'row' }, h('button', { class: 'btn green', type: 'button', text: 'I tried it', onclick: () => sheet(tp.ex, tp.tw) })));
  }

  // Your frequent exercises
  const fav = allEx().filter(e => status(e.id) !== 'nw').sort((a, b) => freqScore(b.id) - freqScore(a.id)).slice(0, 8);
  const favBox = fav.length
    ? h('div', { class: 'list' }, fav.map(ex => exRow(ex)))
    : h('div', { class: 'empty', text: 'Log anything to start. The exercises you do most will gather here, ready for a one-tap log.' });

  // Today
  const todays = S.log.filter(e => e.d === t);
  show(
    mom, weighRow(), card,
    h('h2', { text: 'Your frequent' }), favBox,
    fav.length ? h('p', { class: 'hint', text: '+ Log repeats what you did last time. Tap a name to change weight, reps or the twist.' }) : null,
    todays.length ? h('h2', { text: `Today · ${todayN} logged` }) : null,
    todays.length ? entryList(todays.slice().reverse()) : null,
    h('p', { class: 'foot' }, '© 2026 Daniel Ilias Houlis. Frequent™ is a trademark of Daniel Ilias Houlis. ', h('a', { href: '../', text: 'More Frequent apps' })));
}

function entryList(list) {
  return h('div', { class: 'list' }, list.map(e => {
    const ex = exById(e.ex) || { n: e.ex, k: 'load' };
    const tag = e.why === 'new exercise' ? h('span', { class: 'tag n', text: 'New' }) : e.why === 'new twist' ? h('span', { class: 'tag t', text: 'Twist' }) : null;
    const extra = [e.tw && e.tw !== 'Standard' ? e.tw : '', e.f || '', e.note || ''].filter(Boolean).join(' · ');
    return h('div', { class: 'ent' },
      h('div', { class: 'what' }, ex.n, tag, h('small', { text: fmtSet(ex, e) + (extra ? ' · ' + extra : '') })),
      h('span', { class: 'pts', text: '+' + (e.p || 0) }),
      h('button', { class: 'x', type: 'button', 'aria-label': 'Remove this entry', text: '×', onclick: () => {
        const keep = e; S.log = S.log.filter(x => x.id !== e.id); save(); paintMo(); render();
        toast('Removed', () => { S.log.push(keep); S.log.sort((a, b) => a.t - b.t); save(); paintMo(); render(); });
      } }));
  }));
}

let exFilter = 'all', exQuery = '';
function exercises() {
  const chips = h('div', { class: 'filters', role: 'group', 'aria-label': 'Body area' },
    [['all', 'All'], ['untried', 'Not tried'], ...Object.entries(REGIONS)].map(([k, l]) =>
      h('button', { class: 'chip' + (exFilter === k ? ' on' : ''), type: 'button', text: l, 'aria-pressed': String(exFilter === k), onclick: () => { exFilter = k; exercises(); } })));
  const search = h('input', { class: 'search', type: 'search', placeholder: 'Search exercises', value: exQuery, 'aria-label': 'Search exercises' });
  const out = h('div');
  const paint = () => {
    const q = exQuery.trim().toLowerCase();
    const list = allEx().filter(e => (exFilter === 'all' || (exFilter === 'untried' ? status(e.id) === 'nw' : e.g === exFilter)) && (!q || e.n.toLowerCase().includes(q)));
    out.replaceChildren();
    if (!list.length) { out.append(h('div', { class: 'empty', text: q ? 'No match. Add it as your own exercise below.' : 'You have tried everything in this group.' })); return; }
    for (const [g, label] of Object.entries(REGIONS)) {
      const inG = list.filter(e => e.g === g); if (!inG.length) continue;
      out.append(h('p', { class: 'group', text: label }), h('div', { class: 'list' }, inG.map(ex => exRow(ex))));
    }
  };
  search.addEventListener('input', () => { exQuery = search.value; paint(); });
  const tried = allEx().filter(e => status(e.id) !== 'nw').length;
  show(
    h('h1', { text: 'Exercises' }),
    h('p', { class: 'sub', text: `You have tried ${tried} of ${allEx().length}. Every first try is +${PTS.log + PTS.newEx} momentum.` }),
    search, chips,
    h('div', { class: 'legend' }, h('span', {}, h('i', { class: 'dot nw' }), 'Not tried'), h('span', {}, h('i', { class: 'dot tried' }), 'Tried'), h('span', {}, h('i', { class: 'dot reg' }), 'Regular (3+ days)')),
    out,
    h('div', { style: 'margin-top:18px' }, h('button', { class: 'btn wide', type: 'button', text: '+ Add your own exercise', onclick: addOwn })));
  paint();
}

function history() {
  if (!S.log.length) { show(h('h1', { text: 'History' }), weighSection(), h('h2', { text: 'Workouts' }), h('div', { class: 'empty', text: 'Nothing logged yet. Your sessions will show here, day by day.' })); return; }
  const t = ymd();
  const byDay = {}; for (const e of S.log) (byDay[e.d] = byDay[e.d] || []).push(e);
  const days = Object.keys(byDay).sort().reverse();
  // Most frequent over the last 30 days
  const cnt = {}; for (const e of S.log) if (daysBetween(e.d, t) < 30) cnt[e.ex] = (cnt[e.ex] || 0) + 1;
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 8); const mx = top.length ? top[0][1] : 1;
  const area = {}; for (const e of S.log) if (daysBetween(e.d, t) < 30) { const ex = exById(e.ex); if (ex) area[ex.g] = (area[ex.g] || 0) + 1; }
  const quiet = Object.keys(REGIONS).filter(g => !area[g]).map(g => REGIONS[g]);
  const sessions30 = days.filter(d => daysBetween(d, t) < 30).length;
  show(
    h('h1', { text: 'History' }),
    h('p', { class: 'sub', text: `${sessions30} gym day${sessions30 === 1 ? '' : 's'} in the last 30.` + (quiet.length ? ` Not touched lately: ${quiet.join(', ')}.` : ' Every body area got some work.') }),
    weighSection(),
    top.length ? h('h2', { text: 'Most frequent, last 30 days' }) : null,
    top.length ? h('div', { class: 'bars' }, top.map(([id, n]) => h('div', {}, h('span', { text: (exById(id) || { n: id }).n }), h('i', { style: `width:${n / mx * 100}%` }), h('em', { text: n })))) : null,
    days.slice(0, 60).map(d => h('div', { class: 'day' }, h('h3', {}, niceDay(d), h('span', { text: '+' + byDay[d].reduce((a, e) => a + (e.p || 0), 0) })), entryList(byDay[d].slice().reverse()))));
}

// ---------- Log sheet ----------
function closeSheet() { const m = $('.modal'); if (m) m.remove(); }
function stepper(label, val, step, min, onChange) {
  const inp = h('input', { type: 'number', inputmode: 'decimal', step: 'any', min: String(min), value: fmtNum(val), 'aria-label': label });
  const set = v => { v = Math.max(min, Math.round(v * 10) / 10); inp.value = fmtNum(v); onChange(v); };
  inp.addEventListener('input', () => { const v = parseFloat(inp.value); if (!isNaN(v)) onChange(Math.max(min, v)); });
  return h('div', { class: 'stepper' }, h('div', { class: 't', text: label }),
    h('div', { class: 'c' },
      h('button', { type: 'button', 'aria-label': 'Less ' + label, text: '−', onclick: () => set((parseFloat(inp.value) || 0) - step) }),
      inp,
      h('button', { type: 'button', 'aria-label': 'More ' + label, text: '+', onclick: () => set((parseFloat(inp.value) || 0) + step) })));
}
function sheet(ex, presetTwist) {
  closeSheet(); $('#toast').classList.remove('on');
  const last = lastOf(ex.id); const prev = entriesFor(ex.id);
  const v = last ? (ex.k === 'time' ? { m: last.m } : { w: last.w, r: last.r, s: last.s }) : startOf(ex);
  let twist = presetTwist || (last && last.tw) || 'Standard', feel = '';
  const done = new Set(prev.map(e => e.tw || 'Standard'));
  const preview = h('div', { class: 'preview', 'aria-live': 'polite' });
  const paintPrev = () => { const p = pointsFor(ex, twist); preview.textContent = `+${p.n} momentum${p.why ? ' · ' + p.why : ''}`; };

  const twistBox = h('div', { class: 'chips', role: 'group', 'aria-label': 'Twist' });
  const paintTwists = () => {
    twistBox.replaceChildren(...[...new Set(twistsFor(ex).concat([...done]))].map(tw => h('button', {
      class: 'chip' + (tw === twist ? ' on' : '') + (prev.length && !done.has(tw) ? ' isnew' : ''), type: 'button', 'aria-pressed': String(tw === twist), text: tw,
      onclick: () => { twist = tw; paintTwists(); paintPrev(); } })));
  };
  const feelBox = h('div', { class: 'chips feel', role: 'group', 'aria-label': 'How it felt' });
  const paintFeel = () => feelBox.replaceChildren(...['Relief', 'Solid', 'Strain'].map(f => h('button', { class: 'chip' + (f === feel ? ' on' : ''), type: 'button', 'aria-pressed': String(f === feel), text: f, onclick: () => { feel = feel === f ? '' : f; paintFeel(); } })));
  const note = h('input', { class: 'inp', type: 'text', placeholder: 'Note (seat setting, cue, how the knee felt)', 'aria-label': 'Note' });
  const custom = h('input', { class: 'inp', type: 'text', placeholder: 'Name your own twist', 'aria-label': 'Your own twist' });
  custom.addEventListener('change', () => { const x = custom.value.trim(); if (x) { twist = x; done.add(x); custom.value = ''; paintTwists(); paintPrev(); } });

  const reps = ex.u === 'sec' ? 'Seconds' : ex.u === 'lengths' ? 'Lengths' : 'Reps';
  const steps = ex.k === 'time'
    ? h('div', { class: 'steps' }, stepper('Minutes', v.m, 1, 1, x => v.m = x))
    : h('div', { class: 'steps' },
      ex.k === 'load' ? stepper('Pounds', v.w, 5, 0, x => v.w = x) : null,
      stepper(reps, v.r, ex.u === 'sec' ? 5 : 1, 1, x => v.r = x),
      stepper('Sets', v.s, 1, 1, x => v.s = x));

  paintTwists(); paintFeel(); paintPrev();
  const box = h('div', { role: 'dialog', 'aria-modal': 'true', 'aria-label': ex.n },
    h('div', { class: 'sh-h' }, h('h2', { text: ex.n }), h('button', { class: 'close', type: 'button', 'aria-label': 'Close', text: '×', onclick: closeSheet })),
    h('p', { class: 'sh-cue', text: ex.cue || REGIONS[ex.g] }),
    last ? h('p', { class: 'sh-last', text: `Last time (${niceDay(last.d).toLowerCase()}): ${fmtSet(ex, last)}${last.tw && last.tw !== 'Standard' ? ' · ' + last.tw : ''}. Logged on ${daysOf(ex.id)} day${daysOf(ex.id) === 1 ? '' : 's'}.` }) : null,
    steps,
    h('p', { class: 'lab', text: 'Twist' }), twistBox,
    h('details', { class: 'more' }, h('summary', { text: 'How it felt, notes, your own twist' }),
      h('p', { class: 'lab', text: 'How it felt' }), feelBox,
      h('p', { class: 'lab', text: 'Note' }), note,
      h('p', { class: 'lab', text: 'Your own twist' }), custom),
    preview,
    h('button', { class: 'btn go wide', type: 'button', text: 'Log it', onclick: () => {
      const vals = ex.k === 'time' ? { m: v.m } : { w: ex.k === 'load' ? v.w : 0, r: v.r, s: v.s };
      closeSheet(); addLog(ex, vals, twist, feel, note.value.trim());
    } }));
  const wrap = h('div', { class: 'modal', onclick: e => { if (e.target === wrap) closeSheet(); } }, box);
  document.body.append(wrap);
  setTimeout(() => box.querySelector('.btn.go').focus({ preventScroll: true }), 30);
}

function addOwn() {
  closeSheet();
  let g = exFilter in REGIONS ? exFilter : 'legs', k = 'load';
  const name = h('input', { class: 'inp', type: 'text', placeholder: 'e.g. Bulgarian split squat', 'aria-label': 'Exercise name' });
  const cue = h('input', { class: 'inp', type: 'text', placeholder: 'A cue to remember (optional)', 'aria-label': 'Cue' });
  const gBox = h('div', { class: 'chips' }); const kBox = h('div', { class: 'chips' });
  const paint = () => {
    gBox.replaceChildren(...Object.entries(REGIONS).map(([id, l]) => h('button', { class: 'chip' + (g === id ? ' on' : ''), type: 'button', text: l, onclick: () => { g = id; if (id === 'cardio') k = 'time'; paint(); } })));
    kBox.replaceChildren(...[['load', 'Weight × reps'], ['body', 'Reps only'], ['time', 'Minutes']].map(([id, l]) => h('button', { class: 'chip' + (k === id ? ' on' : ''), type: 'button', text: l, onclick: () => { k = id; paint(); } })));
  };
  paint();
  const err = h('p', { class: 'hint', style: 'color:var(--red)' });
  const box = h('div', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Add your own exercise' },
    h('div', { class: 'sh-h' }, h('h2', { text: 'Add your own exercise' }), h('button', { class: 'close', type: 'button', 'aria-label': 'Close', text: '×', onclick: closeSheet })),
    h('p', { class: 'lab', text: 'Name' }), name,
    h('p', { class: 'lab', text: 'Body area' }), gBox,
    h('p', { class: 'lab', text: 'You count it in' }), kBox,
    h('p', { class: 'lab', text: 'Cue' }), cue, err,
    h('div', { style: 'margin-top:16px' }, h('button', { class: 'btn go wide', type: 'button', text: 'Add and log it', onclick: () => {
      const n = name.value.trim(); if (!n) { err.textContent = 'Give it a name first.'; name.focus(); return; }
      if (allEx().some(e => e.n.toLowerCase() === n.toLowerCase())) { err.textContent = 'That one is already in the list.'; return; }
      const ex = { id: 'my-' + Date.now().toString(36), n, g, k, d: k === 'time' ? [6] : k === 'load' ? [20, 10, 3] : [0, 10, 2], cue: cue.value.trim() };
      S.custom.push(ex); save(); closeSheet(); sheet(ex);
    } })));
  const wrap = h('div', { class: 'modal', onclick: e => { if (e.target === wrap) closeSheet(); } }, box);
  document.body.append(wrap); name.focus();
}

// ---------- Backup, restore, Obsidian ----------
function download(name, text, type) {
  const a = h('a', { href: URL.createObjectURL(new Blob([text], { type })), download: name });
  document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
const backup = () => download(`frequent-workouts-${ymd()}.json`, JSON.stringify(S, null, 1), 'application/json');
function restore(file) {
  file.text().then(t => JSON.parse(t)).then(b => {
    if (!b || !Array.isArray(b.log)) throw 0;
    const ids = new Set(S.log.map(e => e.id)); for (const e of b.log) if (e && e.id && !ids.has(e.id)) S.log.push(e);
    S.log.sort((a, c) => a.t - c.t);
    const wids = new Set((S.weigh || []).map(e => e.id)); S.weigh = S.weigh || []; for (const e of b.weigh || []) if (e && e.id && !wids.has(e.id)) S.weigh.push(e);
    S.weigh.sort((a, c) => a.t - c.t);
    const cids = new Set(S.custom.map(e => e.id)); for (const e of b.custom || []) if (!cids.has(e.id)) S.custom.push(e);
    save(); paintMo(); render(); toast('Backup added. Nothing was erased.');
  }).catch(() => toast('That file is not a Frequent Workouts backup.'));
}
function obsidian() {
  if (!S.log.length && !(S.weigh || []).length) { toast('Nothing logged yet.'); return; }
  const byDay = {}; for (const e of S.log) (byDay[e.d] = byDay[e.d] || []).push(e);
  const wByDay = {}; for (const w of S.weigh || []) wByDay[w.d] = w;
  let md = `# Frequent Workouts log\n\nExported ${ymd()}. One section per day.\n`;
  for (const d of [...new Set([...Object.keys(byDay), ...Object.keys(wByDay)])].sort().reverse()) {
    md += `\n## ${d}\n\n`;
    if (wByDay[d]) md += `- Weight: ${fmtLb(wByDay[d].lb)} lb${wByDay[d].bf ? ` · ${fmtLb(wByDay[d].bf)}% body fat` : ''} #weigh-in\n`;
    if (!byDay[d]) continue;
    for (const e of byDay[d]) {
      const ex = exById(e.ex) || { n: e.ex, k: 'load' };
      const bits = [fmtSet(ex, e), e.tw && e.tw !== 'Standard' ? e.tw : '', e.f || '', e.note || ''].filter(Boolean).join(' · ');
      md += `- [[${ex.n}]] ${bits}${e.why === 'new exercise' ? ' #new-exercise' : e.why === 'new twist' ? ' #new-twist' : ''}\n`;
    }
  }
  download(`Frequent Workouts ${ymd()}.md`, md, 'text/markdown');
}
function about() {
  closeSheet();
  const box = h('div', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'How momentum works' },
    h('div', { class: 'sh-h' }, h('h2', { text: 'How momentum works' }), h('button', { class: 'close', type: 'button', 'aria-label': 'Close', text: '×', onclick: closeSheet })),
    h('p', { text: `Every log is +${PTS.log}. Trying an exercise for the first time is +${PTS.log + PTS.newEx}. A twist you have never done on an exercise you know, like a 5-second squeeze or slow lowering, is +${PTS.log + PTS.newTwist}. Coming back to an exercise after three weeks is +${PTS.log + PTS.back}.` }),
    h('p', { text: 'Your score fades by a seventh each day, so a week off costs about two thirds of it. It never goes negative, and one good session brings it right back.' }),
    h('p', { class: 'hint', text: 'Starting numbers come from your gym inventory where there was one. After your first log, + Log always repeats what you did last time.' }),
    h('div', { style: 'margin-top:14px' }, h('button', { class: 'btn go wide', type: 'button', text: 'Got it', onclick: closeSheet })));
  const wrap = h('div', { class: 'modal', onclick: e => { if (e.target === wrap) closeSheet(); } }, box);
  document.body.append(wrap);
}

// ---------- Tabs ----------
let tab = 'today';
const VIEWS = { today, exercises, history };
const render = () => VIEWS[tab]();
function go(t) { tab = t; document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t)); render(); }
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { go(b.dataset.tab); scrollTo(0, 0); });
$('#menuB').onclick = e => { e.stopPropagation(); $('#menu').hidden = !$('#menu').hidden; };
document.addEventListener('click', e => { if (!e.target.closest('#menu')) $('#menu').hidden = true; });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
$('#menu').addEventListener('click', e => { const a = e.target.dataset.act; if (a === 'backup') backup(); if (a === 'about') about(); if (a === 'obsidian') obsidian(); if (a === 'fitdays') fitdaysHelp(); if (a) $('#menu').hidden = true; });
$('#restore').onchange = e => { const f = e.target.files[0]; if (f) restore(f); e.target.value = ''; $('#menu').hidden = true; };
$('#mo').onclick = () => { const t = ymd(); toast(`Momentum ${moScore()} · today +${ptsByDay()[t] || 0}. It fades a little each rest day.`); };
// A new day while the app stays open: refresh so "today" stays honest.
let shownDay = ymd();
document.addEventListener('visibilitychange', () => { if (!document.hidden && ymd() !== shownDay) { shownDay = ymd(); paintMo(); render(); } });

weighFromUrl(); paintMo(); go('today');
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
