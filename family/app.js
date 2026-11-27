import { readTreeFile, toGedcom } from './gedcom.js';
import { checkAccess, loadShared, saveShared, makeInvite, openInvite } from './sync.js';

const T = {
  en: {
    title: 'Family Tree', search: 'Search for a name', parents: 'Parents', partners: 'Spouse or partner', children: 'Children',
    childrenWith: 'Children with', siblings: 'Brothers and sisters', edit: 'Edit', addRel: 'Add a relative', addParent: 'Parent',
    addPartner: 'Spouse or partner', addChild: 'Child', addSibling: 'Brother or sister', whoAdd: 'Who are you adding?',
    given: 'First and middle names', surname: 'Last name', sex: 'Sex', male: 'Male', female: 'Female', unknown: 'Unknown',
    born: 'Born', died: 'Died', date: 'Date', place: 'Place', occupation: 'Occupation', notes: 'Notes and stories',
    living: 'Still living', save: 'Save', cancel: 'Cancel', close: 'Close', del: 'Delete this person', delSure: 'Tap again to delete',
    home: 'Home', setHome: 'Make this the starting person', isHome: 'Starting person', saving: 'Saving…', savedAll: 'Saved for the whole family',
    savedHere: 'Saved on this device', yourName: 'Your name', yourNameWhy: 'So the family can see who made each change.',
    passcode: 'Family passcode', open: 'Open the tree', wrongPass: 'That passcode did not work. Try again.',
    joinLead: 'You have been invited to the family tree. Type the passcode you were given.',
    emptyLead: 'Open the family tree file you downloaded from Ancestry. The .zip file works as it is.',
    emptyHow: 'On Ancestry: Trees → your tree → More (three dots) → Tree Settings → Export tree → Download Your GEDCOM File.',
    choose: 'Open Ancestry file', menu: 'Menu', history: 'Recent changes', noHistory: 'No changes yet.', unknownName: 'Unknown name',
    otherParent: 'Other parent', notListed: 'Not listed', noResults: 'No one by that name.', people: 'people',
    exportGed: 'Download for Ancestry (GEDCOM)', exportJson: 'Download a backup', replace: 'Replace with a new Ancestry file',
    replaceSure: 'This replaces the whole tree for everyone. Tap again to choose the file.',
    share: 'Share with family', shareLead: 'Your tree is kept in a private GitHub repository. Family members open an invite link and type the passcode, then everyone sees and edits the same tree.',
    repo: 'Private repository', token: 'GitHub access token', tokenHelp: 'Create a fine-grained token with access to only this repository and Contents set to Read and write.',
    makeLink: 'Connect and make the invite link', inviteLink: 'Invite link', copy: 'Copy link', copied: 'Copied',
    inviteNote: 'Send the link and the passcode in separate messages. Anyone with both can see and edit the tree.',
    sharedWith: 'Shared tree', leave: 'Disconnect this device', leaveSure: 'Tap again to disconnect', offline: 'Could not reach the shared tree. Showing the last copy on this device.',
    errToken: 'GitHub did not accept the access token.', errRepo: 'Could not find that repository with this token.', errReadonly: 'This token can read but not save. Set Contents to Read and write.',
    errNet: 'Could not reach GitHub. Check the connection and try again.', errBusy: 'Several people are saving at once. Try again in a moment.',
    errFile: 'This file could not be read. Use the GEDCOM (.ged) or .zip file from Ancestry.',
    passShort: 'Use a passcode of at least 8 characters.', back: 'Back', marriage: 'Married', ageAbout: 'age',
    edited: 'edited', added: 'added', deleted: 'deleted', imported: 'imported the Ancestry tree', lang: 'Ελληνικά', by: 'by',
  },
  el: {
    title: 'Οικογενειακό Δέντρο', search: 'Αναζήτηση ονόματος', parents: 'Γονείς', partners: 'Σύζυγος ή σύντροφος', children: 'Παιδιά',
    childrenWith: 'Παιδιά με', siblings: 'Αδέλφια', edit: 'Επεξεργασία', addRel: 'Προσθήκη συγγενή', addParent: 'Γονέας',
    addPartner: 'Σύζυγος ή σύντροφος', addChild: 'Παιδί', addSibling: 'Αδελφός ή αδελφή', whoAdd: 'Ποιον προσθέτετε;',
    given: 'Όνομα (και μεσαίο)', surname: 'Επώνυμο', sex: 'Φύλο', male: 'Άνδρας', female: 'Γυναίκα', unknown: 'Άγνωστο',
    born: 'Γέννηση', died: 'Θάνατος', date: 'Ημερομηνία', place: 'Τόπος', occupation: 'Επάγγελμα', notes: 'Σημειώσεις και ιστορίες',
    living: 'Εν ζωή', save: 'Αποθήκευση', cancel: 'Άκυρο', close: 'Κλείσιμο', del: 'Διαγραφή αυτού του προσώπου', delSure: 'Πατήστε ξανά για διαγραφή',
    home: 'Αρχή', setHome: 'Ορισμός ως αρχικό πρόσωπο', isHome: 'Αρχικό πρόσωπο', saving: 'Αποθήκευση…', savedAll: 'Αποθηκεύτηκε για όλη την οικογένεια',
    savedHere: 'Αποθηκεύτηκε σε αυτή τη συσκευή', yourName: 'Το όνομά σας', yourNameWhy: 'Για να βλέπει η οικογένεια ποιος έκανε κάθε αλλαγή.',
    passcode: 'Οικογενειακός κωδικός', open: 'Άνοιγμα δέντρου', wrongPass: 'Ο κωδικός δεν είναι σωστός. Δοκιμάστε ξανά.',
    joinLead: 'Σας προσκάλεσαν στο οικογενειακό δέντρο. Γράψτε τον κωδικό που σας έδωσαν.',
    emptyLead: 'Ανοίξτε το αρχείο του δέντρου που κατεβάσατε από το Ancestry. Το αρχείο .zip λειτουργεί όπως είναι.',
    emptyHow: 'Στο Ancestry: Trees → το δέντρο σας → More (τρεις τελείες) → Tree Settings → Export tree → Download Your GEDCOM File.',
    choose: 'Άνοιγμα αρχείου Ancestry', menu: 'Μενού', history: 'Πρόσφατες αλλαγές', noHistory: 'Καμία αλλαγή ακόμη.', unknownName: 'Άγνωστο όνομα',
    otherParent: 'Άλλος γονέας', notListed: 'Δεν αναφέρεται', noResults: 'Δεν βρέθηκε κανείς με αυτό το όνομα.', people: 'πρόσωπα',
    exportGed: 'Λήψη για το Ancestry (GEDCOM)', exportJson: 'Λήψη αντιγράφου ασφαλείας', replace: 'Αντικατάσταση με νέο αρχείο Ancestry',
    replaceSure: 'Αυτό αντικαθιστά όλο το δέντρο για όλους. Πατήστε ξανά για να επιλέξετε το αρχείο.',
    share: 'Κοινοποίηση στην οικογένεια', shareLead: 'Το δέντρο φυλάσσεται σε ιδιωτικό αποθετήριο GitHub. Οι συγγενείς ανοίγουν τον σύνδεσμο πρόσκλησης και γράφουν τον κωδικό, και όλοι βλέπουν και επεξεργάζονται το ίδιο δέντρο.',
    repo: 'Ιδιωτικό αποθετήριο', token: 'Κλειδί πρόσβασης GitHub', tokenHelp: 'Δημιουργήστε fine-grained token μόνο για αυτό το αποθετήριο, με Contents σε Read and write.',
    makeLink: 'Σύνδεση και δημιουργία συνδέσμου', inviteLink: 'Σύνδεσμος πρόσκλησης', copy: 'Αντιγραφή', copied: 'Αντιγράφηκε',
    inviteNote: 'Στείλτε τον σύνδεσμο και τον κωδικό σε ξεχωριστά μηνύματα. Όποιος έχει και τα δύο μπορεί να δει και να αλλάξει το δέντρο.',
    sharedWith: 'Κοινό δέντρο', leave: 'Αποσύνδεση αυτής της συσκευής', leaveSure: 'Πατήστε ξανά για αποσύνδεση', offline: 'Δεν ήταν δυνατή η σύνδεση. Εμφανίζεται το τελευταίο αντίγραφο αυτής της συσκευής.',
    errToken: 'Το GitHub δεν δέχτηκε το κλειδί πρόσβασης.', errRepo: 'Δεν βρέθηκε το αποθετήριο με αυτό το κλειδί.', errReadonly: 'Το κλειδί διαβάζει αλλά δεν αποθηκεύει. Ορίστε Contents σε Read and write.',
    errNet: 'Δεν ήταν δυνατή η σύνδεση με το GitHub. Ελέγξτε τη σύνδεση και δοκιμάστε ξανά.', errBusy: 'Αποθηκεύουν πολλοί μαζί. Δοκιμάστε ξανά σε λίγο.',
    errFile: 'Το αρχείο δεν διαβάστηκε. Χρησιμοποιήστε το αρχείο GEDCOM (.ged) ή .zip από το Ancestry.',
    passShort: 'Χρησιμοποιήστε κωδικό με τουλάχιστον 8 χαρακτήρες.', back: 'Πίσω', marriage: 'Γάμος', ageAbout: 'ηλικία',
    edited: 'επεξεργάστηκε', added: 'πρόσθεσε', deleted: 'διέγραψε', imported: 'εισήγαγε το δέντρο από το Ancestry', lang: 'English', by: 'από',
  },
};

