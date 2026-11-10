// Cuenta y almacenamiento.
// Los datos se guardan SOLO en este dispositivo y CIFRADOS (AES-GCM) con una clave que se deriva
// de tu contraseña (PBKDF2). Sin la contraseña no se pueden leer. Sin servidores, sin rastreadores.

const ACCOUNT = 'marea:account';
const VAULT = 'marea:vault';
const REMEMBER = 'marea:remember';
const SESSION = 'marea:session';
const ITERATIONS = 210000;

const DEFAULTS = {
  settings: { cycleLen: 28, periodLen: 5, goal: 'controlar', usual: [], onboarded: false },
  days: {},
};

export const fresh = () => JSON.parse(JSON.stringify(DEFAULTS));

export function normalize(data) {
  const base = fresh();
  return {
    settings: { ...base.settings, ...(data?.settings || {}) },
    days: data?.days && typeof data.days === 'object' ? data.days : {},
  };
}

const ls = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); return true; } catch { return false; } },
  del: (k) => { try { localStorage.removeItem(k); } catch {} },
};
const ss = {
  get: (k) => { try { return sessionStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { sessionStorage.setItem(k, v); } catch {} },
  del: (k) => { try { sessionStorage.removeItem(k); } catch {} },
};

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const enc = new TextEncoder();
const dec = new TextDecoder();

async function deriveKey(password, saltB64) {
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: unb64(saltB64), iterations: ITERATIONS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
}

async function encrypt(key, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj)));
  return JSON.stringify({ iv: b64(iv), ct: b64(ct) });
}

async function decrypt(key, raw) {
  const { iv, ct } = JSON.parse(raw);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, key, unb64(ct));
  return JSON.parse(dec.decode(pt));
}

const exportKey = async (key) => b64(await crypto.subtle.exportKey('raw', key));
const importKey = (s) => crypto.subtle.importKey('raw', unb64(s), 'AES-GCM', true, ['encrypt', 'decrypt']);

let currentKey = null;

export const normEmail = (e) => String(e || '').trim().toLowerCase();

export function getAccount() {
  try { return JSON.parse(ls.get(ACCOUNT)); } catch { return null; }
}

async function keepSession(key, remember) {
  const raw = await exportKey(key);
  ss.set(SESSION, raw);
  if (remember) ls.set(REMEMBER, raw);
  else ls.del(REMEMBER);
}

export async function createAccount({ name, email, password, remember }, data) {
  const salt = b64(crypto.getRandomValues(new Uint8Array(16)));
  const key = await deriveKey(password, salt);
  ls.set(ACCOUNT, JSON.stringify({ name: name.trim(), email: normEmail(email), salt, created: new Date().toISOString() }));
  currentKey = key;
  await save(data);
  await keepSession(key, remember);
}

/** Devuelve los datos o lanza un error con code 'email' | 'password'. */
export async function login(email, password, remember) {
  const acc = getAccount();
  if (!acc || acc.email !== normEmail(email)) throw Object.assign(new Error('email'), { code: 'email' });
  const key = await deriveKey(password, acc.salt);
  let data;
  try {
    data = await decrypt(key, ls.get(VAULT));
  } catch {
    throw Object.assign(new Error('password'), { code: 'password' });
  }
  currentKey = key;
  await keepSession(key, remember);
  return normalize(data);
}

/** Sesión abierta (recordada o de esta pestaña). Devuelve los datos o null. */
export async function restoreSession() {
  const raw = ss.get(SESSION) || ls.get(REMEMBER);
  if (!raw || !getAccount()) return null;
  try {
    const key = await importKey(raw);
    const data = await decrypt(key, ls.get(VAULT));
    currentKey = key;
    return normalize(data);
  } catch {
    return null;
  }
}

let pending = Promise.resolve();
export function save(state) {
  for (const [k, d] of Object.entries(state.days)) {
    const empty = d.flow == null && !d.sex && !d.test && !d.discharge && !d.notes &&
      !d.symptoms?.length && !d.mood?.length && !d.factors?.length && d.temp == null && !d.ovTest && !d.pill;
    if (empty) delete state.days[k];
  }
  if (!currentKey) return pending;
  const key = currentKey;
  const snapshot = JSON.parse(JSON.stringify(state));
  pending = pending.then(async () => ls.set(VAULT, await encrypt(key, snapshot))).catch(() => {});
  return pending;
}

export async function changePassword(oldPw, newPw, state) {
  const acc = getAccount();
  const oldKey = await deriveKey(oldPw, acc.salt);
  try { await decrypt(oldKey, ls.get(VAULT)); } catch { throw Object.assign(new Error('password'), { code: 'password' }); }
  const salt = b64(crypto.getRandomValues(new Uint8Array(16)));
  currentKey = await deriveKey(newPw, salt);
  ls.set(ACCOUNT, JSON.stringify({ ...acc, salt }));
  await save(state);
  await keepSession(currentKey, !!ls.get(REMEMBER));
}

export function logout() {
  currentKey = null;
  ss.del(SESSION);
  ls.del(REMEMBER);
}

export function deleteAccount() {
  logout();
  ls.del(ACCOUNT);
  ls.del(VAULT);
}
