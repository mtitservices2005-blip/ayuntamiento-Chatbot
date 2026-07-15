export const SUPABASE_CONFIG_GLOBALS = Object.freeze({
  client: 'SAIBOT_SUPABASE_CLIENT',
  url: 'SAIBOT_SUPABASE_URL',
  anonKey: 'SAIBOT_SUPABASE_ANON_KEY',
});

let cachedClient = null;

export function configureSupabaseClient(client) {
  cachedClient = client;
  return cachedClient;
}

export function getSupabaseConfig() {
  return {
    url: globalThis[SUPABASE_CONFIG_GLOBALS.url] || null,
    anonKey: globalThis[SUPABASE_CONFIG_GLOBALS.anonKey] || null,
    hasFactory: Boolean(globalThis.supabase?.createClient),
    hasInjectedClient: Boolean(globalThis[SUPABASE_CONFIG_GLOBALS.client]),
  };
}

export function getSupabaseClient(options = {}) {
  if (cachedClient) return cachedClient;
  if (globalThis[SUPABASE_CONFIG_GLOBALS.client]) return globalThis[SUPABASE_CONFIG_GLOBALS.client];

  const { url, anonKey, hasFactory } = getSupabaseConfig();
  if (url && anonKey && hasFactory) {
    cachedClient = globalThis.supabase.createClient(url, anonKey);
    return cachedClient;
  }

  if (options.optional) return null;
  throw new Error('Supabase no está configurado con valores públicos permitidos.');
}

export function getIntegrationMode(options = {}) {
  return getSupabaseClient({ optional: true }) || options.forceReal ? 'REAL' : 'DEMO';
}
