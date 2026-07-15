import { contentStatuses, municipalConfig } from '../shared/municipal-config.js';
import { conversationIntents } from '../shared/contracts/channel-contracts.js';
import { createCitizenTicket, getPublicInstitutionConfig } from '../../shared/api/v11.js';
import { getSupabaseClient } from '../../shared/supabase/client.js';

const chat = document.querySelector('#chat');
const input = document.querySelector('#message-input');
const send = document.querySelector('#send-button');
const evidenceInput = document.querySelector('#evidence-input');
const state = { mode: 'menu', report: {}, ticket: null, institution: null, integrationMode: 'DEMO' };
const content = municipalConfig.institutionalContent;

const isPublished = (item) => item?.status === contentStatuses.PUBLISHED;
const pendingText = (label) => `[PENDIENTE: ${label} oficial validado por el Ayuntamiento]`;
const quickSectorOptions = [...municipalConfig.sectors, 'Otro sector'];

const locationContracts = {
  webDemoGps: municipalConfig.reportPolicy.demoGps,
  futureWhatsAppLocationMessage: municipalConfig.futureContracts.whatsappLocationMessage,
};
const evidenceContracts = {
  futureWhatsAppEvidenceMessage: municipalConfig.futureContracts.whatsappEvidenceMessage,
  futureSupabaseStorage: municipalConfig.futureContracts.supabaseEvidenceStorage,
};

const legacyCategoryLabel = (category) => typeof category === 'string' ? category : category.label;

function newReportDraft() {
  return {
    category: '',
    categoryId: '',
    sector: '',
    locationText: '',
    latitude: null,
    longitude: null,
    locationSource: '',
    description: '',
    evidence: null,
    evidenceValidation: null,
    evidenceRequired: false,
  };
}

document.querySelector('#municipal-logo').src = municipalConfig.branding.logoUrl;
document.querySelector('#municipal-name').textContent = municipalConfig.municipality.name;
document.documentElement.style.setProperty('--wa-green', municipalConfig.branding.primaryColor);

initializeIntegration();
defaultWelcome();


async function initializeIntegration() {
  if (!getSupabaseClient({ optional: true })) {
    state.integrationMode = 'DEMO';
    return;
  }
  try {
    state.institution = await getPublicInstitutionConfig(municipalConfig.reportPolicy.activeInstitutionSlug);
    state.integrationMode = state.institution?.id ? 'REAL' : 'DEMO';
  } catch (error) {
    state.integrationMode = 'DEMO';
    console.warn('Supabase público no disponible para chatbot V1.1; se usará fallback demo.', error);
  }
}

function translateGeolocationError(error) {
  if (error.code === error.PERMISSION_DENIED) return 'Permiso denegado. Puedes escribir la dirección o referencia manualmente.';
  if (error.code === error.POSITION_UNAVAILABLE) return 'Ubicación no disponible. El navegador no pudo obtener una ubicación actual.';
  if (error.code === error.TIMEOUT) return 'Timeout. La solicitud de ubicación agotó el tiempo de espera.';
  return 'Ubicación no disponible. No fue posible obtener la ubicación actual.';
}

function validateEvidenceFile(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxBytes = 8 * 1024 * 1024;
  if (!file) return { ok: false, kind: 'info', status: 'sin evidencia', message: 'No se seleccionó evidencia.' };
  if (!allowedTypes.includes(file.type)) return { ok: false, kind: 'error', status: 'MIME inválido', message: 'Solo se permiten fotografías JPEG, PNG o WebP.' };
  if (file.size <= 0) return { ok: false, kind: 'error', status: 'archivo vacío', message: 'La fotografía está vacía.' };
  if (file.size > maxBytes) return { ok: false, kind: 'error', status: 'tamaño excedido', message: 'La fotografía supera 8 MB.' };
  return {
    ok: true,
    kind: 'warning',
    status: 'BLOCKED',
    message: 'Archivo válido localmente. Upload real bloqueado: contrato confirmado bucket ticket-evidence-v11, ruta <institution_id>/pending/... y RPC v11_create_citizen_ticket; falta Edge Function autorizada o policy aprobada para upload ciudadano directo.',
  };
}

