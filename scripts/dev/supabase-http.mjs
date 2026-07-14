const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];

export function config() {
  if (process.env.SAIBOT_TARGET_ENV !== 'dev') throw new Error('Define SAIBOT_TARGET_ENV=dev; las pruebas rechazan cualquier otro ambiente.');
  for (const key of required) if (!process.env[key]) throw new Error(`Falta la variable de entorno ${key}.`);
  return {
    url: process.env.SUPABASE_URL.replace(/\/$/, ''),
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  };
}

async function request(url, { key, token = key, method = 'GET', body, rawBody, headers = {} }) {
  const response = await fetch(url, {
    method,
    headers: { apikey: key, authorization: `Bearer ${token}`, 'content-type': 'application/json', ...headers },
    body: rawBody === undefined ? (body === undefined ? undefined : JSON.stringify(body)) : rawBody
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const error = new Error(typeof data === 'object' ? (data.message || data.msg || JSON.stringify(data)) : text || response.statusText);
    error.status = response.status; error.data = data; throw error;
  }
  return data;
}

export async function service(path, options = {}) {
  const cfg = config(); return request(`${cfg.url}${path}`, { key: cfg.serviceKey, ...options });
}

export async function anon(path, options = {}) {
  const cfg = config(); return request(`${cfg.url}${path}`, { key: cfg.anonKey, ...options });
}

export async function user(path, accessToken, options = {}) {
  const cfg = config(); return request(`${cfg.url}${path}`, { key: cfg.anonKey, token: accessToken, ...options });
}

export async function rpcAsUser(name, accessToken, payload) {
  return user(`/rest/v1/rpc/${name}`, accessToken, { method: 'POST', body: payload });
}

export async function rpcAnon(name, payload) {
  return anon(`/rest/v1/rpc/${name}`, { method: 'POST', body: payload });
}

export async function signIn(email, password) {
  return anon('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } });
}

export async function findOrCreateUser({ email, password, displayName }) {
  const listed = await service('/auth/v1/admin/users?per_page=1000');
  const existing = (listed.users || listed).find((item) => item.email?.toLowerCase() === email.toLowerCase());
  if (existing) return existing;
  return service('/auth/v1/admin/users', {
    method: 'POST', body: { email, password, email_confirm: true, user_metadata: { display_name: displayName } }
  });
}

export function assert(condition, message) { if (!condition) throw new Error(message); }

export async function expectDenied(action, label) {
  try { await action(); throw new Error(`${label}: se permitió una acción que debía ser denegada.`); }
  catch (error) {
    if (error.message.includes('se permitió una acción')) throw error;
    assert([401, 403].includes(error.status), `${label}: respuesta inesperada (${error.status || error.message}).`);
  }
}
