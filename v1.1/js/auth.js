import { getClient } from './supabase-client.js';

export async function getSession() {
  const { data, error } = await getClient().auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function requireRoles(roles) {
  const session = await getSession();
  if (!session) throw new Error('Inicia sesión para acceder a este panel.');
  const { data, error } = await getClient().from('v11_memberships')
    .select('institution_id, role, active').eq('user_id', session.user.id).eq('active', true);
  if (error) throw error;
  const memberships = data || [];
  if (!memberships.some((membership) => roles.includes(membership.role))) {
    throw new Error('Tu cuenta no tiene el rol requerido.');
  }
  return { session, memberships };
}

export async function signIn(email, password) {
  const { error } = await getClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await getClient().auth.signOut();
  if (error) throw error;
}