function defaultWelcome() {
  state.mode = 'menu';
  bot(`👋 ¡Hola! Soy el asistente virtual de ${municipalConfig.municipality.name}.\n\nEsta demo V1.1 conserva el flujo conversacional ciudadano pensado para WhatsApp.\n\n¿En qué puedo ayudarte hoy?`);
  quickReplies([
    ['🚨 Reportar una incidencia', conversationIntents.REPORT_INCIDENT],
    ['🎫 Consultar mi reporte', conversationIntents.LOOKUP_TICKET],
    ['🏛️ Conoce tu municipio', conversationIntents.KNOW_MUNICIPALITY],
    ['📞 Contactos y horarios', conversationIntents.CONTACTS_AND_HOURS],
  ]);
}

function knowMunicipalityMenu() {
  state.mode = 'know-municipality';
  bot('🏛️ Conoce tu municipio. Selecciona una opción:');
  quickReplies([
    ['📜 Historia del municipio', conversationIntents.MUNICIPAL_HISTORY],
    ['📸 Lugares emblemáticos', conversationIntents.LANDMARKS],
    ['👤 Conoce a tu alcalde', conversationIntents.MAYOR_PROFILE],
    ['👥 Conoce a tu vicealcaldesa', conversationIntents.DEPUTY_MAYOR_PROFILE],
    ['🏛️ Concejo municipal', conversationIntents.MUNICIPAL_COUNCIL],
    ['🏠 Volver al menú principal', conversationIntents.MAIN_MENU],
  ]);
}

function bot(text) { addBubble(text, 'bot'); }
function user(text) { addBubble(text, 'user'); }
function addBubble(text, type) {
  const el = document.createElement('div');
  el.className = `bubble ${type === 'user' ? 'user' : ''}`;
  el.textContent = text;
  chat.append(el);
  chat.scrollTop = chat.scrollHeight;
}
function quickReplies(items) {
  const wrap = document.createElement('div');
  wrap.className = 'quick-replies';
  items.forEach(([label, payload]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => handlePayload(payload, label));
    wrap.append(button);
  });
  chat.append(wrap);
  chat.scrollTop = chat.scrollHeight;
}
function card({ title, image, body, list }) {
  const el = document.createElement('article');
  el.className = 'card';
  el.innerHTML = `<img src="${image}" alt="${title}"><div><h2>${title}</h2><p>${body}</p>${list ? `<ul>${list.map((item) => `<li>${item}</li>`).join('')}</ul>` : ''}</div>`;
  chat.append(el);
  chat.scrollTop = chat.scrollHeight;
}

function handlePayload(payload, label) {
  user(label);
  if (payload === conversationIntents.MAIN_MENU) { initializeIntegration(); return defaultWelcome(); }
  if (payload === conversationIntents.KNOW_MUNICIPALITY) return knowMunicipalityMenu();
  if (payload === conversationIntents.MUNICIPAL_HISTORY) return showHistory();
  if (payload === conversationIntents.MAYOR_PROFILE) return showAuthority(content.authorities.mayor, 'alcalde');
  if (payload === conversationIntents.DEPUTY_MAYOR_PROFILE) return showAuthority(content.authorities.deputyMayor, 'vicealcaldesa');
  if (payload === conversationIntents.MUNICIPAL_COUNCIL) return showCouncil();
  if (payload === conversationIntents.LANDMARKS) return showLandmarks();
  if (payload === conversationIntents.CONTACTS_AND_HOURS) return showContacts();
  if (payload === conversationIntents.REPORT_INCIDENT) return startReport();
  if (payload === conversationIntents.LOOKUP_TICKET) return startTicketLookup();
  if (payload.startsWith('category:')) return selectCategory(payload.replace('category:', ''));
  if (payload === 'sector:other') return askOtherSector();
  if (payload.startsWith('sector:')) return selectSector(payload.replace('sector:', ''));
  if (payload === 'location:gps') return requestCurrentLocation();
  if (payload === 'location:manual') return askManualLocation();
  if (payload === 'location:omit') return omitLocation();
  if (payload === 'evidence:add') return requestEvidenceFile();
  if (payload === 'evidence:skip') return skipEvidence();
  if (payload === 'report:confirm') return confirmReport();
  if (payload === 'report:correct') return startReportCorrection();
}

