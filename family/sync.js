// Shared copy lives as tree.json in a private GitHub repo.
// Family members get an invite link holding the access token, locked with a family passcode.

const API = 'https://api.github.com';
const FILE = 'tree.json';

const b64 = {
  fromBytes(bytes) { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s); },
  toBytes(str) { const s = atob(str.replace(/\s/g, '')); const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; },
  url(bytes) { return b64.fromBytes(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); },
  fromUrl(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return b64.toBytes(s); },
};

function headers(token, accept = 'application/vnd.github+json') {
  return { Authorization: `Bearer ${token}`, Accept: accept, 'X-GitHub-Api-Version': '2022-11-28' };
}

export async function checkAccess({ repo, token }) {
  const r = await fetch(`${API}/repos/${repo}`, { headers: headers(token) });
  if (r.status === 401) throw new Error('badtoken');
  if (r.status === 404) throw new Error('norepo');
  if (!r.ok) throw new Error('net');
  const j = await r.json();
  if (j.permissions && !j.permissions.push) throw new Error('readonly');
  return j;
}

export async function loadShared({ repo, token }) {
  const r = await fetch(`${API}/repos/${repo}/contents/${FILE}?t=${Date.now()}`, { headers: headers(token), cache: 'no-store' });
  if (r.status === 404) return { data: null, sha: null };
  if (r.status === 401) throw new Error('badtoken');
  if (!r.ok) throw new Error('net');
  const meta = await r.json();
  let json;
  if (meta.content) json = new TextDecoder().decode(b64.toBytes(meta.content));
  else {
    const raw = await fetch(`${API}/repos/${repo}/contents/${FILE}?t=${Date.now()}`, { headers: headers(token, 'application/vnd.github.raw+json'), cache: 'no-store' });
    if (!raw.ok) throw new Error('net');
    json = await raw.text();
  }
  return { data: JSON.parse(json), sha: meta.sha };
}

// mutate(data) is reapplied to the newest copy, so two relatives editing at once don't overwrite each other.
export async function saveShared(cfg, mutate, message) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, sha } = await loadShared(cfg);
    const next = mutate(data);
    const body = {
      message,
      content: b64.fromBytes(new TextEncoder().encode(JSON.stringify(next))),
      ...(sha ? { sha } : {}),
    };
    const r = await fetch(`${API}/repos/${cfg.repo}/contents/${FILE}`, { method: 'PUT', headers: headers(cfg.token), body: JSON.stringify(body) });
    if (r.ok) return next;
    if (r.status === 409 || r.status === 422) continue;
    if (r.status === 401 || r.status === 403) throw new Error('badtoken');
    throw new Error('net');
  }
  throw new Error('busy');
}

async function keyFrom(passcode, salt) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(passcode.trim()), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function makeInvite(cfg, passcode) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await keyFrom(passcode, salt);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(cfg))));
  const packed = new Uint8Array(28 + ct.length);
  packed.set(salt, 0); packed.set(iv, 16); packed.set(ct, 28);
  return b64.url(packed);
}

export async function openInvite(blob, passcode) {
  const packed = b64.fromUrl(blob);
  const key = await keyFrom(passcode, packed.subarray(0, 16));
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: packed.subarray(16, 28) }, key, packed.subarray(28));
  return JSON.parse(new TextDecoder().decode(plain));
}
