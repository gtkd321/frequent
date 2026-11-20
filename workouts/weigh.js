// Frequent Workouts: weigh-ins. © 2026 Daniel Ilias Houlis. All rights reserved.
// Three ways in: type one, import the file Fitdays+ exports, or open a link from an iPhone Shortcut.
// Stored in S.weigh as { id, d, t, lb, bf?, bmi?, src }. Weight is kept in pounds.
'use strict';
const BROWSER_HISTORY = window.history; // app.js later declares its own history() view
const KG = 2.20462;
const fmtLb = n => (Math.round(n * 10) / 10).toFixed(1);
const weighs = () => (S.weigh || []).slice().sort((a, b) => a.t - b.t);
const lastWeigh = () => { const w = weighs(); return w[w.length - 1] || null; };
const agoTxt = d => { const n = daysBetween(d, ymd()); return n <= 0 ? 'today' : n === 1 ? 'yesterday' : `${n} days ago`; };

// Adds weigh-ins, skipping any already saved (same day, time to the minute and weight).
function addWeighs(list, src) {
  S.weigh = S.weigh || [];
  const key = w => `${w.d}|${Math.round(w.t / 6e4)}|${fmtLb(w.lb)}`;
  const have = new Set(S.weigh.map(key)); let added = 0;
  for (const w of list) {
    if (!(w.lb > 40 && w.lb < 800)) continue;
    const e = Object.assign({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), src }, w);
    if (have.has(key(e))) continue;
    have.add(key(e)); S.weigh.push(e); added++;
  }
  S.weigh.sort((a, b) => a.t - b.t); save(); return added;
}

// ---------- Today: one quiet line ----------
function weighRow() {
  const w = lastWeigh();
  return h('div', { class: 'wrow' },
    h('div', { class: 'wtxt' },
      h('span', { class: 'hint', text: 'Weight' }),
      w ? h('b', { text: `${fmtLb(w.lb)} lb` }) : h('b', { class: 'muted', text: 'No weigh-ins yet' }),
      w ? h('span', { class: 'hint', text: agoTxt(w.d) }) : null),
    h('button', { class: 'btn', type: 'button', text: '+ Weigh-in', onclick: () => weighSheet() }));
}

// ---------- History: weight section ----------
function weighSection() {
  const all = weighs();
  const head = h('div', { class: 'wh' }, h('h2', { text: 'Weight' }),
    h('div', { class: 'row' },
      h('button', { class: 'btn', type: 'button', text: '+ Weigh-in', onclick: () => weighSheet() }),
      h('button', { class: 'btn', type: 'button', text: 'Import from Fitdays', onclick: () => fitdaysHelp() })));
  if (!all.length) return [head, h('div', { class: 'empty', text: 'Add a weigh-in, or import your history from Fitdays+.' })];
  const t = ymd(); const last = all[all.length - 1];
  // One reading per day (the last one), and a 7-day average so daily swings do not drown the trend.
  const byDay = {}; for (const w of all) byDay[w.d] = w;
  const days = Object.keys(byDay).sort();
  const avg = d => { const xs = days.filter(x => daysBetween(x, d) >= 0 && daysBetween(x, d) < 7).map(x => byDay[x].lb); return xs.reduce((a, b) => a + b, 0) / xs.length; };
  const ref = days.filter(d => daysBetween(d, last.d) >= 28).pop();
  const change = ref ? avg(last.d) - avg(ref) : null;
  const facts = h('div', { class: 'wfacts' },
    h('div', {}, h('b', { text: `${fmtLb(last.lb)} lb` }), h('span', { text: `Latest, ${agoTxt(last.d)}` })),
    h('div', {}, h('b', { text: fmtLb(avg(last.d)) }), h('span', { text: '7-day average' })),
    change != null ? h('div', {}, h('b', { text: (change > 0 ? '+' : change < 0 ? '−' : '') + fmtLb(Math.abs(change)) }), h('span', { text: 'Change in 4 weeks' })) : null,
    last.bf ? h('div', {}, h('b', { text: fmtLb(last.bf) + '%' }), h('span', { text: 'body fat' })) : null);
  const recent = all.slice(-8).reverse();
  return [head, facts, weighChart(days.filter(d => daysBetween(d, t) < 120).map(d => [d, byDay[d].lb, avg(d)])),
    h('details', { class: 'more' }, h('summary', { text: `All weigh-ins (${all.length})` }),
      h('div', { class: 'list', style: 'margin-top:8px' }, (all.length > 8 ? all.slice().reverse() : recent).slice(0, 200).map(w => h('div', { class: 'ent' },
        h('div', { class: 'what' }, `${fmtLb(w.lb)} lb`, h('small', { text: [niceDay(w.d), w.bf ? `${fmtLb(w.bf)}% fat` : '', w.src === 'fitdays' ? 'Fitdays' : w.src === 'shortcut' ? 'Shortcut' : ''].filter(Boolean).join(' · ') })),
        h('button', { class: 'x', type: 'button', 'aria-label': 'Remove this weigh-in', text: '×', onclick: () => {
          const keep = w; S.weigh = S.weigh.filter(x => x.id !== w.id); save(); render();
          toast('Removed', () => { S.weigh.push(keep); S.weigh.sort((a, b) => a.t - b.t); save(); render(); });
        } }))))) ];
}