const store = {
  get(k, d = null) { try { const v = localStorage.getItem('ft.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { if (v == null) localStorage.removeItem('ft.' + k); else localStorage.setItem('ft.' + k, JSON.stringify(v)); } catch {} },
};

let lang = store.get('lang') || ((navigator.language || '').toLowerCase().startsWith('el') ? 'el' : 'en');
let data = store.get('data');
let cfg = store.get('cfg');
let focus = null;
const t = k => T[lang][k] ?? T.en[k] ?? k;
const $ = s => document.querySelector(s);

function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c));
  return el;
}

// ---------- relationships ----------
const fams = () => Object.values(data.families);
const person = id => data.people[id];
const fullName = p => p ? ([p.given, p.surname].filter(Boolean).join(' ') || t('unknownName')) : '';
const year = d => ((d || '').match(/\d{4}/) || [''])[0];
function years(p) {
  const b = year(p.birth.date), d = year(p.death.date);
  if (b && d) return `${b} – ${d}`;
  if (b) return p.living ? `${b} –` : `${b} – ?`;
  if (d) return `? – ${d}`;
  return '';
}
const parentFams = id => fams().filter(f => f.children.includes(id));
const partnerFams = id => fams().filter(f => f.partners.includes(id));
function siblingsOf(id) {
  const s = new Set();
  for (const f of parentFams(id)) for (const c of f.children) if (c !== id) s.add(c);
  return [...s];
}
const byBirth = (a, b) => (year(person(a).birth.date) || '9999').localeCompare(year(person(b).birth.date) || '9999');
const newId = p => p + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
const fold = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ς/g, 'σ');