function showHistory() {
  if (!isPublished(content.history)) bot(`📜 Historia del municipio\n\n${pendingText('historia del municipio')}`);
  else bot(`📜 ${content.history.title}\n\n${content.history.body}`);
  municipalityBackMenu();
}
function showAuthority(authority, label) {
  if (!isPublished(authority)) { bot(`ℹ️ ${authority.menuLabel}\n\n${pendingText(`perfil del ${label}`)}`); return municipalityBackMenu(); }
  card({ title: `${authority.name}\n${authority.role}`, image: authority.photoUrl, body: `Período: ${authority.term}\n\nBiografía: ${authority.biography}\n\nTrayectoria: ${authority.career}\n\nMensaje institucional: ${authority.institutionalMessage}`, list: authority.functions });
  municipalityBackMenu();
}
function showCouncil() {
  const publishedCouncil = content.council.filter(isPublished);
  if (!publishedCouncil.length) bot(`🏛️ Concejo municipal\n\n${pendingText('listado del Concejo municipal')}`);
  else publishedCouncil.forEach((member) => card({ title: member.name, image: './assets/placeholder-authority.svg', body: `${member.role}\nComisión: ${member.commission}\n\n${member.biography}` }));
  municipalityBackMenu();
}
function showLandmarks() {
  const publishedPlaces = content.landmarks.filter(isPublished);
  bot('📸 Lugares emblemáticos del municipio:');
  publishedPlaces.forEach((place) => card({ title: place.name, image: place.photoUrl, body: place.description }));
  if (!publishedPlaces.length) bot(pendingText('lugares emblemáticos'));
  municipalityBackMenu();
}
function showContacts() { const c = municipalConfig.contacts; bot(`📞 ${c.title}\n\nTeléfono: ${c.phone}\nCorreo: ${c.email}\nDirección: ${c.address}\nHorario: ${c.openingHours}`); backMenu(); }