function weighChart(pts) {
  const NS = 'http://www.w3.org/2000/svg';
  const W = 400, H = 170, P = { l: 34, r: 8, t: 10, b: 22 };
  const box = h('div', { class: 'wchart' });
  if (pts.length < 2) { box.append(h('p', { class: 'hint', text: 'The chart appears after your second weigh-in day.' })); return box; }
  const t0 = new Date(pts[0][0] + 'T12:00'), t1 = new Date(pts[pts.length - 1][0] + 'T12:00');
  const span = Math.max(1, (t1 - t0) / 864e5);
  const vals = pts.flatMap(p => [p[1], p[2]]); let lo = Math.min(...vals), hi = Math.max(...vals);
  if (hi - lo < 4) { const m = (hi + lo) / 2; lo = m - 2; hi = m + 2; }
  lo = Math.floor(lo); hi = Math.ceil(hi);
  const x = d => P.l + (new Date(d + 'T12:00') - t0) / 864e5 / span * (W - P.l - P.r);
  const y = v => P.t + (hi - v) / (hi - lo) * (H - P.t - P.b);
  const el = (tag, a) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `Weight over ${Math.round(span)} days, from ${fmtLb(pts[0][1])} to ${fmtLb(pts[pts.length - 1][1])} pounds` });
  for (const v of [lo, (lo + hi) / 2, hi]) {
    svg.append(el('line', { x1: P.l, x2: W - P.r, y1: y(v), y2: y(v), class: 'grid' }));
    const tx = el('text', { x: P.l - 6, y: y(v) + 4, 'text-anchor': 'end', class: 'ax' }); tx.textContent = Math.round(v); svg.append(tx);
  }
  for (const [d, i] of [[pts[0][0], 'start'], [pts[pts.length - 1][0], 'end']]) {
    const tx = el('text', { x: x(d), y: H - 4, 'text-anchor': i, class: 'ax' });
    tx.textContent = new Date(d + 'T12:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); svg.append(tx);
  }
  for (const p of pts) svg.append(el('circle', { cx: x(p[0]), cy: y(p[1]), r: 2.4, class: 'pt' }));
  svg.append(el('path', { d: pts.map((p, i) => `${i ? 'L' : 'M'}${x(p[0]).toFixed(1)},${y(p[2]).toFixed(1)}`).join(''), class: 'trend' }));
  box.append(svg, h('div', { class: 'legend' }, h('span', {}, h('i', { class: 'lg-pt' }), 'Weigh-in'), h('span', {}, h('i', { class: 'lg-tr' }), '7-day average')));
  return box;
}

// ---------- Type one in ----------
function weighSheet() {
  closeSheet(); $('#toast').classList.remove('on');
  const last = lastWeigh(); let lb = last ? last.lb : 180, bf = last && last.bf ? last.bf : 0;
  const date = h('input', { class: 'inp', type: 'date', value: ymd(), max: ymd(), 'aria-label': 'Date' });
  const box = h('div', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Weigh-in' },
    h('div', { class: 'sh-h' }, h('h2', { text: 'Weigh-in' }), h('button', { class: 'close', type: 'button', 'aria-label': 'Close', text: '×', onclick: closeSheet })),
    h('p', { class: 'sh-cue', text: last ? `Last: ${fmtLb(last.lb)} lb, ${agoTxt(last.d)}.` : 'Same time of day each time gives the clearest trend, like first thing in the morning.' }),
    h('div', { class: 'steps' }, stepper('Pounds', lb, 0.2, 40, v => lb = v)),
    h('details', { class: 'more' }, h('summary', { text: 'Date, body fat' }),
      h('p', { class: 'lab', text: 'Date' }), date,
      h('p', { class: 'lab', text: 'Body fat %' }), h('div', { class: 'steps' }, stepper('Body fat %', bf, 0.1, 0, v => bf = v))),
    h('div', { style: 'margin-top:18px' }, h('button', { class: 'btn go wide', type: 'button', text: 'Save weigh-in', onclick: () => {
      const d = date.value || ymd(); const now = new Date();
      const t = d === ymd() ? now.getTime() : new Date(d + 'T08:00').getTime();
      const w = { d, t, lb: Math.round(lb * 10) / 10 }; if (bf > 0) w.bf = Math.round(bf * 10) / 10;
      addWeighs([w], 'manual'); closeSheet(); render(); toast(`Saved ${fmtLb(w.lb)} lb`);
    } })));
  const wrap = h('div', { class: 'modal', onclick: e => { if (e.target === wrap) closeSheet(); } }, box);
  document.body.append(wrap);
}