// ---------- saving ----------
function toast(msg, ms = 2600) {
  const el = $('#toast');
  el.textContent = msg; el.hidden = false;
  clearTimeout(toast.tm);
  if (ms) toast.tm = setTimeout(() => { el.hidden = true; }, ms);
}
function errText(e) {
  return { badtoken: t('errToken'), norepo: t('errRepo'), readonly: t('errReadonly'), busy: t('errBusy') }[e.message] || t('errNet');
}
function logLine(d, msg) {
  d.log = d.log || [];
  d.log.unshift({ at: new Date().toISOString(), by: store.get('name') || '', msg });
  d.log.length = Math.min(d.log.length, 300);
}

async function commit(op, msg) {
  if (cfg && !store.get('name')) {
    const ok = await askName();
    if (!ok) return false;
  }
  const apply = d => { op(d); logLine(d, msg); return d; };
  if (!cfg) {
    data = apply(data); store.set('data', data); render(); toast(t('savedHere'));
    return true;
  }
  toast(t('saving'), 0);
  try {
    data = await saveShared(cfg, apply, `${store.get('name')}: ${msg}`);
    store.set('data', data); render(); toast(t('savedAll'));
    return true;
  } catch (e) { toast(errText(e), 5000); return false; }
}

function askName() {
  return new Promise(resolve => {
    const input = h('input', { id: 'nm', autocomplete: 'name', required: true });
    const dlg = sheet(h('h2', { text: t('yourName') }), h('p', { class: 'muted', text: t('yourNameWhy') }), input,
      h('div', { class: 'row end' },
        h('button', { class: 'btn ghost', type: 'button', onclick: () => { dlg.close(); resolve(false); }, text: t('cancel') }),
        h('button', { class: 'btn', type: 'submit', text: t('save') })),
    );
    dlg.querySelector('form').addEventListener('submit', e => {
      e.preventDefault();
      if (!input.value.trim()) return;
      store.set('name', input.value.trim()); dlg.close(); resolve(true);
    });
    setTimeout(() => input.focus(), 50);
  });
}