function startReport() {
  state.mode = 'report-category';
  state.report = newReportDraft();
  bot(`🚨 Vamos a crear un reporte ciudadano para ${municipalConfig.municipality.shortName}. Selecciona el tipo de incidencia:`);
  quickReplies(municipalConfig.reportCategories.map((category) => [legacyCategoryLabel(category), `category:${category.id ?? category}`]));
}
function selectCategory(categoryId) {
  const category = municipalConfig.reportCategories.find((item) => (item.id ?? item) === categoryId) ?? { id: categoryId, label: categoryId };
  state.report.categoryId = category.id ?? categoryId;
  state.report.category = legacyCategoryLabel(category);
  state.report.evidenceRequired = Boolean(category.requiresEvidence ?? municipalConfig.reportPolicy.requireEvidenceByDefault);
  state.mode = 'report-sector';
  bot('📍 Selecciona el sector o barrio de Laguna Salada donde ocurre la incidencia. No te pediré municipio porque esta institución activa ya es Laguna Salada.');
  quickReplies(quickSectorOptions.map((sector) => [sector === 'Otro sector' ? '➕ Otro sector' : `📍 ${sector}`, sector === 'Otro sector' ? 'sector:other' : `sector:${sector}`]));
}
function selectSector(sector) {
  state.report.sector = sector;
  state.mode = 'report-location-choice';
  bot('📌 ¿Cómo deseas indicar la ubicación exacta del problema?');
  const options = [['📍 Usar mi ubicación actual', 'location:gps'], ['✍️ Escribir dirección o referencia', 'location:manual']];
  if (municipalConfig.reportPolicy.allowLocationOmission) options.push(['⏭️ Omitir ubicación', 'location:omit']);
  quickReplies(options);
}
function askOtherSector() { state.mode = 'report-other-sector'; bot('✍️ Escribe el nombre del sector o barrio de Laguna Salada.'); }
function requestCurrentLocation() {
  state.mode = 'report-location-choice';
  if (!window.isSecureContext) { bot('⚠️ Contexto no seguro: el GPS del navegador requiere HTTPS o localhost. Puedes escribir la dirección o referencia manualmente.'); return selectSector(state.report.sector); }
  if (!navigator.geolocation) { bot('⚠️ Ubicación no disponible: este navegador no expone navigator.geolocation. Puedes escribir la dirección o referencia manualmente.'); return selectSector(state.report.sector); }
  bot('Solicitando permiso de ubicación...');
  navigator.geolocation.getCurrentPosition((position) => {
    const { latitude, longitude, accuracy } = position.coords;
    state.report.latitude = latitude;
    state.report.longitude = longitude;
    state.report.accuracy = accuracy;
    state.report.locationSource = 'browser-geolocation';
    state.report.locationText = `GPS real del navegador: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}; precisión aproximada ${Math.round(accuracy)} metros`;
    bot(`📍 Ubicación obtenida correctamente\nLatitud: ${latitude.toFixed(6)}\nLongitud: ${longitude.toFixed(6)}\nPrecisión aproximada: ${Math.round(accuracy)} metros`);
    askDescription();
  }, (error) => {
    bot(`⚠️ ${translateGeolocationError(error)}`);
    askManualLocation();
  }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
}
function askManualLocation() { state.mode = 'report-manual-location'; bot('✍️ Escribe la dirección, calle, referencia o punto cercano dentro de Laguna Salada.'); }
function omitLocation() { state.report.locationSource = 'omitted-by-policy'; state.report.locationText = 'Ubicación omitida según política institucional'; askDescription(); }
function askDescription() { state.mode = 'report-description'; bot('📝 Describe brevemente qué está ocurriendo.'); }
function askEvidence() {
  state.mode = 'report-evidence';
  const requiredText = state.report.evidenceRequired ? 'Esta categoría requiere evidencia cuando la infraestructura lo permita.' : 'Puedes agregar evidencia antes de confirmar.';
  bot(`📷 Fotografía o evidencia. ${requiredText}\n\nSelecciona una fotografía desde cámara o galería si tu navegador lo soporta. Validaré MIME/tamaño y mostraré preview local; no fingiré upload exitoso.`);
  quickReplies([['📎 Seleccionar fotografía', 'evidence:add'], ['Continuar sin evidencia', 'evidence:skip']]);
}
function requestEvidenceFile() { evidenceInput.click(); }
function skipEvidence() { state.report.evidence = null; showReportSummary(); }
function showReportSummary() {
  state.mode = 'report-confirmation';
  const evidenceLabel = state.report.evidence ? `${state.report.evidence.name} · ${state.report.evidenceValidation?.status}: ${state.report.evidenceValidation?.message}` : 'Sin evidencia seleccionada';
  bot(`✅ Revisa tu reporte antes de generar el folio:\n\nCategoría: ${state.report.category}\nSector: ${state.report.sector}\nDirección/GPS: ${state.report.locationText}\nDescripción: ${state.report.description}\nEvidencia seleccionada: ${evidenceLabel}`);
  quickReplies([['✅ Confirmar reporte', 'report:confirm'], ['✏️ Corregir información', 'report:correct']]);
}
async function confirmReport() {
  if (state.integrationMode === 'REAL' && state.institution?.id) {
    try {
      const rows = await createCitizenTicket({ institutionId: state.institution.id, category: state.report.category, description: state.report.description, sector: state.report.sector, locationText: state.report.locationText, latitude: state.report.latitude, longitude: state.report.longitude, evidencePath: null });
      const result = Array.isArray(rows) ? rows[0] : rows;
      state.mode = 'menu';
      bot(`🎫 Reporte creado\n\nFolio: ${result.public_id}\nCódigo de seguimiento: ${result.tracking_secret}\nEstado: Recibido\n\nConserva el folio y el código de seguimiento para consultar tu reporte. La evidencia no se adjuntó porque el upload ciudadano sigue bloqueado hasta contar con Edge Function autorizada.`);
      return ticketActions();
    } catch (error) {
      bot(`⚠️ Backend no disponible en este momento: ${error.message || 'No fue posible crear el ticket real.'} Usaré fallback demo claramente identificado.`);
    }
  }
  const folio = `LS-${new Date().toISOString().slice(2, 10).replaceAll('-', '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  const tracking = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  state.mode = 'menu';
  bot(`🎫 REPORTE DEMO CREADO\n\nFolio demo: ${folio}\nCódigo de seguimiento demo: ${tracking}\nCategoría: ${state.report.category}\nSector: ${state.report.sector}\nUbicación: ${state.report.locationText}\nEstado: Recibido\n\nGuarda tu folio y código de seguimiento. Fallback demo: Supabase público no está disponible o autorizado en este entorno. La evidencia no fue subida; ${evidenceContracts.futureSupabaseStorage.bucket} requiere Edge Function segura.`);
  ticketActions();
}
function startReportCorrection() { bot('✏️ Corregiremos el reporte desde el inicio para evitar datos inconsistentes.'); startReport(); }
function startTicketLookup() { state.mode = 'ticket-lookup'; bot('🎫 Escribe tu número de ticket para consultar el estado.\n\nEjemplo demo: LS-260715-0001'); }
function backMenu() { quickReplies([['🏠 Menú principal', conversationIntents.MAIN_MENU]]); }
function ticketActions() { quickReplies([['🏠 Menú principal', conversationIntents.MAIN_MENU], ['🎫 Consultar mi reporte', conversationIntents.LOOKUP_TICKET]]); }
function municipalityBackMenu() { quickReplies([['🏛️ Volver a Conoce tu municipio', conversationIntents.KNOW_MUNICIPALITY], ['🏠 Menú principal', conversationIntents.MAIN_MENU]]); }

function handleText() {
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  user(text);
  if (state.mode === 'report-other-sector') { return selectSector(text); }
  if (state.mode === 'report-manual-location') { state.report.locationText = text; state.report.locationSource = 'manual-address'; return askDescription(); }
  if (state.mode === 'report-description') { state.report.description = text; return askEvidence(); }
  if (state.mode === 'ticket-lookup') { state.mode = 'menu'; bot(`🔎 Resultado demo para ${text.toUpperCase()}\n\nEstado: 🟡 Recibido\nCanal: Conversacional V1.1\nNota: la consulta real se conectará al backend sin depender del canal WhatsApp o web.`); backMenu(); return; }
  bot('🤖 Puedo ayudarte desde el menú principal con reportes, consulta de reportes, Conoce tu municipio, contactos y horarios.');
  backMenu();
}

function handleEvidenceSelection(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const validation = validateEvidenceFile(file);
  const previewUrl = file.type?.startsWith('image/') ? URL.createObjectURL(file) : '';
  state.report.evidence = { name: file.name, type: file.type || 'application/octet-stream', size: file.size, previewUrl };
  state.report.evidenceValidation = validation;
  bot(`📎 Evidencia seleccionada\nArchivo: ${file.name}\nTipo: ${state.report.evidence.type}\nTamaño: ${file.size} bytes\nEstado real: ${validation.status} · ${validation.message}`);
  if (previewUrl) card({ title: 'Vista previa local de evidencia', image: previewUrl, body: 'Esta imagen solo existe localmente en tu navegador. No se subió a Supabase ni se envió a WhatsApp.' });
  showReportSummary();
}

send.addEventListener('click', handleText);
input.addEventListener('keydown', (event) => { if (event.key === 'Enter') handleText(); });
evidenceInput.addEventListener('change', handleEvidenceSelection);
