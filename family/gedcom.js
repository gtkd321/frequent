// GEDCOM import/export and .zip reading for Ancestry exports.
// Data model: { people: {id: Person}, families: {id: Family}, home, log: [] }
// Person: { id, given, surname, sex: 'M'|'F'|'U', birth:{date,place}, death:{date,place}, living, occupation, notes }
// Family: { id, partners: [personId], children: [personId], marriage:{date,place} }

export async function readTreeFile(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  let text;
  if (buf[0] === 0x50 && buf[1] === 0x4b) text = await gedFromZip(buf);
  else text = decode(buf);
  return parseGedcom(text);
}

function decode(buf) {
  // Ancestry exports UTF-8 (sometimes with BOM). Fall back to latin1 if UTF-8 is invalid.
  try { return new TextDecoder('utf-8', { fatal: true }).decode(buf).replace(/^\uFEFF/, ''); }
  catch { return new TextDecoder('windows-1252').decode(buf); }
}

async function gedFromZip(buf) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 66000); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('zip');
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  for (let n = 0; n < count; n++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true);
    const csize = dv.getUint32(p + 20, true);
    const nameLen = dv.getUint16(p + 28, true), extraLen = dv.getUint16(p + 30, true), comLen = dv.getUint16(p + 32, true);
    const local = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(buf.subarray(p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extraLen + comLen;
    if (!/\.ged$/i.test(name) || /(^|\/)__MACOSX\//.test(name)) continue;
    const start = local + 30 + dv.getUint16(local + 26, true) + dv.getUint16(local + 28, true);
    const data = buf.subarray(start, start + csize);
    if (method === 0) return decode(data);
    if (method === 8) {
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return decode(new Uint8Array(await new Response(stream).arrayBuffer()));
    }
    throw new Error('zip');
  }
  throw new Error('noged');
}

export function parseGedcom(text) {
  const lines = text.split(/\r\n|\r|\n/);
  const root = { children: [] };
  const stack = [root];
  for (const raw of lines) {
    const m = raw.match(/^\s*(\d+)\s+(@[^@]+@\s+)?(\S+)(?:\s(.*))?$/);
    if (!m) continue;
    const level = +m[1];
    const node = { xref: m[2] ? m[2].trim() : null, tag: m[3].toUpperCase(), value: m[4] || '', children: [] };
    if (node.tag === 'CONC' || node.tag === 'CONT') {
      const parent = stack[level];
      if (parent) parent.value += (node.tag === 'CONT' ? '\n' : '') + node.value;
      continue;
    }
    stack.length = level + 1;
    (stack[level] || root).children.push(node);
    stack[level + 1] = node;
  }
  const sub = (n, tag) => n.children.find(c => c.tag === tag);
  const val = (n, tag) => (sub(n, tag) || {}).value || '';
  const notes = {};
  for (const r of root.children) if (r.tag === 'NOTE' && r.xref) notes[r.xref] = r.value;
  const event = (n, tag) => { const e = sub(n, tag); return { date: e ? val(e, 'DATE') : '', place: e ? val(e, 'PLAC') : '' }; };
  const cleanId = x => x.replace(/@/g, '');
  const people = {}, families = {};
  let first = null;
  for (const r of root.children) {
    if (r.tag === 'INDI' && r.xref) {
      const id = cleanId(r.xref);
      const nameNode = sub(r, 'NAME');
      let given = '', surname = '';
      if (nameNode) {
        const nm = nameNode.value.match(/^([^/]*)\/?([^/]*)\/?(.*)$/);
        given = (nm[1] + ' ' + nm[3]).replace(/\s+/g, ' ').trim();
        surname = nm[2].trim();
        if (val(nameNode, 'GIVN')) given = val(nameNode, 'GIVN');
        if (val(nameNode, 'SURN')) surname = val(nameNode, 'SURN');
      }
      const deathNode = sub(r, 'DEAT');
      const noteText = r.children.filter(c => c.tag === 'NOTE').map(c => /^@.+@$/.test(c.value) ? (notes[c.value] || '') : c.value).filter(Boolean).join('\n\n');
      const sex = val(r, 'SEX').toUpperCase();
      people[id] = {
        id, given, surname, sex: sex === 'M' || sex === 'F' ? sex : 'U',
        birth: event(r, 'BIRT'), death: event(r, 'DEAT'),
        living: !deathNode && !sub(r, 'BURI'),
        occupation: val(r, 'OCCU'), notes: noteText,
      };
      if (!first) first = id;
    } else if (r.tag === 'FAM' && r.xref) {
      const id = cleanId(r.xref);
      families[id] = {
        id,
        partners: r.children.filter(c => c.tag === 'HUSB' || c.tag === 'WIFE').map(c => cleanId(c.value)),
        children: r.children.filter(c => c.tag === 'CHIL').map(c => cleanId(c.value)),
        marriage: event(r, 'MARR'),
      };
    }
  }
  for (const f of Object.values(families)) {
    f.partners = f.partners.filter(id => people[id]);
    f.children = f.children.filter(id => people[id]);
  }
  if (!first) throw new Error('empty');
  return { people, families, home: first, log: [] };
}

export function toGedcom(data) {
  const out = ['0 HEAD', '1 SOUR FrequentFamilyTree', '1 GEDC', '2 VERS 5.5.1', '2 FORM LINEAGE-LINKED', '1 CHAR UTF-8'];
  const text = (lvl, tag, v) => {
    const parts = String(v).split('\n');
    out.push(`${lvl} ${tag} ${parts[0]}`.trimEnd());
    for (const p of parts.slice(1)) out.push(`${lvl + 1} CONT ${p}`.trimEnd());
  };
  const ev = (tag, e) => { if (e && (e.date || e.place)) { out.push(`1 ${tag}`); if (e.date) out.push(`2 DATE ${e.date}`); if (e.place) out.push(`2 PLAC ${e.place}`); } };
  const fams = Object.values(data.families);
  for (const p of Object.values(data.people)) {
    out.push(`0 @${p.id}@ INDI`);
    out.push(`1 NAME ${p.given} /${p.surname}/`.replace(/\s+/g, ' '));
    if (p.given) out.push(`2 GIVN ${p.given}`);
    if (p.surname) out.push(`2 SURN ${p.surname}`);
    if (p.sex !== 'U') out.push(`1 SEX ${p.sex}`);
    ev('BIRT', p.birth);
    if (!p.living && !(p.death.date || p.death.place)) out.push('1 DEAT Y'); else ev('DEAT', p.death);
    if (p.occupation) text(1, 'OCCU', p.occupation);
    if (p.notes) text(1, 'NOTE', p.notes);
    for (const f of fams) {
      if (f.partners.includes(p.id)) out.push(`1 FAMS @${f.id}@`);
      if (f.children.includes(p.id)) out.push(`1 FAMC @${f.id}@`);
    }
  }
  for (const f of fams) {
    out.push(`0 @${f.id}@ FAM`);
    const ps = f.partners.map(id => data.people[id]).filter(Boolean);
    let husb = ps.find(p => p.sex === 'M'), wife = ps.find(p => p.sex === 'F' && p !== husb);
    for (const p of ps) { if (!husb && p !== wife) husb = p; else if (!wife && p !== husb) wife = p; }
    if (husb) out.push(`1 HUSB @${husb.id}@`);
    if (wife) out.push(`1 WIFE @${wife.id}@`);
    for (const c of f.children) out.push(`1 CHIL @${c}@`);
    ev('MARR', f.marriage);
  }
  out.push('0 TRLR');
  return out.join('\r\n') + '\r\n';
}