// ---------- dialogs ----------
function sheet(...content) {
  const dlg = $('#sheet');
  dlg.replaceChildren(h('form', { method: 'dialog', class: 'sheet-body' }, ...content));
  if (!dlg.open) dlg.showModal();
  return dlg;
}
const field = (label, input) => h('label', { class: 'field' }, h('span', { text: label }), input);

function editPerson(p, onSave, extra) {
  const isNew = !p.id;
  const f = {
    given: h('input', { value: p.given || '', autocomplete: 'off' }),
    surname: h('input', { value: p.surname || '', autocomplete: 'off' }),
    sex: h('select', {}, ...['M', 'F', 'U'].map(v => h('option', { value: v, selected: p.sex === v, text: t({ M: 'male', F: 'female', U: 'unknown' }[v]) }))),
    bdate: h('input', { value: p.birth?.date || '', placeholder: '12 MAR 1931' }),
    bplace: h('input', { value: p.birth?.place || '' }),
    living: h('input', { type: 'checkbox', checked: p.living !== false }),
    ddate: h('input', { value: p.death?.date || '' }),
    dplace: h('input', { value: p.death?.place || '' }),
    occ: h('input', { value: p.occupation || '' }),
    notes: h('textarea', { rows: 5 }, p.notes || ''),
  };
  const deathBox = h('fieldset', { class: 'grp', hidden: f.living.checked }, h('legend', { text: t('died') }), h('div', { class: 'two' }, field(t('date'), f.ddate), field(t('place'), f.dplace)));
  f.living.addEventListener('change', () => { deathBox.hidden = f.living.checked; });
  let delArmed = false;
  const delBtn = !isNew && h('button', {
    class: 'btn danger ghost', type: 'button', text: t('del'),
    onclick: async e => {
      if (!delArmed) { delArmed = true; e.target.textContent = t('delSure'); return; }
      dlg.close();
      const gone = p.id, name = fullName(p);
      const next = parentFams(gone)[0]?.partners[0] || partnerFams(gone)[0]?.partners.find(x => x !== gone) || parentFams(gone)[0]?.children.find(x => x !== gone);
      const ok = await commit(d => {
        delete d.people[gone];
        for (const fm of Object.values(d.families)) {
          fm.partners = fm.partners.filter(x => x !== gone); fm.children = fm.children.filter(x => x !== gone);
          if (fm.partners.length + fm.children.length < 2) delete d.families[fm.id];
        }
        if (d.home === gone) d.home = next || Object.keys(d.people)[0];
      }, `${t('deleted')} ${name}`);
      if (ok) go(next && data.people[next] ? next : data.home);
    },
  });
  const dlg = sheet(
    h('h2', { text: isNew ? extra.title : fullName(p) }),
    extra?.top,
    h('div', { class: 'two' }, field(t('given'), f.given), field(t('surname'), f.surname)),
    field(t('sex'), f.sex),
    h('fieldset', { class: 'grp' }, h('legend', { text: t('born') }), h('div', { class: 'two' }, field(t('date'), f.bdate), field(t('place'), f.bplace))),
    h('label', { class: 'check' }, f.living, h('span', { text: t('living') })),
    deathBox,
    field(t('occupation'), f.occ),
    field(t('notes'), f.notes),
    h('div', { class: 'row end' }, delBtn, h('span', { class: 'grow' }),
      h('button', { class: 'btn ghost', type: 'button', onclick: () => dlg.close(), text: t('cancel') }),
      h('button', { class: 'btn', type: 'submit', text: t('save') })),
  );
  dlg.querySelector('form').addEventListener('submit', e => {
    e.preventDefault();
    const out = {
      given: f.given.value.trim(), surname: f.surname.value.trim(), sex: f.sex.value,
      birth: { date: f.bdate.value.trim(), place: f.bplace.value.trim() },
      living: f.living.checked,
      death: f.living.checked ? { date: '', place: '' } : { date: f.ddate.value.trim(), place: f.dplace.value.trim() },
      occupation: f.occ.value.trim(), notes: f.notes.value.trim(),
    };
    dlg.close();
    onSave(out, extra?.read?.());
  });
  setTimeout(() => (isNew ? f.given : null)?.focus(), 50);
}

function editFocus() {
  const p = person(focus);
  editPerson(p, out => {
    const id = p.id;
    commit(d => { if (d.people[id]) Object.assign(d.people[id], out); }, `${t('edited')} ${fullName({ ...p, ...out })}`);
  });
}