// ---------- Import from Fitdays+ ----------
function fitdaysHelp() {
  closeSheet();
  const file = h('input', { type: 'file', accept: '.csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', hidden: true });
  file.onchange = () => { const f = file.files[0]; if (f) readFitdays(f); };
  const shortcutUrl = location.origin + location.pathname + '?weigh=';
  const box = h('div', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Import from Fitdays' },
    h('div', { class: 'sh-h' }, h('h2', { text: 'Import from Fitdays+' }), h('button', { class: 'close', type: 'button', 'aria-label': 'Close', text: '×', onclick: closeSheet })),
    h('ol', { class: 'steps-list' },
      h('li', {}, 'In Fitdays+, open your history and tap ', h('b', { text: '⋮' }), ' (top right), then ', h('b', { text: 'Export' }), '. Choose ', h('b', { text: 'All data' }), '.'),
      h('li', {}, 'Tap the share icon and choose ', h('b', { text: 'Save to Files' }), '.'),
      h('li', {}, 'Come back here and pick that file. Weigh-ins you already have are skipped, so you can import again any time.')),
    h('button', { class: 'btn go wide', type: 'button', text: 'Choose the Fitdays file', onclick: () => file.click() }), file,
    h('details', { class: 'more' }, h('summary', { text: 'Every morning, automatically (iPhone Shortcut)' }),
      h('p', { class: 'hint', text: 'If Fitdays+ syncs your weight to Apple Health, a Shortcut can bring the latest reading here in one tap.' }),
      h('ol', { class: 'steps-list' },
        h('li', {}, 'In Shortcuts, make a new shortcut. Add ', h('b', { text: 'Find Health Samples' }), ': Type is Weight, sort by Start Date, Latest First, limit 1.'),
        h('li', {}, 'Add ', h('b', { text: 'Get Details of Health Samples' }), ' and choose ', h('b', { text: 'Value' }), '.'),
        h('li', {}, 'Add ', h('b', { text: 'Open URLs' }), ' with the address below, and put the Value right after the = sign.'),
        h('li', {}, 'Add it to your Home Screen, or run it from an automation after your morning weigh-in.')),
      h('div', { class: 'code', text: shortcutUrl }),
      h('div', { class: 'row', style: 'margin-top:8px' }, h('button', { class: 'btn', type: 'button', text: 'Copy address', onclick: () => {
        (navigator.clipboard ? navigator.clipboard.writeText(shortcutUrl) : Promise.reject()).then(() => toast('Copied')).catch(() => toast('Press and hold the address to copy it'));
      } })),
      h('p', { class: 'hint', text: 'Pounds are assumed. If your Health weight is in kilograms, add &unit=kg to the end.' })));
  const wrap = h('div', { class: 'modal', onclick: e => { if (e.target === wrap) closeSheet(); } }, box);
  document.body.append(wrap);
}

let xlsxP = null;
const loadXlsx = () => xlsxP || (xlsxP = new Promise((ok, bad) => {
  if (window.XLSX) return ok(window.XLSX);
  const s = document.createElement('script'); s.src = 'lib/xlsx.full.min.js'; s.onload = () => ok(window.XLSX); s.onerror = () => { xlsxP = null; bad(new Error('load')); }; document.head.append(s);
}));

