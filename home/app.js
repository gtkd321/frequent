// Frequent Home: one path from your parents' house to your own place, then a house.
// Everything is saved on this device (localStorage). No account.
const KEY = 'frequent-home-v1';
const DEF = {
  saved: 0, debt: 3500,
  target: 20000,      // move-in fund: ~5% down on a $165k double-wide on its own lot + closing + 3 months reserve
  tradeFund: 35000,   // savings for the next down payment and reserves before trading up
  hoursCap: 45,       // weekly work hours before the pace check warns
  why: '',
  days: {},           // 'YYYY-MM-DD': { earned, hours, energy }
  savedLog: [],       // [{ d, v }] each time Saved is updated
  checks: {}
};
let S = load();
function load() { try { return Object.assign({}, DEF, JSON.parse(localStorage.getItem(KEY)) || {}); } catch { return { ...DEF }; } }
function save() { localStorage.setItem(KEY, JSON.stringify(S)); }

const $ = s => document.querySelector(s);
const money = n => '$' + Math.round(n).toLocaleString('en-US');
const iso = d => { const z = new Date(d); z.setMinutes(z.getMinutes() - z.getTimezoneOffset()); return z.toISOString().slice(0, 10); };
const today = () => iso(new Date());
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const STEPS = ['Pay card', 'Move-in fund', 'Own keys', 'Trade-up ready', 'House'];
const KEYS = [['pre', 'Pre-approved for a loan that covers manufactured homes'], ['found', 'Found a double-wide on its own lot (permanent foundation, titled as real property)'], ['keys', 'Closed and got the keys']];
const TRADE = [['rate', 'Mortgage rates near or below 6.25%'], ['rent', 'Your place could rent for $1,600+ a month']];

function stage() {
  if (S.debt > 0) return 0;
  if (!S.checks.keys && S.saved < S.target) return 1;
  if (!S.checks.keys) return 2;
  if (!(S.checks.rate && S.checks.rent && S.saved >= S.tradeFund)) return 3;
  if (!S.checks.house) return 4;
  return 5;
}

// Average dollars added to savings per week, from the last 60 days of Saved updates
function weeklySaveRate() {
  const cut = Date.now() - 60 * 864e5;
  const pts = S.savedLog.filter(p => new Date(p.d).getTime() >= cut);
  if (pts.length < 2) return 0;
  const a = pts[0], b = pts[pts.length - 1];
  const wks = (new Date(b.d) - new Date(a.d)) / (7 * 864e5);
  return wks >= 1 ? (b.v - a.v) / wks : 0;
}
function eta(left) {
  const r = weeklySaveRate();
  if (left <= 0) return '';
  if (r <= 0) return 'Update Saved a few times over a couple of weeks and an arrival date shows here.';
  const wks = left / r, d = new Date(Date.now() + wks * 7 * 864e5);
  return `At ${money(r)} a week, about ${d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.`;
}

function bar(p) { return `<div class="bar"><i style="width:${Math.max(0, Math.min(100, p * 100)).toFixed(1)}%"></i></div>`; }
function chk(id, label, on, auto) { return `<button class="chk${on ? ' on' : ''}${auto ? ' auto' : ''}" ${auto ? 'disabled' : `data-chk="${id}"`}><b>${on ? '✓' : ''}</b><span>${esc(label)}</span></button>`; }