function addRelative() {
  const kinds = ['addParent', 'addPartner', 'addChild', 'addSibling'];
  const dlg = sheet(
    h('h2', { text: t('whoAdd') }),
    h('div', { class: 'choices' }, ...kinds.map(k => h('button', { class: 'choice', type: 'button', text: t(k), onclick: () => { dlg.close(); addKind(k); } }))),
    h('div', { class: 'row end' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => dlg.close(), text: t('cancel') })),
  );
}

function addKind(kind) {
  const base = focus, bp = person(base);
  const defaults = { sex: 'U', living: true };
  if (kind === 'addChild' || kind === 'addSibling') defaults.surname = bp.surname;
  let top = null, read = null;
  if (kind === 'addChild') {
    const pf = partnerFams(base);
    if (pf.length) {
      const sel = h('select', {},
        ...pf.map(f => h('option', { value: f.id, text: fullName(person(f.partners.find(x => x !== base))) || t('notListed') })),
        h('option', { value: '', text: t('notListed') }));
      top = field(t('otherParent'), sel); read = () => sel.value;
    }
  }
  editPerson(defaults, (out, famChoice) => {
    const nid = newId('I');
    commit(d => {
      d.people[nid] = { id: nid, ...out };
      const F = Object.values(d.families);
      const mk = (partners, children) => { const id = newId('F'); d.families[id] = { id, partners, children, marriage: { date: '', place: '' } }; };
      if (kind === 'addParent') {
        const f = F.find(f => f.children.includes(base) && f.partners.length < 2);
        if (f) f.partners.push(nid); else mk([nid], [base]);
      } else if (kind === 'addPartner') mk([base, nid], []);
      else if (kind === 'addChild') {
        const f = famChoice && d.families[famChoice];
        if (f) f.children.push(nid);
        else { const solo = F.find(f => f.partners.length === 1 && f.partners[0] === base); if (solo) solo.children.push(nid); else mk([base], [nid]); }
      } else if (kind === 'addSibling') {
        const f = F.find(f => f.children.includes(base));
        if (f) f.children.push(nid); else mk([], [base, nid]);
      }
    }, `${t('added')} ${fullName(out)}`).then(ok => { if (ok) go(nid); });
  }, { title: `${t('addRel')}: ${t(kind)}`, top, read });
}

// ---------- menu ----------
function download(name, text, type) {
  const a = h('a', { href: URL.createObjectURL(new Blob([text], { type })), download: name });
  document.body.append(a); a.click(); a.remove();
}