// Pulls date, weight and body fat out of a Fitdays export. Column names vary by app version and language,
// so this looks for them by meaning and shows what it found before saving anything.
function parseRows(rows) {
  const norm = v => String(v == null ? '' : v).trim();
  let hi = -1, cols = null;
  for (let i = 0; i < Math.min(rows.length, 15) && hi < 0; i++) {
    const r = rows[i].map(c => norm(c).toLowerCase());
    const wi = r.findIndex(c => /(weight|体重|gewicht|poids|peso)/.test(c) && !/(lean|muscle|bone|fat|ideal|target|standard|control|goal|free)/.test(c));
    if (wi >= 0) { hi = i; cols = { w: wi, r };
      cols.d = r.findIndex(c => /(date|time|日期|时间|datum|fecha|zeit)/.test(c));
      cols.bf = r.findIndex(c => /(body ?fat|fat ?rate|bodyfat|体脂率|fat ?%|fat\(%\))/.test(c) && !/(mass|kg|lb|visceral|subcut)/.test(c));
      cols.bmi = r.findIndex(c => /^bmi\b|\bbmi\b/.test(c));
    }
  }
  if (hi < 0) return { err: 'Could not find a weight column in that file.' };
  const head = cols.r[cols.w];
  let unit = /\b(lb|lbs|pound)/.test(head) ? 'lb' : /\bkg\b|kg\)|\(kg/.test(head) ? 'kg' : /\bst\b/.test(head) ? 'st' : /斤|jin/.test(head) ? 'jin' : '';
  const out = []; let noDate = 0;
  for (const r of rows.slice(hi + 1)) {
    const raw = norm(r[cols.w]); const n = parseFloat(raw.replace(',', '.').replace(/[^\d.]/g, ''));
    if (!isFinite(n) || n <= 0) continue;
    if (!unit) unit = /lb/i.test(raw) ? 'lb' : /kg/i.test(raw) ? 'kg' : '';
    const when = toDate(cols.d >= 0 ? r[cols.d] : null);
    if (!when) { noDate++; continue; }
    const row = { d: ymd(when), t: when.getTime(), v: n };
    let bf = cols.bf >= 0 ? parseFloat(norm(r[cols.bf]).replace(',', '.')) : NaN; if (bf > 0 && bf < 1) bf *= 100; // "23.9%" can arrive as 0.239
    if (isFinite(bf) && bf > 0 && bf < 80) row.bf = bf;
    const bmi = cols.bmi >= 0 ? parseFloat(norm(r[cols.bmi]).replace(',', '.')) : NaN; if (isFinite(bmi) && bmi > 8 && bmi < 80) row.bmi = bmi;
    out.push(row);
  }
  if (!out.length) return { err: noDate ? 'Found weights, but no dates to go with them.' : 'No weigh-ins found in that file.' };
  if (!unit) { const med = out.map(r => r.v).sort((a, b) => a - b)[out.length >> 1]; unit = med > 140 ? 'lb' : 'kg'; out.guessed = true; }
  return { rows: out, unit, guessed: !!out.guessed, head };
}
function toDate(v) {
  if (v == null || v === '') return null;
  if (v instanceof Date) return isNaN(v) ? null : v;
  if (typeof v === 'number') { if (v > 20000 && v < 80000) return new Date(Math.round((v - 25569) * 864e5) + new Date().getTimezoneOffset() * 6e4); if (v > 1e12) return new Date(v); if (v > 1e9) return new Date(v * 1000); return null; }
  const s = String(v).trim(); let m;
  if ((m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?/i))) return mk(+m[1], +m[2], +m[3], m[4], m[5], m[6], m[7]);
  if ((m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})(?:[ T]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?/i))) {
    let a = +m[1], b = +m[2], y = +m[3]; if (y < 100) y += 2000;
    // US order (month first) unless the first number cannot be a month.
    return a > 12 ? mk(y, b, a, m[4], m[5], m[6], m[7]) : mk(y, a, b, m[4], m[5], m[6], m[7]);
  }
  if ((m = s.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日(?:\s*(\d{1,2}):(\d{2}))?/))) return mk(+m[1], +m[2], +m[3], m[4], m[5]);
  const p = Date.parse(s); return isNaN(p) ? null : new Date(p);
}
function mk(y, mo, d, H, M, S2, ap) {
  let hh = H ? +H : 8; if (ap) { ap = ap.toLowerCase(); if (ap === 'pm' && hh < 12) hh += 12; if (ap === 'am' && hh === 12) hh = 0; }
  const dt = new Date(y, mo - 1, d, hh, M ? +M : 0, S2 ? +S2 : 0);
  return dt.getMonth() === mo - 1 && y > 2000 && y < 2100 ? dt : null;
}
const toLb = (v, u) => u === 'kg' ? v * KG : u === 'st' ? v * 14 : u === 'jin' ? v * 0.5 * KG : v;

