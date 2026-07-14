import { getPublicConfig } from './config.js';

let client;

export function getClient() {
  if (client) return client;
  const config = getPublicConfig();
  if (!window.supabase?.createClient) throw new Error('No se pudo cargar el cliente de datos.');
  client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  return client;
}
