// Frequent Αραβικά: Levantine Arabic for Greek speakers. One file, no build step, works offline.
// Progress lives in localStorage under one key and is never cleared by an update.
(() => {
  const D = window.FQ_DATA, KEY = 'fq-ar-el';
  const $ = (s, el = document) => el.querySelector(s);
  const h = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === false || v === null || v === undefined) continue;
      if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (k === 'html') e.innerHTML = v; else e.setAttribute(k, v === true ? '' : v);
    }
    for (const k of kids.flat()) if (k !== null && k !== undefined && k !== false) e.append(k.nodeType ? k : document.createTextNode(k));
    return e;
  };
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

  // ---------- Saved progress ----------
  const load = () => { try { const s = JSON.parse(localStorage.getItem(KEY) || '{}'); return s && typeof s === 'object' ? s : {}; } catch (e) { return {}; } };
  let S = load();
  S.c = S.c || {}; S.seen = S.seen || {}; S.days = S.days || {};
  if (S.voice === undefined) S.voice = true; if (S.script === undefined) S.script = true;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  const color = id => S.c[id] || 'n';
  const setColor = (id, c) => { if (c === 'n') delete S.c[id]; else S.c[id] = c; S.seen[id] = S.seen[id] || today(); S.days[today()] = (S.days[today()] || 0) + 1; save(); };

  // ---------- Items ----------
  const ITEMS = [];
  D.scenes.forEach((sc, si) => {
    sc.ph.forEach((p, i) => ITEMS.push({ id: `${sc.id}:p${i}`, kind: 'p', sc, si, ar: p[0], gr: p[1], el: p[2], note: p[3] || '' }));
    sc.w.forEach((w, i) => ITEMS.push({ id: `${sc.id}:w${i}`, kind: 'w', sc, si, ar: w[0], gr: w[1], el: w[2], note: /^(θηλυκό|προς)/.test(w[3] || '') ? w[3] : '', cousin: w[3] && !/^(θηλυκό|προς)/.test(w[3]) ? w[3] : '' }));
  });
  const byId = Object.fromEntries(ITEMS.map(x => [x.id, x]));
  const fold = t => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ς/g, 'σ').replace(/[ʕ'’]/g, '');

  // ---------- Voice ----------
  let arVoice = null;
  const pickVoice = () => { try { const vs = speechSynthesis.getVoices() || []; arVoice = vs.find(v => /^ar[-_](LB|SY|JO|PS)/i.test(v.lang)) || vs.find(v => /^ar/i.test(v.lang)) || null; } catch (e) {} };
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  const hasVoice = () => !!arVoice;
  let warned = false;
  const speak = (text, auto) => {
    if (!S.voice || !('speechSynthesis' in window)) return;
    if (!arVoice) { pickVoice(); if (!arVoice) { if (!auto && !warned) { warned = true; toast('Αυτή η συσκευή δεν έχει αραβική φωνή. Δες: Μενού, Φωνή.'); } return; } }
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(String(text).replace(/\.\.\./g, '،')); u.lang = arVoice.lang; u.voice = arVoice; u.rate = 0.85; speechSynthesis.speak(u); } catch (e) {}
  };
  const sayBtn = text => h('button', { class: 'say', 'aria-label': 'Άκουσέ το', onclick: e => { e.stopPropagation(); speak(text); } }, h('span', { html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a4.5 4.5 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' }));

  let tt; const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2600); };

  // ---------- Cards ----------
  const COLOR_NAMES = { r: 'Δεν το έχω', y: 'Κάπως', g: 'Το έχω' };
  const card = it => {
    const c = color(it.id), el = h('div', { class: `ph c-${c}` });
    el.append(...[
      h('div', { class: 'ph-ar', lang: 'ar', dir: 'rtl' }, it.ar),
      h('div', { class: 'ph-gr', onclick: () => speak(it.ar) }, it.gr),
      h('div', { class: 'ph-el' }, it.el),
      it.note ? h('div', { class: 'ph-note' }, it.note) : null,
      it.cousin ? h('span', { class: 'ph-cousin' }, 'συγγενής: ' + it.cousin) : null
    ].filter(Boolean));
    const dots = h('div', { class: 'dots', role: 'group', 'aria-label': 'Πόσο το έχεις;' });
    for (const k of ['r', 'y', 'g']) dots.append(h('button', { class: `dot ${k}`, 'aria-label': COLOR_NAMES[k], title: COLOR_NAMES[k], 'aria-pressed': String(c === k), onclick: () => { const now = color(it.id) === k ? 'n' : k; setColor(it.id, now); el.replaceWith(card(it)); } }));
    el.append(h('div', { class: 'ph-bar' }, sayBtn(it.ar), c === 'n' ? h('span', { class: 'new-tag' }, 'ΝΕΟ') : h('span'), dots));
    return el;
  };
  const tally = list => { const n = { r: 0, y: 0, g: 0, n: 0 }; for (const it of list) n[color(it.id)]++; return n; };
  const meter = list => { const n = tally(list), t = list.length || 1; return h('div', { class: 'scene-meter', 'aria-hidden': 'true' }, h('i', { class: 'm-g', style: `width:${100 * n.g / t}%` }), h('i', { class: 'm-y', style: `width:${100 * n.y / t}%` }), h('i', { class: 'm-r', style: `width:${100 * n.r / t}%` })); };
  const sceneItems = sc => ITEMS.filter(x => x.sc === sc);

  // ---------- Views ----------
  const V = $('#view');
  const show = (tab, ...kids) => {
    document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    V.replaceChildren(...kids); V.classList.toggle('hide-ar', !S.script); window.scrollTo(0, 0);
  };

  function viewToday() {
    const next = D.scenes.find(sc => sceneItems(sc).some(x => color(x.id) !== 'g')) || D.scenes[0];
    const all = tally(ITEMS), first = !Object.keys(S.c).length;
    const kids = [h('h1', {}, 'Σήμερα'), h('p', { class: 'lede' }, 'Αραβικά του Λεβάντε, όπως μιλιούνται στη Βηρυτό και τη Δαμασκό. Κάθε φράση γράφεται και με ελληνικά γράμματα.')];
    if (first) kids.push(h('div', { class: 'card' }, h('h3', {}, 'Πρώτη φορά εδώ;'), h('p', { class: 'hint' }, 'Τα ελληνικά έχουν ήδη το χ, το γ, το θ και το δ, που δυσκολεύουν άλλους. Λίγα σημάδια δείχνουν τους ήχους που λείπουν. Μια ματιά πριν ξεκινήσεις:'), h('button', { class: 'btn', onclick: guide }, 'Πώς διαβάζεται')));
    kids.push(h('div', { class: 'card' }, h('h3', {}, 'Συνέχισε: ' + next.t), h('p', { class: 'hint' }, next.intro), meter(sceneItems(next)), h('div', { class: 'row', style: 'margin-top:12px' }, h('button', { class: 'btn cta', onclick: () => viewScene(next) }, 'Άνοιξε τη σκηνή'))));
    kids.push(h('div', { class: 'card' }, h('h3', {}, 'Πέντε για σήμερα'), h('p', { class: 'hint' }, 'Πρώτα όσα είναι κόκκινα και κίτρινα, μετά καινούργια. Δες τα αραβικά, θυμήσου τι σημαίνει, και μετά δες αν το είχες.'), h('button', { class: 'btn cta', onclick: review }, 'Ξεκίνα')));
    kids.push(h('div', { class: 'card' }, h('h3', {}, 'Πόσα έχεις'),
      h('div', { class: 'tally' }, h('span', {}, h('b', { style: 'background:var(--green)' }), `${all.g} το έχω`), h('span', {}, h('b', { style: 'background:var(--yellow)' }), `${all.y} κάπως`), h('span', {}, h('b', { style: 'background:var(--red)' }), `${all.r} όχι ακόμα`), h('span', {}, h('b', { style: 'background:var(--new)' }), `${all.n} νέα`)),
      h('div', { class: 'row', style: 'margin-top:12px' }, h('button', { class: 'btn', onclick: () => viewGame() }, 'Παίξε'))));
    kids.push(foot());
    show('today', ...kids);
  }

  function viewScenes() {
    const list = D.scenes.map((sc, i) => { const its = sceneItems(sc); return h('button', { class: 'scene', onclick: () => viewScene(sc) }, h('span', { class: 'scene-n' }, String(i + 1)), h('span', { style: 'flex:1' }, h('div', { class: 'scene-t' }, sc.t), h('div', { class: 'hint' }, `${sc.ph.length} φράσεις · ${sc.w.length} λέξεις`), meter(its))); });
    show('scenes', h('h1', {}, 'Σκηνές'), h('p', { class: 'lede' }, 'Αληθινές στιγμές: το καφέ, το ταξί, το τραπέζι. Οι λέξεις έρχονται μέσα από τις φράσεις.'), ...list, foot());
  }

  function viewScene(sc) {
    const its = sceneItems(sc), ph = its.filter(x => x.kind === 'p'), ws = its.filter(x => x.kind === 'w');
    show('scenes', h('button', { class: 'back', onclick: viewScenes }, '‹ Σκηνές'), h('h1', {}, sc.t), h('p', { class: 'lede' }, sc.intro),
      ...ph.map(card), h('h2', {}, 'Οι λέξεις της σκηνής'), ...ws.map(card),
      h('div', { class: 'row', style: 'margin-top:16px' }, h('button', { class: 'btn cta', onclick: () => viewGame(sc) }, 'Παίξε με αυτή τη σκηνή')), foot());
  }

  let wFilter = 'all', wQuery = '';
  function viewWords() {
    const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Φίλτρο' });
    const listEl = h('div');
    const draw = () => {
      const q = fold(wQuery);
      const list = ITEMS.filter(x => x.kind === 'w').filter(x => wFilter === 'all' || color(x.id) === wFilter || (wFilter === 'cousin' && x.cousin)).filter(x => !q || fold(x.gr + ' ' + x.el + ' ' + (x.cousin || '')).includes(q) || x.ar.includes(wQuery.trim()));
      listEl.replaceChildren(...(list.length ? list.map(card) : [h('p', { class: 'hint' }, 'Καμία λέξη εδώ ακόμα.')]));
    };
    for (const [k, t] of [['all', 'Όλες'], ['n', 'Νέες'], ['r', 'Κόκκινες'], ['y', 'Κίτρινες'], ['g', 'Πράσινες'], ['cousin', 'Τις ξέρεις ήδη']]) chips.append(h('button', { class: 'chip' + (wFilter === k ? ' on' : ''), 'aria-pressed': String(wFilter === k), onclick: e => { wFilter = k; chips.querySelectorAll('.chip').forEach(c => { c.classList.remove('on'); c.setAttribute('aria-pressed', 'false'); }); e.currentTarget.classList.add('on'); e.currentTarget.setAttribute('aria-pressed', 'true'); draw(); } }, t));
    const search = h('input', { class: 'search', type: 'search', placeholder: 'Ψάξε: νερό, μάι, ماء', value: wQuery, 'aria-label': 'Αναζήτηση', oninput: e => { wQuery = e.target.value; draw(); } });
    draw();
    show('words', h('h1', {}, 'Λέξεις'), h('p', { class: 'lede' }, `${ITEMS.filter(x => x.kind === 'w').length} λέξεις από τις σκηνές. Κόκκινο: δεν το έχω. Κίτρινο: κάπως. Πράσινο: το έχω. Μαύρο: νέο.`), search, chips, listEl, foot());
  }

  // ---------- Five for today (self check) ----------
  function review() {
    const order = { r: 0, y: 1, n: 2, g: 3 };
    const pool = ITEMS.filter(x => color(x.id) !== 'g').sort((a, b) => order[color(a.id)] - order[color(b.id)] || a.si - b.si);
    const list = pool.slice(0, 5); if (!list.length) { toast('Όλα πράσινα. Μπράβο.'); return; }
    let i = 0;
    const step = () => {
      if (i >= list.length) { show('today', h('h1', {}, 'Έτοιμο'), h('p', { class: 'lede' }, 'Πέντε για σήμερα. Τα κόκκινα θα ξανάρθουν πρώτα την επόμενη φορά.'), h('button', { class: 'btn cta wide', onclick: viewToday }, 'Πίσω στο Σήμερα')); return; }
      const it = list[i], box = h('div', { class: 'card' });
      const reveal = h('div', { hidden: true }, h('div', { class: 'rv-el' }, it.el), it.note ? h('div', { class: 'ph-note', style: 'text-align:center' }, it.note) : null,
        h('div', { class: 'pick3' }, ...['r', 'y', 'g'].map(k => h('button', { class: k, onclick: () => { setColor(it.id, k); i++; step(); } }, COLOR_NAMES[k]))));
      const showBtn = h('button', { class: 'btn cta wide', style: 'margin-top:14px', onclick: () => { reveal.hidden = false; showBtn.remove(); } }, 'Δείξε τι σημαίνει');
      box.append(h('div', { class: 'rv-step' }, `${i + 1} από ${list.length} · ${it.sc.t}`), h('div', { class: 'rv-ar', lang: 'ar', dir: 'rtl' }, it.ar), h('div', { class: 'rv-gr', onclick: () => speak(it.ar) }, it.gr), h('div', { class: 'row', style: 'justify-content:center;margin-top:8px' }, sayBtn(it.ar)), showBtn, reveal);
      show('today', h('button', { class: 'back', onclick: viewToday }, '‹ Σήμερα'), h('h1', {}, 'Πέντε για σήμερα'), box);
      speak(it.ar, true);
    };
    step();
  }

  // ---------- Game: 10 rounds, pick the meaning or pick the Arabic ----------
  function viewGame(sc) {
    const pool = sc ? sceneItems(sc) : ITEMS.filter(x => color(x.id) !== 'n');
    const setup = [h('h1', {}, 'Παιχνίδι'), h('p', { class: 'lede' }, 'Δέκα γύροι. Άκου ή διάβασε, και διάλεξε. Σωστό με την πρώτη: η φράση ανεβαίνει ένα χρώμα. Λάθος: γίνεται κόκκινη, για να ξανάρθει.')];
    const start = list => playGame(list.length >= 4 ? list : ITEMS.filter(x => x.si <= 1), sc);
    if (sc) { start(pool); return; }
    setup.push(h('div', { class: 'card' }, h('h3', {}, 'Όσα έχεις δει'), h('p', { class: 'hint' }, pool.length >= 4 ? `${pool.length} φράσεις και λέξεις που έχεις σημειώσει.` : 'Σημείωσε πρώτα λίγες φράσεις με χρώμα. Μέχρι τότε παίζεις με τις δύο πρώτες σκηνές.'), h('button', { class: 'btn cta', onclick: () => start(pool) }, 'Παίξε')));
    setup.push(h('h2', {}, 'Ή διάλεξε σκηνή'), ...D.scenes.map((s, i) => h('button', { class: 'scene', onclick: () => playGame(sceneItems(s), s) }, h('span', { class: 'scene-n' }, String(i + 1)), h('span', { style: 'flex:1' }, h('div', { class: 'scene-t' }, s.t), meter(sceneItems(s))))));
    show('game', ...setup, foot());
  }
  function playGame(pool, sc) {
    const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const rounds = shuffle(pool).slice(0, 10); while (rounds.length < 10 && pool.length) rounds.push(pool[rounds.length % pool.length]);
    let r = 0, score = 0; const marks = [], missed = [];
    const step = () => {
      if (r >= rounds.length) return end();
      const it = rounds[r], mode = r % 2;   // 0: see Arabic, pick the meaning. 1: see the meaning, pick the Arabic.
      const others = shuffle(ITEMS.filter(x => x.kind === it.kind && x.id !== it.id && x.el !== it.el && (x.sc === it.sc || Math.random() < .4))).slice(0, 2);
      const opts = shuffle([it, ...others]); let tries = 0;
      const box = h('div', { class: 'card' });
      const prog = h('div', { class: 'progress', 'aria-label': `Γύρος ${r + 1} από 10` }, ...rounds.map((_, k) => h('i', { class: k < r ? (marks[k] ? 'done' : 'miss') : '' })));
      if (mode === 0) box.append(h('div', { class: 'q-ar', lang: 'ar', dir: 'rtl' }, it.ar), h('div', { class: 'q-gr' }, it.gr), h('div', { class: 'row', style: 'justify-content:center;margin-top:6px' }, sayBtn(it.ar)), h('p', { class: 'hint', style: 'text-align:center' }, 'Τι σημαίνει;'));
      else box.append(h('p', { class: 'hint', style: 'text-align:center' }, 'Πώς το λες;'), h('div', { class: 'q-el' }, it.el));
      const grid = h('div', { class: 'opts' });
      for (const o of opts) {
        const b = h('button', { class: 'opt', onclick: () => {
          if (b.disabled) return; tries++;
          if (o === it) {
            b.classList.add('right'); grid.querySelectorAll('.opt').forEach(x => x.disabled = true);
            const first = tries === 1; marks[r] = first; if (first) { score++; const c = color(it.id); setColor(it.id, c === 'n' || c === 'r' ? 'y' : 'g'); } else { setColor(it.id, 'r'); missed.push(it); }
            speak(it.ar, true); setTimeout(() => { r++; step(); }, 1100);
          } else { b.classList.add('wrong'); b.disabled = true; }
        } }, mode === 0 ? o.el : [h('span', { class: 'o-ar', lang: 'ar', dir: 'rtl' }, o.ar), o.gr]);
        grid.append(b);
      }
      box.append(grid);
      show('game', h('button', { class: 'back', onclick: () => viewGame() }, '‹ Παιχνίδι'), h('h1', {}, sc ? sc.t : 'Όσα έχεις δει'), prog, box);
      if (mode === 0) speak(it.ar, true);
    };
    const end = () => {
      const kids = [h('h1', {}, 'Τέλος'), h('div', { class: 'big-score' }, `${score} / ${rounds.length}`), h('p', { class: 'lede', style: 'text-align:center' }, score >= 8 ? 'Μπράβο. Αυτά τα έχεις.' : 'Τα κόκκινα θα έρθουν πρώτα στο «Πέντε για σήμερα».')];
      if (missed.length) kids.push(h('h2', {}, 'Αυτά θέλουν άλλη μια ματιά'), ...missed.map(card));
      kids.push(h('div', { class: 'row', style: 'margin-top:14px' }, h('button', { class: 'btn cta', onclick: () => playGame(pool, sc) }, 'Ξανά'), h('button', { class: 'btn', onclick: viewToday }, 'Σήμερα')));
      show('game', ...kids);
    };
    step();
  }

  // ---------- Sheets: menu, guide, settings, backup ----------
  const sheet = $('#sheet');
  const open = (...kids) => { sheet.replaceChildren(h('div', { class: 'sheet-in', role: 'dialog', 'aria-modal': 'true' }, ...kids, h('button', { class: 'btn wide', style: 'margin-top:14px', onclick: close }, 'Κλείσιμο'))); sheet.hidden = false; const f = sheet.querySelector('button, input'); if (f) f.focus(); };
  const close = () => { sheet.hidden = true; sheet.replaceChildren(); };
  sheet.addEventListener('click', e => { if (e.target === sheet) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) close(); });

  function menu() {
    open(h('h3', {}, 'Μενού'),
      h('button', { class: 'menu-item', onclick: guide }, 'Πώς διαβάζεται (τα σημάδια)'),
      h('button', { class: 'menu-item', onclick: settings }, 'Φωνή και εμφάνιση'),
      h('button', { class: 'menu-item', onclick: backup }, 'Αντίγραφο της προόδου μου'),
      h('button', { class: 'menu-item', onclick: about }, 'Σχετικά'));
  }
  const G = [
    ['μπ', 'ب', 'Πάντα «b», όπως στο «μπάλα». Και στη μέση της λέξης.', 'μπάντι · θέλω'],
    ['ντ', 'د', 'Πάντα «d», όπως στο «ντομάτα».', 'ντούγρι · ευθεία'],
    ['γ', 'غ', 'Όπως το ελληνικό γ στο «γάλα». Εδώ έχεις πλεονέκτημα.', 'γάλι · ακριβό'],
    ['χ', 'خ', 'Όπως το ελληνικό χ στο «χαρά».', 'χίμπζ · ψωμί'],
    ['χ̣', 'ح', 'Ένα χ χωρίς ξύσιμο: βαθιά, καθαρή ανάσα από τον λαιμό, σαν να θαμπώνεις τα γυαλιά σου.', 'μάρχ̣αμπα · γεια'],
    ['h', 'ه', 'Απλή ανάσα, όπως το αγγλικό h στο «hello».', 'hον · εδώ'],
    ['ʕ', 'ع', 'Σφίξε λίγο τον λαιμό, σαν να σηκώνεις κάτι βαρύ, και πες το φωνήεν. Ο πιο αραβικός ήχος.', 'ʕάραμπι · αραβικά'],
    ['\'', 'ء ق', 'Μικρή στάση της φωνής, όπως στο «α-α!». Στην πόλη το ق λέγεται έτσι.', '\'άhουε · καφές'],
    ['σ̌', 'ش', 'Το «sh» του αγγλικού «shop». Σφύριγμα με στρογγυλά χείλη.', 'σ̌ούκραν · ευχαριστώ'],
    ['ζ̌', 'ج', 'Το «j» του γαλλικού «je». Στον Λίβανο και τη Συρία λέγεται έτσι.', 'ζ̌ουʕάν · πεινάω'],
    ['σ̣ τ̣ ντ̣ ζ̣', 'ص ط ض ظ', 'Τελεία από κάτω: «βαρύ» σύμφωνο. Η γλώσσα πάει πίσω, το στόμα στρογγυλεύει, και το διπλανό α ακούγεται σαν ο.', 'σ̣αμπάχ̣ · πρωί'],
    ['ου', 'و', 'Πριν από φωνήεν είναι «w»: ουέιν = wēn (πού).', 'ουάχ̣ιντ · ένας'],
    ['γι', 'ي', 'Πριν από φωνήεν είναι «y»: γιάλλα = yalla.', 'γιαμίν · δεξιά'],
    ['λλ σσ', '', 'Διπλό γράμμα: κράτα τον ήχο λίγο περισσότερο. Στα αραβικά αλλάζει τη λέξη.', 'σούκκαρ · ζάχαρη'],
    ['ά', '', 'Ο τόνος μπαίνει όπως στα ελληνικά, στη συλλαβή που τονίζεται.', 'σ̌ούκραν']
  ];
  function guide() {
    const t = h('table', { class: 'guide' }, ...G.map(([g, a, d, ex]) => h('tr', {}, h('td', {}, g), h('td', { lang: 'ar' }, a), h('td', {}, d, h('div', { class: 'ex' }, ex)))));
    open(h('h3', {}, 'Πώς διαβάζεται'), h('p', { class: 'hint' }, 'Ό,τι δεν έχει σημάδι διαβάζεται όπως στα ελληνικά. Γράφουμε ό,τι λέει ο κόσμος στον δρόμο: το θ και το δ των βιβλίων στην ομιλία γίνονται συνήθως τ, σ, ντ ή ζ.'), t,
      h('p', { class: 'hint', style: 'margin-top:12px' }, 'Η φωνή του κινητού μιλάει πιο επίσημα αραβικά από τον δρόμο. Για την προφορά του Λεβάντε, εμπιστέψου πρώτα τα ελληνικά γράμματα.'));
  }
  function settings() {
    const tg = (label, key, after) => h('label', { class: 'toggle' }, h('span', {}, label), h('input', { type: 'checkbox', checked: S[key] ? true : null, onchange: e => { S[key] = e.target.checked; save(); if (after) after(); } }));
    open(h('h3', {}, 'Φωνή και εμφάνιση'),
      tg('Φωνή (αραβική φωνή του κινητού)', 'voice'),
      tg('Δείξε και την αραβική γραφή', 'script', () => V.classList.toggle('hide-ar', !S.script)),
      h('p', { class: 'hint' }, hasVoice() ? `Φωνή: ${arVoice.name} (${arVoice.lang}).` : 'Αυτή η συσκευή δεν έχει ακόμα αραβική φωνή. Σε Android: Ρυθμίσεις, Γλώσσα, Μετατροπή κειμένου σε ομιλία, Υπηρεσία Google, Εγκατάσταση φωνητικών δεδομένων, Αραβικά. Μετά άνοιξε ξανά την εφαρμογή.'),
      h('button', { class: 'btn', onclick: () => speak('مرحبا، كيفك؟') }, 'Δοκίμασε τη φωνή'));
  }
  function backup() {
    const ta = h('textarea', { 'aria-label': 'Η πρόοδός σου ως κείμενο' }); ta.value = JSON.stringify({ app: KEY, saved: today(), c: S.c, seen: S.seen, days: S.days });
    const file = () => { const a = h('a', { href: URL.createObjectURL(new Blob([ta.value], { type: 'application/json' })), download: `frequent-arabika-${today()}.json` }); document.body.append(a); a.click(); a.remove(); };
    const restore = () => { try { const x = JSON.parse(ta.value); if (!x || x.app !== KEY || typeof x.c !== 'object') throw 0; for (const [k, v] of Object.entries(x.c)) if (byId[k] && ['r', 'y', 'g'].includes(v)) S.c[k] = v; Object.assign(S.seen, x.seen || {}); for (const [d, n] of Object.entries(x.days || {})) S.days[d] = Math.max(S.days[d] || 0, +n || 0); save(); close(); toast('Η πρόοδος επανήλθε.'); viewToday(); } catch (e) { toast('Αυτό το κείμενο δεν είναι αντίγραφο της εφαρμογής.'); } };
    open(h('h3', {}, 'Αντίγραφο της προόδου μου'), h('p', { class: 'hint' }, 'Η πρόοδος μένει σε αυτή τη συσκευή και δεν σβήνεται με τις ενημερώσεις. Για άλλη συσκευή: αποθήκευσε το αρχείο ή αντίγραψε το κείμενο, και επικόλλησέ το εκεί. Η επαναφορά προσθέτει, δεν σβήνει.'), ta,
      h('div', { class: 'row', style: 'margin-top:10px' }, h('button', { class: 'btn cta', onclick: file }, 'Αποθήκευση αρχείου'), h('button', { class: 'btn', onclick: restore }, 'Επαναφορά από το κείμενο')));
  }
  function about() {
    open(h('h3', {}, 'Σχετικά'), h('p', {}, 'Frequent Αραβικά: αραβικά του Λεβάντε (Λίβανος και Συρία, ομιλία της πόλης) για όσους μιλούν ελληνικά. Οι φράσεις ξεκινούν από αληθινές στιγμές, όχι από λίστες.'),
      h('p', { class: 'hint' }, `Έκδοση ${D.version}. ${D.scenes.length} σκηνές, ${ITEMS.filter(x => x.kind === 'p').length} φράσεις, ${ITEMS.filter(x => x.kind === 'w').length} λέξεις.`),
      h('p', { class: 'hint' }, '© 2026 Daniel Ilias Houlis. All rights reserved. Greekquent™ and Frequent™ are trademarks of Daniel Ilias Houlis.'));
  }
  const foot = () => h('p', { class: 'foot' }, '© 2026 Daniel Ilias Houlis. Frequent™. ', h('span', { lang: 'ar' }, 'منشوفك بعدين'), ' · τα λέμε.');

  // ---------- Wiring ----------
  const TABS = { today: viewToday, scenes: viewScenes, words: viewWords, game: () => viewGame() };
  document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => TABS[b.dataset.tab]()));
  $('#home').addEventListener('click', viewToday);
  $('#menuBtn').addEventListener('click', menu);
  window.addEventListener('storage', e => { if (e.key === KEY) { S = load(); S.c = S.c || {}; S.seen = S.seen || {}; S.days = S.days || {}; } });
  viewToday();
  // Updates arrive quietly: the worker fetches the new files in the background, and the next opening uses them.
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  window.FQ = { S, ITEMS, viewScene, viewGame, viewWords, guide, settings, backup };
})();
