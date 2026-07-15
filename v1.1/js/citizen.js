import { byId, clear, setBusy, showMessage, text } from './dom.js';
import { getInstitutionSlug } from './config.js';
import { createCitizenTicket, getPublicInstitution, lookupCitizenTicket, validateCitizenEvidence } from './api.js';

const createMessage = byId('create-message');
const lookupMessage = byId('lookup-message');
const createForm = byId('create-ticket-form');
const lookupForm = byId('lookup-ticket-form');
const createButton = byId('create-button');
const lookupButton = byId('lookup-button');
const locationButton = byId('use-current-location');
const locationStatus = byId('location-status');
const evidenceInput = byId('evidence');
const evidenceStatus = byId('evidence-status');
let institution;
let currentPosition = null;
let selectedEvidence = null;

function options(select, values, placeholder) {
  clear(select); select.append(new Option(placeholder, ''));
  for (const value of values || []) select.append(new Option(String(value), String(value)));
}

function setStatus(container, message, kind = 'info') {
  showMessage(container, message, kind);
}

function translateGeolocationError(error) {
  if (error.code === error.PERMISSION_DENIED) return ['permiso denegado', 'No autorizaste el uso del GPS. Puedes escribir la dirección o referencia manualmente.'];
  if (error.code === error.POSITION_UNAVAILABLE) return ['ubicación no disponible', 'El navegador no pudo obtener una ubicación disponible. Escribe una referencia manual.'];
  if (error.code === error.TIMEOUT) return ['timeout', 'La solicitud de ubicación agotó el tiempo de espera. Intenta de nuevo o escribe la dirección.'];
  return ['ubicación no disponible', 'No fue posible obtener la ubicación actual.'];
}

function requestCurrentLocation() {
  currentPosition = null;
  if (!window.isSecureContext) {
    setStatus(locationStatus, 'ubicación no disponible: el GPS del navegador requiere HTTPS o localhost. En GitHub Pages debe abrirse con https://.', 'error');
    return;
  }
  if (!navigator.geolocation) {
    setStatus(locationStatus, 'ubicación no disponible: este navegador no expone navigator.geolocation.', 'error');
    return;
  }
  setStatus(locationStatus, 'solicitando permiso para usar tu ubicación actual…', 'info');
  navigator.geolocation.getCurrentPosition((position) => {
    currentPosition = position.coords;
    setStatus(locationStatus, `ubicación obtenida: latitud ${currentPosition.latitude.toFixed(6)}, longitud ${currentPosition.longitude.toFixed(6)}, precisión ±${Math.round(currentPosition.accuracy)} m.`, 'success');
  }, (error) => {
    const [state, detail] = translateGeolocationError(error);
    setStatus(locationStatus, `${state}: ${detail}`, error.code === error.PERMISSION_DENIED ? 'error' : 'warning');
  }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
}

async function validateEvidenceSelection() {
  selectedEvidence = evidenceInput.files?.[0] || null;
  if (!selectedEvidence) {
    setStatus(evidenceStatus, 'Sin fotografía seleccionada. Puedes crear el reporte sin evidencia.', 'info');
    return;
  }
  setStatus(evidenceStatus, 'validando fotografía seleccionada…', 'info');
  try {
    const result = await validateCitizenEvidence(institution, selectedEvidence);
    const status = result.canUpload ? 'subiendo' : result.status;
    setStatus(evidenceStatus, `${status}: ${result.message}`, result.canUpload ? 'info' : result.kind);
  } catch (error) {
    setStatus(evidenceStatus, `error de red: ${error.message || 'No fue posible validar Storage.'}`, 'error');
  }
}

async function initialize() {
  try {
    institution = await getPublicInstitution(getInstitutionSlug());
    byId('institution-name').textContent = institution.name;
    options(byId('category'), institution.ticket_categories, 'Selecciona una categoría');
    options(byId('sector'), institution.sectors, 'Sin sector especificado');
  } catch (error) { showMessage(createMessage, error.message, 'error'); createButton.disabled = true; }
}

locationButton.addEventListener('click', requestCurrentLocation);
evidenceInput.addEventListener('change', validateEvidenceSelection);

createForm.addEventListener('submit', async (event) => {
  event.preventDefault(); if (!institution) return;
  setBusy(createButton, true); clear(createMessage);
  try {
    const evidence = selectedEvidence ? await validateCitizenEvidence(institution, selectedEvidence) : { evidencePath: null };
    if (selectedEvidence && !evidence.canUpload) setStatus(evidenceStatus, `${evidence.status}: ${evidence.message}`, evidence.kind);
    const result = await createCitizenTicket(institution, {
      category: byId('category').value,
      sector: byId('sector').value,
      location: byId('location').value,
      latitude: currentPosition?.latitude ?? null,
      longitude: currentPosition?.longitude ?? null,
      description: byId('description').value,
      evidencePath: evidence.canUpload ? evidence.evidencePath : null
    });
    clear(createMessage); createMessage.append(text('p', 'Reporte creado. Guarda estos datos: ', 'message message-success'), text('p', `Identificador: ${result.public_id}`), text('p', `Código de seguimiento: ${result.tracking_secret}`));
    if (selectedEvidence && !evidence.canUpload) setStatus(evidenceStatus, `${evidence.status}: reporte creado sin evidencia adjunta. ${evidence.message}`, evidence.kind);
    createForm.reset(); currentPosition = null; selectedEvidence = null; setStatus(locationStatus, 'Puedes usar el GPS o escribir una dirección para el siguiente reporte.', 'info');
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
