import { byId, clear, text } from './dom.js';
import { requireRoles, signIn, signOut } from './auth.js';
import { getClient } from './supabase-client.js';

const message = byId('staff-message'); const form = byId('login-form'); const app = byId('staff-app');
async function render() {
  const target = byId('institutions'); clear(target);
  const { data, error } = await getClient().from('v11_institutions').select('id, slug, legal_name, active').order('legal_name');
  if (error) throw error;
  for (const institution of data || []) { const card = text('article', '', 'ticket'); card.append(text('strong', institution.legal_name), text('p', `Slug: ${institution.slug}`), text('p', institution.active ? 'Activa' : 'Inactiva', 'muted')); target.append(card); }
  if (!target.childElementCount) target.append(text('p', 'No hay instituciones visibles.', 'muted'));
}
async function load() {
  try { await requireRoles(['mt_superadmin']); form.classList.add('hidden'); app.classList.remove('hidden'); await render(); }
  catch (error) { message.replaceChildren(text('p', error.message, 'message message-info')); }
}
form.addEventListener('submit', async (event) => { event.preventDefault(); try { await signIn(byId('email').value, byId('password').value); await load(); } catch { message.replaceChildren(text('p', 'No fue posible iniciar sesión.', 'message message-error')); } });
byId('logout').addEventListener('click', async () => { await signOut(); window.location.reload(); });
load();
