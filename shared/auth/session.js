import { AUTH_ROLES, normalizeRole } from './roles.js';
import { configureSupabaseClient as configureClient, getSupabaseClient } from '../supabase/client.js';
import { getMembershipContext } from '../api/v11.js';

export function configureSupabaseClient(client) {
  return configureClient(client);
}

export { getSupabaseClient };

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

export async function detectConfirmedRole(session) {
  const context = await getMembershipContext({ session });
  return context.role || null;
}

export async function getInstitutionContext(session) {
  return getMembershipContext({ session });
}
