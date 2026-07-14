import { byId, clear, setBusy, showMessage, text } from './dom.js';
import { getInstitutionSlug } from './config.js';
import { createCitizenTicket, getPublicInstitution, lookupCitizenTicket } from './api.js';

const createMessage = byId('create-message');
const lookupMessage = byId('lookup-message');
const createForm = byId('create-ticket-form');
const lookupForm = byId('lookup-ticket-form');
const createButton = byId('create-button');
const lookupButton = byId('lookup-button');
let institution;

function options(select, values, placeholder) {
  clear(select); select.append(new Option(placeholder, ''));
  for (const value of values || []) select.append(new Option(String(value), String(value)));
}

async function initialize() {
  try {
    institution = await getPublicInstitution(getInstitutionSlug());
    byId('institution-name').textContent = institution.name;
    options(byId('category'), institution.ticket_categories, 'Selecciona una categoría');
    options(byId('sector'), institution.sectors, 'Sin sector especificado');
  } catch (error) { showMessage(createMessage, error.message, 'error'); createButton.disabled = true; }
}

createForm.addEventListener('submit', async (event) => {
  event.preventDefault(); if (!institution) return;
  setBusy(createButton, true); clear(createMessage);
  try {
    const result = await createCitizenTicket(institution, { category: byId('category').value, sector: byId('sector').value, location: byId('location').value, description: byId('description').value });
    clear(createMessage); createMessage.append(text('p', 'Reporte creado. Guarda estos datos: ', 'message message-success'), text('p', `Identificador: ${result.public_id}`), text('p', `Código de seguimiento: ${result.tracking_secret}`));
    createForm.reset();
  } catch (error) { showMessage(createMessage, error.message || 'No se pudo crear el reporte.', 'error'); } finally { setBusy(createButton, false); }
});

lookupForm.addEventListener('submit', async (event) => {
  event.preventDefault(); setBusy(lookupButton, true); clear(lookupMessage);
  try {
    const result = await lookupCitizenTicket(byId('public-id').value, byId('tracking-secret').value);
    showMessage(lookupMessage, result ? `Estado: ${result.status}. Categoría: ${result.category}.` : 'No fue posible encontrar un reporte con esos datos.', result ? 'success' : 'info');
  } catch { showMessage(lookupMessage, 'No fue posible consultar el reporte.', 'error'); } finally { setBusy(lookupButton, false); }
});
initialize();