function openMenu() {
  let replaceArmed = false, leaveArmed = false;
  const fileIn = h('input', { type: 'file', accept: '.ged,.zip,.GED,.ZIP', hidden: true, onchange: e => importFile(e.target.files[0], true) });
  const count = Object.keys(data.people).length;
  const logs = (data.log || []).slice(0, 12);
  const dlg = sheet(
    h('h2', { text: t('menu') }),
    h('p', { class: 'muted', text: `${count} ${t('people')}${cfg ? ' · ' + t('sharedWith') + ': ' + cfg.repo : ''}` }),
    h('div', { class: 'stack' },
      h('button', { class: 'btn ghost wide', type: 'button', text: t('lang'), onclick: () => { setLang(lang === 'en' ? 'el' : 'en'); openMenu(); } }),
      h('button', { class: 'btn ghost wide', type: 'button', text: t('exportGed'), onclick: () => download('family-tree.ged', toGedcom(data), 'text/plain') }),
      h('button', { class: 'btn ghost wide', type: 'button', text: t('exportJson'), onclick: () => download('family-tree-backup.json', JSON.stringify(data, null, 1), 'application/json') }),
      !cfg?.member && h('button', { class: 'btn ghost wide', type: 'button', text: t('share'), onclick: openShare }),
      h('button', { class: 'btn ghost wide', type: 'button', text: t('replace'), onclick: e => {
        if (!replaceArmed) { replaceArmed = true; e.target.textContent = t('replaceSure'); return; }
        fileIn.click();
      } }),
      cfg && h('button', { class: 'btn ghost wide danger', type: 'button', text: t('leave'), onclick: e => {
        if (!leaveArmed) { leaveArmed = true; e.target.textContent = t('leaveSure'); return; }
        cfg = null; store.set('cfg', null); store.set('data', null); data = null; dlg.close(); boot();
      } }),
      fileIn,
    ),
    h('h3', { text: t('history') }),
    logs.length ? h('ul', { class: 'log' }, ...logs.map(l => h('li', {},
      h('span', { text: l.msg }),
      h('small', { text: [l.by && `${t('by')} ${l.by}`, new Date(l.at).toLocaleDateString(lang === 'el' ? 'el-GR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })].filter(Boolean).join(' · ') })))) : h('p', { class: 'muted', text: t('noHistory') }),
    h('div', { class: 'row end' }, h('button', { class: 'btn', type: 'button', onclick: () => dlg.close(), text: t('close') })),
  );
}

function openShare() {
  const repo = h('input', { value: cfg?.repo || 'gtkd321/family-tree-data', autocomplete: 'off', spellcheck: 'false' });
  const token = h('input', { type: 'password', value: cfg?.token || '', autocomplete: 'off', placeholder: 'github_pat_…' });
  const pass = h('input', { type: 'text', autocomplete: 'off', spellcheck: 'false' });
  const msg = h('p', { class: 'err', hidden: true });
  const out = h('div', { class: 'stack', hidden: true });
  const dlg = sheet(
    h('h2', { text: t('share') }),
    h('p', { class: 'muted', text: t('shareLead') }),
    field(t('repo'), repo),
    field(t('token'), token),
    h('p', { class: 'muted small' }, t('tokenHelp'), ' ', h('a', { href: 'https://github.com/settings/personal-access-tokens/new', target: '_blank', rel: 'noopener', text: 'github.com/settings/personal-access-tokens/new' })),
    field(t('passcode'), pass),
    msg,
    h('div', { class: 'row end' },
      h('button', { class: 'btn ghost', type: 'button', onclick: () => dlg.close(), text: t('close') }),
      h('button', { class: 'btn', type: 'submit', text: t('makeLink') })),
    out,
  );
  dlg.querySelector('form').addEventListener('submit', async e => {
    e.preventDefault();
    msg.hidden = true;
    const next = { repo: repo.value.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, ''), token: token.value.trim() };
    if (pass.value.trim().length < 8) { msg.textContent = t('passShort'); msg.hidden = false; return; }
    try {
      toast(t('saving'), 0);
      await checkAccess(next);
      const remote = await loadShared(next);
      if (remote.data) data = remote.data;
      else data = await saveShared(next, () => data, 'Upload family tree from Ancestry');
      cfg = next; store.set('cfg', cfg); store.set('data', data); render();
      const link = `${location.origin}${location.pathname}#join=${await makeInvite({ ...next, member: true }, pass.value)}`;
      const copyBtn = h('button', { class: 'btn', type: 'button', text: t('copy'), onclick: async () => {
        try { await navigator.clipboard.writeText(link); } catch { linkBox.select(); document.execCommand('copy'); }
        copyBtn.textContent = t('copied');
      } });
      const linkBox = h('textarea', { rows: 3, readonly: true, class: 'mono' }, link);
      out.replaceChildren(h('h3', { text: t('inviteLink') }), linkBox, copyBtn, h('p', { class: 'muted small', text: t('inviteNote') }));
      out.hidden = false;
      toast(t('savedAll'));
    } catch (err) { toast(''); $('#toast').hidden = true; msg.textContent = errText(err); msg.hidden = false; }
  });
}

// ---------- import ----------
async function importFile(file, replacing) {
  if (!file) return;
  try {
    const fresh = await readTreeFile(file);
    if (replacing && data) { fresh.home = data.people[data.home] && fresh.people[data.home] ? data.home : fresh.home; }
    if (cfg) {
      const ok = await commit(d => { Object.assign(d, fresh, { log: d.log || [] }); }, t('imported'));
      if (!ok) return;
    } else {
      logLine(fresh, t('imported')); data = fresh; store.set('data', data);
    }
    $('#sheet').open && $('#sheet').close();
    go(data.home, true);
  } catch { toast(t('errFile'), 5000); }
}

// ---------- render ----------
function card(id, size = '') {
  const p = person(id);
  if (!p) return null;
  const initials = ((p.given[0] || '') + (p.surname[0] || '')).toUpperCase() || '?';
  return h('button', { class: `card ${size} sex-${p.sex}`, type: 'button', onclick: () => go(id), 'aria-label': fullName(p) },
    h('span', { class: 'av', 'aria-hidden': 'true', text: initials }),
    h('span', { class: 'who' }, h('b', { text: fullName(p) }), h('small', { text: years(p) })),
  );
}
const addCard = (label, kind) => h('button', { class: 'card add', type: 'button', onclick: () => addKind(kind) }, h('span', { class: 'av', text: '+' }), h('span', { class: 'who' }, h('b', { text: label })));
const section = (title, ...kids) => h('section', { class: 'grp-row' }, h('h3', { text: title }), h('div', { class: 'cards' }, ...kids));

function render() {
  document.documentElement.lang = lang;
  document.title = t('title');
  $('#title').textContent = t('title');
  $('#q').placeholder = t('search');
  $('#langBtn').textContent = lang === 'en' ? 'ΕΛ' : 'EN';
  $('#menuBtn').setAttribute('aria-label', t('menu'));
  $('#homeBtn').setAttribute('aria-label', t('home'));
  const main = $('#main');
  if (!data) return;
  $('#bar').hidden = false;
  if (!person(focus)) focus = person(data.home) ? data.home : Object.keys(data.people)[0];
  const p = person(focus);
  const parents = parentFams(focus).flatMap(f => f.partners);
  const pf = partnerFams(focus);
  const sibs = siblingsOf(focus).sort(byBirth);
  const facts = [];
  const ev = (label, e) => (e.date || e.place) && facts.push(h('div', { class: 'fact' }, h('dt', { text: label }), h('dd', { text: [e.date, e.place].filter(Boolean).join(' · ') })));
  ev(t('born'), p.birth);
  if (!p.living) ev(t('died'), p.death);
  if (p.occupation) facts.push(h('div', { class: 'fact' }, h('dt', { text: t('occupation') }), h('dd', { text: p.occupation })));
  for (const f of pf) if (f.marriage && (f.marriage.date || f.marriage.place)) {
    const other = person(f.partners.find(x => x !== focus));
    ev(`${t('marriage')}${other ? ' · ' + fullName(other) : ''}`, f.marriage);
  }

  main.replaceChildren(...[
    section(t('parents'), ...parents.map(id => card(id)), parents.length < 2 && addCard(t('addParent'), 'addParent')),
    h('article', { class: `focus sex-${p.sex}` },
      h('div', { class: 'focus-head' },
        h('span', { class: 'av big', 'aria-hidden': 'true', text: ((p.given[0] || '') + (p.surname[0] || '')).toUpperCase() || '?' }),
        h('div', {}, h('h2', { text: fullName(p) }), h('p', { class: 'yrs', text: years(p) }), data.home === focus && h('p', { class: 'tag', text: t('isHome') }))),
      facts.length > 0 && h('dl', { class: 'facts' }, ...facts),
      p.notes && h('p', { class: 'notes', text: p.notes }),
      h('div', { class: 'row' },
        h('button', { class: 'btn', type: 'button', onclick: editFocus, text: t('edit') }),
        h('button', { class: 'btn ghost', type: 'button', onclick: addRelative, text: t('addRel') }),
        data.home !== focus && h('button', { class: 'btn ghost', type: 'button', text: t('setHome'), onclick: () => { const id = focus; commit(d => { d.home = id; }, `${t('setHome')}: ${fullName(p)}`); } })),
    ),
    pf.length ? pf.map(f => {
      const other = f.partners.find(x => x !== focus);
      const kids = [...f.children].sort(byBirth);
      return h('div', { class: 'fam' },
        section(t('partners'), other ? card(other) : h('p', { class: 'muted', text: t('notListed') })),
        kids.length > 0 && section(other ? `${t('childrenWith')} ${person(other).given || fullName(person(other))}` : t('children'), ...kids.map(id => card(id))));
    }) : section(t('partners'), addCard(t('addPartner'), 'addPartner')),
    sibs.length > 0 && section(t('siblings'), ...sibs.map(id => card(id))),
  ].flat().filter(Boolean));
}

function go(id, replace) {
  if (!data || !person(id)) id = data?.home;
  focus = id;
  const url = `#p=${encodeURIComponent(id)}`;
  if (location.hash !== url) history[replace ? 'replaceState' : 'pushState']({ id }, '', url);
  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function setLang(l) { lang = l; store.set('lang', l); render(); if (!data) boot(); }

// ---------- search ----------
function runSearch() {
  const q = fold($('#q').value.trim());
  const box = $('#results');
  if (!q || !data) { box.hidden = true; return; }
  const words = q.split(/\s+/);
  const hits = Object.values(data.people).filter(p => { const n = fold(fullName(p) + ' ' + p.birth.place); return words.every(w => n.includes(w)); }).slice(0, 40);
  box.replaceChildren(...(hits.length ? hits.map(p => h('button', { class: 'hit', type: 'button', onclick: () => { $('#q').value = ''; box.hidden = true; go(p.id); } },
    h('b', { text: fullName(p) }), h('small', { text: [years(p), p.birth.place].filter(Boolean).join(' · ') }))) : [h('p', { class: 'muted pad', text: t('noResults') })]));
  box.hidden = false;
}

// ---------- screens ----------
function showJoin(blob) {
  $('#bar').hidden = true;
  const pass = h('input', { type: 'text', autocomplete: 'off', spellcheck: 'false', autocapitalize: 'off', 'aria-label': t('passcode') });
  const err = h('p', { class: 'err', hidden: true, text: t('wrongPass') });
  const form = h('form', { class: 'gate' },
    h('div', { class: 'stripe', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')),
    h('h1', { text: t('title') }), h('p', { class: 'muted', text: t('joinLead') }),
    field(t('passcode'), pass), err,
    h('button', { class: 'btn wide', type: 'submit', text: t('open') }),
    h('button', { class: 'linkish', type: 'button', text: t('lang'), onclick: () => { lang = lang === 'en' ? 'el' : 'en'; store.set('lang', lang); showJoin(blob); } }));
  form.addEventListener('submit', async e => {
    e.preventDefault(); err.hidden = true;
    try { cfg = await openInvite(blob, pass.value); }
    catch { err.textContent = t('wrongPass'); err.hidden = false; return; }
    store.set('cfg', cfg);
    history.replaceState(null, '', location.pathname);
    boot();
  });
  $('#main').replaceChildren(form);
  setTimeout(() => pass.focus(), 50);
}

function showEmpty() {
  $('#bar').hidden = true;
  const fileIn = h('input', { type: 'file', accept: '.ged,.zip,.GED,.ZIP', hidden: true, id: 'file', onchange: e => importFile(e.target.files[0]) });
  $('#main').replaceChildren(h('div', { class: 'gate' },
    h('div', { class: 'stripe', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')),
    h('h1', { text: t('title') }),
    h('p', { text: t('emptyLead') }),
    h('button', { class: 'btn wide', type: 'button', text: t('choose'), onclick: () => fileIn.click() }), fileIn,
    h('p', { class: 'muted small', text: t('emptyHow') }),
    h('button', { class: 'linkish', type: 'button', text: t('lang'), onclick: () => setLang(lang === 'en' ? 'el' : 'en') })));
}

async function boot() {
  const join = location.hash.match(/^#join=([A-Za-z0-9_-]+)/);
  if (join) return showJoin(join[1]);
  if (cfg) {
    try {
      const remote = await loadShared(cfg);
      if (remote.data) { data = remote.data; store.set('data', data); }
    } catch (e) { if (data) setTimeout(() => toast(e.message === 'badtoken' ? t('errToken') : t('offline'), 5000), 300); }
  }
  if (!data) return showEmpty();
  $('#bar').hidden = false;
  const m = location.hash.match(/^#p=(.+)$/);
  go(m ? decodeURIComponent(m[1]) : data.home, true);
}

window.addEventListener('popstate', () => {
  const m = location.hash.match(/^#p=(.+)$/);
  if (data) { focus = m ? decodeURIComponent(m[1]) : data.home; render(); }
});
window.addEventListener('hashchange', () => { if (/^#join=/.test(location.hash)) boot(); });
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible' && cfg && data && !$('#sheet').open) {
    try { const r = await loadShared(cfg); if (r.data) { data = r.data; store.set('data', data); render(); } } catch {}
  }
});

$('#q').addEventListener('input', runSearch);
$('#q').addEventListener('keydown', e => { if (e.key === 'Escape') { e.target.value = ''; runSearch(); } if (e.key === 'Enter') $('#results .hit')?.click(); });
document.addEventListener('click', e => { if (!e.target.closest('.search')) $('#results').hidden = true; });
$('#homeBtn').addEventListener('click', () => go(data.home));
$('#menuBtn').addEventListener('click', openMenu);
$('#langBtn').addEventListener('click', () => setLang(lang === 'en' ? 'el' : 'en'));
$('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet') e.target.close(); });

render();
boot();
