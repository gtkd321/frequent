// Frequent Routine: capsule meals, grooming, supplements and clothes as one morning checklist,
// plus the steps (shopping, prep) that keep each capsule stocked. Everything stays in localStorage.
(() => {
'use strict';
const KEY = 'frequent-routine-v1';
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const CATS = ['Grooming', 'Meals', 'Supplements', 'Clothes', 'Out the door'];

function seed() {
  const groups = [], items = [], steps = [];
  const G = (cat, name, type, list) => {
    const g = { id: uid(), cat, name, type }; groups.push(g);
    list.forEach(x => {
      const [name, st = []] = Array.isArray(x) ? x : [x];
      const it = { id: uid(), g: g.id, name, votes: 0 }; items.push(it);
      st.forEach(([where, text]) => steps.push({ id: uid(), item: it.id, where, text, done: false }));
    });
  };
  G('Grooming', 'Teeth and face', 'check', ['Brush teeth', 'Floss', 'Tongue scrape']);
  G('Meals', 'Breakfast', 'pick', [['Oatmeal', [['Publix', 'Old-fashioned oats'], ['Home', 'Cook a bowl of oatmeal']]], 'Eggs and toast']);
  G('Meals', 'Lunch', 'pick', [['Turkey sandwich', [['Publix', '3 lb deli turkey, sliced thin'], ['Publix', 'Sandwich bread'], ['Home', 'Pack sandwich in cooler bag']]]]);
  G('Meals', 'Fruit', 'pick', [['Grapes', [['Publix', 'Grapes'], ['Home', 'Wash and portion grapes into containers']]], 'Banana']);
  G('Meals', 'Drink', 'pick', [['Allulose lemonade', [['Publix', 'Lemons'], ['Online', 'Allulose'], ['Home', 'Mix a pitcher of lemonade']]], 'Water']);
  G('Supplements', 'Trying out', 'check', ['Vitamin D3', 'B-50 complex', 'Spirulina', 'AFA algae blend']);
  G('Clothes', 'Top', 'pick', ['Navy polo', 'Gray tee', 'Black tee']);
  G('Clothes', 'Bottom', 'pick', ['Dark jeans', 'Khaki chinos']);
  G('Clothes', 'Shoes', 'pick', ['White sneakers', 'Black sneakers']);
  G('Out the door', 'Car kit', 'check', ['Phone and charger', 'Water bottle', 'Sunglasses', 'Keys and wallet']);
  return { v: 1, groups, items, steps, log: {} };
}

let S;
try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; }
if (!S || !S.groups) S = seed();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
save();

let tab = 'today';
const today = () => (S.log[dayKey()] ||= []);
const isOn = id => (S.log[dayKey()] || []).includes(id);
const usesBefore = id => { const t = dayKey(); let n = 0; for (const d in S.log) if (d < t && S.log[d].includes(id)) n++; return n; };
const usesAll = id => { let n = 0; for (const d in S.log) if (S.log[d].includes(id)) n++; return n; };
// Rank by past uses plus upvotes. Today's taps don't reshuffle the list mid-morning.
const score = it => usesBefore(it.id) + (it.votes || 0);
const itemsOf = g => S.items.filter(i => i.g === g.id).sort((a, b) => score(b) - score(a));
const groupOf = it => S.groups.find(g => g.id === it.g);
const itemById = id => S.items.find(i => i.id === id);

function progress() {
  let done = 0, total = 0;
  for (const g of S.groups) {
    const its = itemsOf(g); if (!its.length) continue;
    if (g.type === 'check') { total += its.length; done += its.filter(i => isOn(i.id)).length; }
    else { total++; if (its.some(i => isOn(i.id))) done++; }
  }
  return { done, total };
}
function updateTop() { const p = progress(); $('#moN').textContent = `${p.done}/${p.total}`; }

// ---------- Today ----------
function renderToday() {
  const p = progress(), pct = p.total ? Math.round(100 * p.done / p.total) : 0;
  const d = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  const ready = p.total && p.done === p.total;
  const open = S.steps.filter(s => !s.done);
  const byWhere = {}; open.forEach(s => { const w = s.where || 'Anywhere'; byWhere[w] = (byWhere[w] || 0) + 1; });
  const top = Object.entries(byWhere).filter(([w]) => w !== 'Home').sort((a, b) => b[1] - a[1])[0] || Object.entries(byWhere)[0];
  const anyPickOpen = S.groups.some(g => g.type === 'pick' && itemsOf(g).length && !itemsOf(g).some(i => isOn(i.id)));
  let h = `<section class="hero${ready ? ' done' : ''}"><h1>${esc(d)}</h1>
    <div class="bar"><i style="width:${pct}%"></i></div>
    ${ready ? '<p class="ready" style="margin:0">All set. Out the door and drive.</p>'
      : `<div class="row"><span class="hint" style="flex:1">${p.done} of ${p.total} done</span>${anyPickOpen ? '<button class="btn go sm" id="usual">Use my usual</button>' : ''}</div>`}
  </section>`;
  if (top) h += `<div class="nudge"><p><b>${esc(top[0] === 'Home' ? 'Prep at home' : 'Next stop: ' + top[0])}</b><small>${top[1]} step${top[1] > 1 ? 's' : ''} open${open.length > top[1] ? `, ${open.length} in all` : ''}</small></p><button class="btn sm" data-go="steps">See steps</button></div>`;
  for (const cat of catsInUse()) {
    h += `<p class="cat">${esc(cat)}</p>`;
    for (const g of S.groups.filter(g => g.cat === cat)) {
      const its = itemsOf(g); if (!its.length) continue;
      if (g.type === 'check') {
        const n = its.filter(i => isOn(i.id)).length;
        h += `<div class="card"><div class="card-h"><h3>${esc(g.name)}</h3><span class="n${n === its.length ? ' ok' : ''}">${n}/${its.length}</span><button class="add-s" data-add="${g.id}" aria-label="Add to ${esc(g.name)}">+ Add</button></div><div class="checks">`
          + its.map(i => `<button class="ck${isOn(i.id) ? ' on' : ''}" data-tap="${i.id}" aria-pressed="${isOn(i.id)}"><span class="box"></span><span class="t">${esc(i.name)}</span></button>`).join('') + '</div></div>';
      } else {
        const fav = its[0];
        h += `<div class="card"><div class="card-h"><h3>${esc(g.name)}</h3><button class="add-s" data-add="${g.id}" aria-label="Add to ${esc(g.name)}">+ Add</button></div><div class="picks">`
          + its.map(i => `<button class="pk${isOn(i.id) ? ' on' : ''}${i === fav ? ' fav' : ''}" data-tap="${i.id}" aria-pressed="${isOn(i.id)}">${esc(i.name)}</button>`).join('') + '</div></div>';
      }
    }
  }
  h += `<button class="btn wide" data-add="" style="margin-top:8px">+ Add something new</button>`;
  h += foot();
  return h;
}
const catsInUse = () => { const used = [...new Set(S.groups.map(g => g.cat))]; return [...CATS.filter(c => used.includes(c)), ...used.filter(c => !CATS.includes(c))]; };

function tap(id) {
  const it = itemById(id), g = groupOf(it), t = today();
  if (t.includes(id)) t.splice(t.indexOf(id), 1);
  else {
    if (g.type === 'pick') itemsOf(g).forEach(o => { const k = t.indexOf(o.id); if (k >= 0) t.splice(k, 1); });
    t.push(id);
  }
  save(); render();
  const p = progress(); if (p.total && p.done === p.total) toast('All set. Drive safe.');
}
function useUsual() {
  const t = today(); let n = 0;
  for (const g of S.groups) {
    if (g.type !== 'pick') continue;
    const its = itemsOf(g); if (!its.length || its.some(i => t.includes(i.id))) continue;
    t.push(its[0].id); n++;
  }
  save(); render(); toast(`Picked your usual for ${n} slot${n === 1 ? '' : 's'}`);
}

// ---------- Steps ----------
function renderSteps() {
  const open = S.steps.filter(s => !s.done), done = S.steps.filter(s => s.done).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
  let h = `<h1>Steps</h1><p class="sub">What it takes to keep your capsules stocked, grouped by where you do it.</p>
    <button class="btn wide" id="addStep">+ Add a step</button>`;
  if (!open.length) h += `<p class="empty" style="margin-top:14px">Nothing open. When something runs low, tap Need again on it below or in Capsules.</p>`;
  const wheres = [...new Set(open.map(s => s.where || 'Anywhere'))].sort((a, b) => (a === 'Home') - (b === 'Home') || open.filter(s => (s.where || 'Anywhere') === b).length - open.filter(s => (s.where || 'Anywhere') === a).length);
  for (const w of wheres) {
    const list = open.filter(s => (s.where || 'Anywhere') === w);
    h += `<div class="where"><h2>${esc(w)}</h2><span>${list.length}</span></div><div class="checks">`
      + list.map(s => `<button class="ck" data-step="${s.id}"><span class="box"></span><span class="t">${esc(s.text)}${s.item && itemById(s.item) ? `<small>for ${esc(itemById(s.item).name)}</small>` : ''}</span></button>`).join('') + '</div>';
  }
  const restock = S.items.filter(i => S.steps.some(s => s.item === i.id) && S.steps.filter(s => s.item === i.id).every(s => s.done));
  if (restock.length) {
    h += `<p class="cat">Stocked</p><div class="list">` + restock.map(i => `<div class="it"><span class="name"><b>${esc(i.name)}</b><span>${S.steps.filter(s => s.item === i.id).length} steps done</span></span><button class="btn sm" data-again="${i.id}">Need again</button></div>`).join('') + '</div>';
  }
  const loose = done.filter(s => !restock.some(i => i.id === s.item)).slice(0, 12);
  if (loose.length) h += `<p class="cat">Done recently</p><div class="checks">` + loose.map(s => `<button class="ck on" data-step="${s.id}"><span class="box"></span><span class="t">${esc(s.text)}<small>${esc(s.where || 'Anywhere')}${s.item && itemById(s.item) ? ' · ' + esc(itemById(s.item).name) : ''}</small></span></button>`).join('') + '</div>';
  return h + foot();
}
function toggleStep(id) {
  const s = S.steps.find(x => x.id === id); s.done = !s.done; s.doneAt = s.done ? Date.now() : 0; save(); render();
  if (s.done) toast('Done', () => { s.done = false; save(); render(); });
}
function needAgain(itemId) { S.steps.filter(s => s.item === itemId).forEach(s => { s.done = false; s.doneAt = 0; }); save(); render(); toast('Steps are back on the list'); }

// ---------- Capsules ----------
function renderCapsules() {
  let h = `<h1>Capsules</h1><p class="sub">Your short lists. Each day you use something it moves up. Tap ▲ to push a favorite higher.</p>
    <button class="btn wide go" data-add="">+ Add something new</button>`;
  for (const cat of catsInUse()) {
    h += `<p class="cat">${esc(cat)}</p>`;
    for (const g of S.groups.filter(g => g.cat === cat)) {
      const its = itemsOf(g);
      h += `<div class="list"><div class="list-h"><h3>${esc(g.name)}</h3><small>${g.type === 'pick' ? 'pick one' : 'do all'}</small><button class="add-s" data-add="${g.id}">+ Add</button></div>`
        + (its.length ? its.map((i, k) => {
          const u = usesAll(i.id), st = S.steps.filter(s => s.item === i.id), op = st.filter(s => !s.done).length;
          const meta = [u ? `used ${u}×` : 'not used yet', st.length ? (op ? `${op} step${op > 1 ? 's' : ''} open` : 'stocked') : ''].filter(Boolean).join(' · ');
          return `<div class="it"><span class="rank">${k + 1}</span><button class="name" data-edit="${i.id}"><b>${esc(i.name)}</b><span>${meta}</span></button><button class="up" data-vote="${i.id}" aria-label="Upvote ${esc(i.name)}"><i class="tri"></i>${score(i)}</button></div>`;
        }).join('') : `<div class="it"><span class="hint">Empty. Add something here.</span></div>`) + '</div>';
    }
  }
  return h + foot();
}
function vote(id, btn) { const it = itemById(id); it.votes = (it.votes || 0) + 1; save(); render(); const b = document.querySelector(`[data-vote="${id}"]`); if (b) { b.classList.add('bump'); } toast(`${it.name} ▲`, () => { it.votes--; save(); render(); }); }

// ---------- History ----------
function renderHistory() {
  const days = Object.keys(S.log).filter(d => S.log[d].length).sort().reverse();
  let h = `<h1>History</h1><p class="sub">What you ate and wore, day by day.</p>`;
  if (!days.length) return h + `<p class="empty">Nothing yet. Check things off on Today and they show up here.</p>` + foot();
  const last = days.slice(0, 30), tally = {};
  last.forEach(d => S.log[d].forEach(id => { const it = itemById(id); if (it && groupOf(it)?.cat === 'Meals') tally[it.name] = (tally[it.name] || 0) + 1; }));
  const tl = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 8), mx = tl[0]?.[1] || 1;
  if (tl.length) h += `<h2>Meals, last ${last.length} day${last.length > 1 ? 's' : ''}</h2><div class="tally">` + tl.map(([n, c]) => `<div><span>${esc(n)}</span><i style="width:${Math.max(6, 100 * c / mx)}%"></i><em>${c}</em></div>`).join('') + '</div>';
  h += '<h2>Days</h2>';
  for (const d of last) {
    const ids = S.log[d], its = ids.map(itemById).filter(Boolean);
    const picks = its.filter(i => groupOf(i)?.type === 'pick');
    const checks = S.groups.filter(g => g.type === 'check').map(g => { const all = S.items.filter(i => i.g === g.id); const n = all.filter(i => ids.includes(i.id)).length; return all.length ? `${g.name} ${n}/${all.length}` : ''; }).filter(Boolean);
    const dt = new Date(d + 'T12:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    h += `<div class="day"><h3>${esc(dt)}<span>${ids.length} done</span></h3><p>${picks.map(i => esc(i.name)).join(' · ') || '<span class="hint">No meals or clothes picked</span>'}</p><small>${esc(checks.join(' · '))}</small></div>`;
  }
  return h + foot();
}

// ---------- Add / edit sheet ----------
function sheet(html, onMount) {
  const m = document.createElement('div'); m.className = 'modal'; m.innerHTML = `<div role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(m);
  const close = () => m.remove();
  m.addEventListener('click', e => { if (e.target === m || e.target.closest('.close')) close(); });
  onMount(m.firstChild, close);
  setTimeout(() => m.querySelector('input')?.focus(), 30);
}
const wheres = () => [...new Set(['Publix', 'Home', 'Online', ...S.steps.map(s => s.where).filter(Boolean)])];

function editItem(itemId, groupId) {
  const it = itemId ? itemById(itemId) : null;
  let gsel = it ? it.g : (groupId || S.groups.find(g => g.cat === 'Meals')?.id || S.groups[0]?.id);
  let newG = false, ncat = 'Meals', ntype = 'pick';
  const rows = it ? S.steps.filter(s => s.item === it.id).map(s => ({ ...s })) : [];
  const dl = `<datalist id="wh">${wheres().map(w => `<option value="${esc(w)}">`).join('')}</datalist>`;
  sheet(`<div class="sh-h"><h2>${it ? 'Edit' : 'Add something new'}</h2><button class="close" aria-label="Close">×</button></div>
    <label class="lab" for="nm">Name</label><input class="inp" id="nm" value="${esc(it?.name || '')}" placeholder="e.g. Greek yogurt bowl" autocomplete="off">
    <span class="lab">Goes in</span><div class="chips" id="gs"></div>
    <div id="ng" hidden>
      <label class="lab" for="gn">New group name</label><input class="inp" id="gn" placeholder="e.g. Dinner, Shaving, Jacket">
      <span class="lab">Section</span><div class="chips" id="cs"></div>
      <span class="lab">Each day</span><div class="chips" id="ts"></div>
    </div>
    <span class="lab">Steps to keep it stocked</span><div id="sr"></div>
    <button class="btn sm" id="addR">+ Step</button>${dl}
    <div class="sh-foot">${it ? '<button class="btn ghost danger" id="del">Remove</button>' : ''}<button class="btn go" id="ok">${it ? 'Save' : 'Add'}</button></div>`, (el, close) => {
    const drawG = () => {
      el.querySelector('#gs').innerHTML = S.groups.map(g => `<button class="chip${!newG && g.id === gsel ? ' on' : ''}" data-g="${g.id}">${esc(g.name)}</button>`).join('') + `<button class="chip${newG ? ' on' : ''}" data-g="new">+ New group</button>`;
      el.querySelector('#ng').hidden = !newG;
      el.querySelector('#cs').innerHTML = CATS.map(c => `<button class="chip${c === ncat ? ' on' : ''}" data-c="${esc(c)}">${esc(c)}</button>`).join('');
      el.querySelector('#ts').innerHTML = `<button class="chip${ntype === 'pick' ? ' on' : ''}" data-t="pick">Pick one</button><button class="chip${ntype === 'check' ? ' on' : ''}" data-t="check">Do all</button>`;
    };
    const drawR = () => {
      el.querySelector('#sr').innerHTML = rows.map((r, k) => `<div class="srow"><input class="inp w" list="wh" data-k="${k}" data-f="where" value="${esc(r.where)}" placeholder="Where"><input class="inp" data-k="${k}" data-f="text" value="${esc(r.text)}" placeholder="e.g. 3 lb deli turkey"><button class="st-x" data-rm="${k}" aria-label="Remove step">×</button></div>`).join('');
    };
    drawG(); drawR();
    el.addEventListener('input', e => { const k = e.target.dataset.k; if (k != null) rows[k][e.target.dataset.f] = e.target.value; });
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.g) { newG = b.dataset.g === 'new'; if (!newG) gsel = b.dataset.g; drawG(); }
      else if (b.dataset.c) { ncat = b.dataset.c; drawG(); }
      else if (b.dataset.t) { ntype = b.dataset.t; drawG(); }
      else if (b.dataset.rm != null) { rows.splice(+b.dataset.rm, 1); drawR(); }
      else if (b.id === 'addR') { rows.push({ id: uid(), where: rows.at(-1)?.where || 'Publix', text: '', done: false }); drawR(); el.querySelectorAll('[data-f="text"]').item(rows.length - 1)?.focus(); }
      else if (b.id === 'del') {
        const snap = JSON.stringify(S); S.items = S.items.filter(i => i !== it); S.steps = S.steps.filter(s => s.item !== it.id);
        S.groups = S.groups.filter(g => S.items.some(i => i.g === g.id));
        save(); close(); render(); toast(`Removed ${it.name}`, () => { S = JSON.parse(snap); save(); render(); });
      } else if (b.id === 'ok') {
        const name = el.querySelector('#nm').value.trim(); if (!name) { el.querySelector('#nm').focus(); return; }
        let g = gsel;
        if (newG) { const gn = el.querySelector('#gn').value.trim(); if (!gn) { el.querySelector('#gn').focus(); return; } const ng = { id: uid(), cat: ncat, name: gn, type: ntype }; S.groups.push(ng); g = ng.id; }
        let target = it;
        if (target) { target.name = name; target.g = g; } else { target = { id: uid(), g, name, votes: 0 }; S.items.push(target); }
        const keep = rows.filter(r => r.text.trim()).map(r => ({ id: r.id || uid(), item: target.id, where: r.where.trim(), text: r.text.trim(), done: !!r.done, doneAt: r.doneAt || 0 }));
        S.steps = S.steps.filter(s => s.item !== target.id).concat(keep);
        save(); close(); render(); toast(it ? 'Saved' : `Added ${name}`);
      }
    });
  });
}
function addStep() {
  const dl = `<datalist id="wh">${wheres().map(w => `<option value="${esc(w)}">`).join('')}</datalist>`;
  const its = [...S.items].sort((a, b) => a.name.localeCompare(b.name));
  sheet(`<div class="sh-h"><h2>Add a step</h2><button class="close" aria-label="Close">×</button></div>
    <label class="lab" for="tx">Step</label><input class="inp" id="tx" placeholder="e.g. 3 lb deli turkey">
    <label class="lab" for="wh2">Where</label><input class="inp" id="wh2" list="wh" value="Publix">${dl}
    <label class="lab" for="for">For</label><select class="inp" id="for"><option value="">Nothing in particular</option>${its.map(i => `<option value="${i.id}">${esc(i.name)}</option>`).join('')}</select>
    <div class="sh-foot"><button class="btn go" id="ok">Add step</button></div>`, (el, close) => {
    el.querySelector('#ok').onclick = () => {
      const text = el.querySelector('#tx').value.trim(); if (!text) return el.querySelector('#tx').focus();
      S.steps.push({ id: uid(), item: el.querySelector('#for').value || null, where: el.querySelector('#wh2').value.trim(), text, done: false });
      save(); close(); render(); toast('Step added');
    };
  });
}
function about() {
  sheet(`<div class="sh-h"><h2>How ranking works</h2><button class="close" aria-label="Close">×</button></div>
    <p>Every day you check something off counts as one vote. Tap ▲ in Capsules to add an extra vote for a favorite.</p>
    <p>The top item in each pick-one group gets a ★ and is what <b>Use my usual</b> picks. Today's taps count from tomorrow, so the list doesn't jump around while you get ready.</p>
    <p>Steps belong to an item. When they're all done, the item shows as stocked. When it runs low, tap <b>Need again</b> and its steps come back.</p>
    <p class="hint">Everything is saved on this device only. Save a backup file from the menu now and then.</p>`, () => {});
}

// ---------- Shell ----------
const foot = () => `<p class="foot">© 2026 Daniel Houlis. Frequent™ is a trademark of Daniel Houlis. <a href="../">More Frequent apps</a></p>`;
function render() {
  $('#main').innerHTML = { today: renderToday, steps: renderSteps, capsules: renderCapsules, history: renderHistory }[tab]();
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  updateTop();
}
function go(t) { tab = t; render(); window.scrollTo(0, 0); }
let tt;
function toast(msg, undo) {
  $('#toastT').textContent = msg; const u = $('#toastU'); u.hidden = !undo; u.onclick = () => { undo(); $('#toast').classList.remove('on'); };
  $('#toast').classList.add('on'); clearTimeout(tt); tt = setTimeout(() => $('#toast').classList.remove('on'), undo ? 4500 : 2200);
}
document.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.closest('.modal')) return;
  const d = b.dataset;
  if (d.tab) go(d.tab);
  else if (d.go) go(d.go);
  else if (d.tap) tap(d.tap);
  else if (d.step) toggleStep(d.step);
  else if (d.again) needAgain(d.again);
  else if (d.vote) vote(d.vote, b);
  else if (d.edit) editItem(d.edit);
  else if (d.add != null) editItem(null, d.add || null);
  else if (b.id === 'usual') useUsual();
  else if (b.id === 'addStep') addStep();
  else if (b.id === 'mo') go('today');
});
$('#menuB').onclick = e => { e.stopPropagation(); $('#menu').hidden = !$('#menu').hidden; };
document.addEventListener('click', e => { if (!e.target.closest('#menu') && e.target.id !== 'menuB') $('#menu').hidden = true; }, true);
$('#menu').addEventListener('click', e => {
  const a = e.target.closest('button')?.dataset.act; if (!a) return; $('#menu').hidden = true;
  if (a === 'add') editItem(null);
  if (a === 'about') about();
  if (a === 'backup') { const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' }); const l = document.createElement('a'); l.href = URL.createObjectURL(blob); l.download = `frequent-routine-${dayKey()}.json`; l.click(); setTimeout(() => URL.revokeObjectURL(l.href), 2000); }
});
$('#restore').onchange = e => {
  const f = e.target.files[0]; if (!f) return; $('#menu').hidden = true;
  f.text().then(t => { const d = JSON.parse(t); if (!d.groups || !d.items) throw 0; const snap = JSON.stringify(S); S = { steps: [], log: {}, ...d }; save(); render(); toast('Restored', () => { S = JSON.parse(snap); save(); render(); }); }).catch(() => toast("That file isn't a Routine backup"));
  e.target.value = '';
};
document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
render();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