function readFitdays(f) {
  toast('Reading the file…');
  Promise.all([loadXlsx(), f.arrayBuffer()]).then(([X, buf]) => {
    const wb = X.read(buf, { type: 'array', cellDates: true, codepage: 65001 });
    let res = { err: 'That file has no sheets.' };
    for (const name of wb.SheetNames) { const rows = X.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: '' }); res = parseRows(rows); if (!res.err) break; }
    if (res.err) { toast(res.err); return; }
    previewImport(res);
  }).catch(() => toast('Could not read that file. Try exporting it again from Fitdays+.'));
}
function previewImport(res) {
  closeSheet(); $('#toast').classList.remove('on');
  let unit = res.unit;
  const sum = h('div', { class: 'imp' }); const unitBox = h('div', { class: 'chips' });
  const paint = () => {
    const rows = res.rows.slice().sort((a, b) => a.t - b.t); const lb = r => toLb(r.v, unit);
    const first = rows[0], last = rows[rows.length - 1];
    sum.replaceChildren(
      h('p', {}, h('b', { text: `${rows.length} weigh-in${rows.length === 1 ? '' : 's'}` }), ` from ${niceDay(first.d)} to ${niceDay(last.d)}.`),
      h('p', {}, 'Latest: ', h('b', { text: `${fmtLb(lb(last))} lb` }), last.bf ? ` · ${fmtLb(last.bf)}% body fat` : ''),
      h('p', { class: 'hint', text: `Read from the column “${res.head}”.` }));
    unitBox.replaceChildren(...[['lb', 'Pounds'], ['kg', 'Kilograms']].map(([u, l]) => h('button', { class: 'chip' + (unit === u ? ' on' : ''), type: 'button', 'aria-pressed': String(unit === u), text: l, onclick: () => { unit = u; paint(); } })));
  };
  paint();
  const box = h('div', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Check the import' },
    h('div', { class: 'sh-h' }, h('h2', { text: 'Check before importing' }), h('button', { class: 'close', type: 'button', 'aria-label': 'Close', text: '×', onclick: closeSheet })),
    sum,
    h('p', { class: 'lab', text: res.guessed ? 'The file does not say the unit. Which is it?' : 'Unit in the file' }), unitBox,
    h('div', { style: 'margin-top:18px' }, h('button', { class: 'btn go wide', type: 'button', text: 'Import', onclick: () => {
      const n = addWeighs(res.rows.map(r => { const w = { d: r.d, t: r.t, lb: Math.round(toLb(r.v, unit) * 10) / 10 }; if (r.bf) w.bf = r.bf; if (r.bmi) w.bmi = r.bmi; return w; }), 'fitdays');
      closeSheet(); go('history'); toast(n ? `Imported ${n} weigh-in${n === 1 ? '' : 's'}` : 'Those weigh-ins were already here');
    } })));
  const wrap = h('div', { class: 'modal', onclick: e => { if (e.target === wrap) closeSheet(); } }, box);
  document.body.append(wrap);
}

// ---------- From a link: ?weigh=182.4[&unit=kg][&fat=22.1][&date=2026-11-20] ----------
function weighFromUrl() {
  let q; try { q = new URLSearchParams(location.search); } catch (e) { return; }
  if (!q.has('weigh')) return;
  const raw = q.get('weigh') || ''; const n = parseFloat(raw.replace(',', '.').replace(/[^\d.]/g, ''));
  const unit = (q.get('unit') || (/kg/i.test(raw) ? 'kg' : 'lb')).toLowerCase();
  const dq = q.get('date'); const when = dq ? toDate(dq) : new Date();
  try { BROWSER_HISTORY.replaceState(null, '', location.pathname); } catch (e) { /* preview frames may block this */ }
  if (!isFinite(n) || !when) { toast('That weigh-in link had no weight in it.'); return; }
  const w = { d: ymd(when), t: when.getTime(), lb: Math.round(toLb(n, unit === 'kg' ? 'kg' : 'lb') * 10) / 10 };
  const bf = parseFloat(q.get('fat')); if (isFinite(bf) && bf > 0) w.bf = bf;
  const added = addWeighs([w], 'shortcut');
  setTimeout(() => toast(added ? `Weigh-in saved: ${fmtLb(w.lb)} lb` : 'That weigh-in was already saved'), 300);
}
