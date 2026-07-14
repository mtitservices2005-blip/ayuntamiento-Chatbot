import { byId, clear, showMessage, text } from './dom.js';
import { requireRoles, signIn, signOut } from './auth.js';
import { listStaffTickets } from './api.js';

export function attachLogin(roles, render) {
  const message = byId('staff-message'); const form = byId('login-form'); const app = byId('staff-app');
  async function load() {
    try { const identity = await requireRoles(roles); form.classList.add('hidden'); app.classList.remove('hidden'); await render(identity); }
    catch (error) { showMessage(message, error.message, 'info'); }
  }
  form.addEventListener('submit', async (event) => { event.preventDefault(); try { await signIn(byId('email').value, byId('password').value); await load(); } catch { showMessage(message, 'No fue posible iniciar sesión.', 'error'); } });
  byId('logout').addEventListener('click', async () => { await signOut(); window.location.reload(); }); load();
}

export async function renderTickets(targetId) {
  const target = byId(targetId); clear(target);
  const tickets = await listStaffTickets();
  if (!tickets.length) { target.append(text('p', 'No hay tickets disponibles.', 'muted')); return; }
  for (const ticket of tickets) { const card = text('article', '', 'ticket'); card.append(text('strong', ticket.category), text('p', `Estado: ${ticket.status}`), text('p', `Actualizado: ${new Date(ticket.updated_at).toLocaleString('es-DO')}`, 'muted')); target.append(card); }
}