function stepCard() {
  const st = stage();
  let h = '';
  if (st === 0) {
    const start = Math.max(S.debtStart || S.debt, S.debt);
    h = `<p class="k">Step 1 · Clear the card</p><div class="big">${money(S.debt)}</div><div class="of">left on the card</div>${bar(1 - S.debt / start)}
      <p class="hint">Keep paying on time. A clean record is what gets you a home loan later.</p>`;
  } else if (st === 1) {
    h = `<p class="k">Step 2 · Move-in fund</p><div class="big">${money(S.saved)}</div><div class="of">of ${money(S.target)}</div>${bar(S.saved / S.target)}
      <p class="hint">${money(S.target - S.saved)} to go. ${eta(S.target - S.saved)}</p>`;
  } else if (st === 2) {
    h = `<p class="k">Step 3 · Your own keys</p><h1>Fund ready. Go find your place.</h1><div class="checks">${KEYS.map(([id, l]) => chk(id, l, S.checks[id])).join('')}</div>
      <p class="hint">Skip trailers in parks: values drop and lot rent keeps rising.</p>`;
  } else if (st === 3) {
    h = `<p class="k">Step 4 · Trade-up ready?</p><h1>All three green, then trade up</h1><div class="checks">${TRADE.map(([id, l]) => chk(id, l, S.checks[id])).join('')}
      ${chk('', `${money(S.saved)} of ${money(S.tradeFund)} saved for the next down payment`, S.saved >= S.tradeFund, true)}</div>
      ${bar(S.saved / S.tradeFund)}<p class="hint">Until then, living in your place and saving the difference builds the most wealth.</p>`;
  } else if (st === 4) {
    h = `<p class="k">Step 5 · The house</p><h1>Ready to buy the house</h1><div class="checks">${chk('house', 'Closed on the house', S.checks.house)}</div>
      <p class="hint">Rent out your first place, or sell it within 3 years of moving out while the gain can still be tax-free.</p>`;
  } else {
    h = `<p class="k">Done</p><h1>You made it home.</h1>`;
  }
  const ladder = STEPS.map((s, i) => `<span class="${i < st ? 'done' : i === st ? 'now' : ''}">${s}</span>`).join('');
  return `<section class="card">${h}<div class="ladder">${ladder}</div>
    <p class="hint" style="margin-top:12px"><button class="why" data-act="why">${S.why ? 'Why: ' + esc(S.why) : '+ Add your why'}</button></p></section>`;
}

function logCard() {
  const t = S.days[today()] || {};
  const e = t.energy || 0;
  const labels = ['Wiped', 'Low', 'OK', 'Good', 'Fresh'];
  return `<section class="card"><p class="k">Today</p>
    <div class="row"><div class="field"><label for="earned">Earned</label><input id="earned" inputmode="decimal" placeholder="$0" value="${t.earned ?? ''}"></div>
    <div class="field"><label for="hours">Hours worked</label><input id="hours" inputmode="decimal" placeholder="0" value="${t.hours ?? ''}"></div></div>
    <div class="energy" role="group" aria-label="Energy">${labels.map((l, i) => `<button data-en="${i + 1}" class="${e === i + 1 ? 'on' : ''}"><span>${i + 1}</span>${l}</button>`).join('')}</div>
    <button class="go" data-act="log">${S.days[today()] ? 'Update today' : 'Log today'}</button></section>`;
}

function paceCard() {
  const last = [];
  for (let i = 13; i >= 0; i--) { const d = iso(Date.now() - i * 864e5); last.push([d, S.days[d]]); }
  const wk = last.slice(7).map(x => x[1]).filter(Boolean);
  const earned = wk.reduce((a, x) => a + (+x.earned || 0), 0);
  const hours = wk.reduce((a, x) => a + (+x.hours || 0), 0);
  const ens = wk.filter(x => x.energy).map(x => x.energy);
  const avgE = ens.length ? ens.reduce((a, b) => a + b, 0) / ens.length : 0;
  const recent = Object.keys(S.days).sort().slice(-3).map(d => S.days[d].energy).filter(Boolean);
  const drained = recent.length === 3 && recent.every(x => x <= 2);
  const over = hours > S.hoursCap;
  let msg, cls;
  if (!wk.length) { msg = 'Log a day to see your pace.'; cls = ''; }
  else if (drained || over) {
    cls = 'warn';
    msg = drained ? 'Three drained days in a row. Take a lighter day. A pace you can hold beats a sprint that wears you out.'
                  : `${Math.round(hours)} hours this week, over your ${S.hoursCap}. Ease off before it costs you a week.`;
  } else { cls = 'ok'; msg = 'Steady pace. This is the one that gets you there.'; }
  const maxH = Math.max(8, ...last.map(x => +(x[1]?.hours) || 0));
  const spark = last.map(([d, x]) => `<i class="${x?.energy ? 'e' + x.energy : ''}" style="height:${x ? Math.max(8, (+x.hours || 0) / maxH * 100) : 4}%" title="${d}"></i>`).join('');
  return `<section class="card ${cls}"><p class="k">Last 7 days</p>
    <div class="stats"><div><b>${money(earned)}</b><small>earned</small></div><div><b>${Math.round(hours * 10) / 10}</b><small>hours</small></div>
    <div><b>${hours ? money(earned / hours) : '–'}</b><small>per hour</small></div><div><b>${avgE ? avgE.toFixed(1) : '–'}</b><small>energy</small></div></div>
    <div class="spark" aria-label="Hours over two weeks, colored by energy">${spark}</div>
    <p class="hint">${msg}</p></section>`;
}

