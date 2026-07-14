import { AUTH_ROLES, normalizeRole } from './roles.js';

let supabaseClient = null;

export function configureSupabaseClient(client) {
  supabaseClient = client;
  return supabaseClient;
}

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  if (globalThis.SAIBOT_SUPABASE_CLIENT) return globalThis.SAIBOT_SUPABASE_CLIENT;

  const url = globalThis.SAIBOT_SUPABASE_URL;
  const anonKey = globalThis.SAIBOT_SUPABASE_ANON_KEY;
  if (url && anonKey && globalThis.supabase?.createClient) {
    supabaseClient = globalThis.supabase.createClient(url, anonKey);
    return supabaseClient;
  }

  throw new Error('Supabase Auth no está configurado. Define SAIBOT_SUPABASE_URL y SAIBOT_SUPABASE_ANON_KEY.');
}

export async function login({ email, password }) {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function logout() {
  const client = getSupabaseClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data?.session || null;
}

export function detectRole(session) {
  const user = session?.user || session?.data?.user || session;
  const metadata = {
    ...(user?.app_metadata || {}),
    ...(user?.user_metadata || {}),
  };
  const candidate = metadata.role || metadata.roles?.[0] || user?.role;
  const role = normalizeRole(candidate);
  return Object.values(AUTH_ROLES).includes(role) ? role : null;
}