function balCard() {
  return `<section class="card"><p class="k">Balances</p><div class="bal">
    <button data-act="saved"><small>Saved</small><b>${money(S.saved)}</b></button>
    <button data-act="debt"><small>Card</small><b>${money(S.debt)}</b></button></div>
    <p class="hint">Tap to update whenever you check your bank.</p></section>`;
}

let energyPick = null;
function render() {
  energyPick = (S.days[today()] || {}).energy || null;
  $('#main').innerHTML = stepCard() + logCard() + paceCard() + balCard();
}

function ask(title, fields, onOk) {
  const f = $('#dlgF');
  f.innerHTML = `<h3>${esc(title)}</h3>${fields.map(([id, l, v, t]) => `<div class="field"><label for="q_${id}">${esc(l)}</label><input id="q_${id}" ${t === 'text' ? '' : 'inputmode="decimal"'} value="${esc(v ?? '')}"></div>`).join('')}
    <div class="btns"><button class="go ghost" value="cancel">Cancel</button><button class="go" value="ok">Save</button></div>`;
  const d = $('#dlg');
  d.onclose = () => { if (d.returnValue === 'ok') { const out = {}; fields.forEach(([id, , , t]) => { const v = $('#q_' + id).value.trim(); out[id] = t === 'text' ? v : parseFloat(v.replace(/[$,]/g, '')); }); onOk(out); save(); render(); } };
  d.returnValue = ''; d.showModal(); setTimeout(() => $('#q_' + fields[0][0]).select(), 30);
}

document.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) { if (!e.target.closest('#menu')) $('#menu').hidden = true; return; }
  if (b.id === 'menuB') { $('#menu').hidden = !$('#menu').hidden; return; }
  if (b.closest('#menu')) $('#menu').hidden = true;
  if (b.dataset.en) { energyPick = +b.dataset.en; document.querySelectorAll('.energy button').forEach(x => x.classList.toggle('on', x === b)); return; }
  if (b.dataset.chk) { S.checks[b.dataset.chk] = !S.checks[b.dataset.chk]; save(); render(); return; }
  const a = b.dataset.act;
  if (a === 'log') {
    const n = id => { const v = parseFloat($('#' + id).value.replace(/[$,]/g, '')); return isNaN(v) ? 0 : v; };
    S.days[today()] = { earned: n('earned'), hours: n('hours'), energy: energyPick };
    save(); render();
  } else if (a === 'saved') ask('How much is saved toward your place?', [['v', 'Saved', S.saved]], o => { if (!isNaN(o.v)) { S.saved = o.v; S.savedLog.push({ d: today(), v: o.v }); S.savedLog = S.savedLog.filter((p, i, arr) => i === arr.length - 1 || p.d !== arr[i + 1].d); } });
  else if (a === 'debt') ask('Card balance now?', [['v', 'Card balance', S.debt]], o => { if (!isNaN(o.v)) { S.debtStart = Math.max(S.debtStart || 0, S.debt, o.v); S.debt = Math.max(0, o.v); } });
  else if (a === 'why') ask('Why are you doing this?', [['v', 'One line, in your words', S.why, 'text']], o => { S.why = o.v; });
  else if (a === 'targets') ask('Targets', [['target', 'Move-in fund', S.target], ['tradeFund', 'Savings before trading up', S.tradeFund], ['hoursCap', 'Weekly hours before the pace warning', S.hoursCap]], o => { for (const k in o) if (!isNaN(o[k]) && o[k] > 0) S[k] = o[k]; });
  else if (a === 'backup') { const u = URL.createObjectURL(new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' })); const l = document.createElement('a'); l.href = u; l.download = `frequent-home-${today()}.json`; l.click(); }
  else if (a === 'reset') { if (confirm('Erase everything in Frequent Home on this device?')) { S = { ...DEF, days: {}, savedLog: [], checks: {} }; save(); render(); } }
});
$('#restore').addEventListener('change', async e => { try { S = Object.assign({}, DEF, JSON.parse(await e.target.files[0].text())); save(); render(); } catch { alert('That file could not be read.'); } });

render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
