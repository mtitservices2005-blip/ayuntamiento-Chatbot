import { contentStatuses, municipalConfig } from '../shared/municipal-config.js';
import { conversationIntents } from '../shared/contracts/channel-contracts.js';

const chat = document.querySelector('#chat');
const input = document.querySelector('#message-input');
const send = document.querySelector('#send-button');
const evidenceInput = document.querySelector('#evidence-input');
const state = { mode: 'menu', report: {}, ticket: null };
const content = municipalConfig.institutionalContent;

const isPublished = (item) => item?.status === contentStatuses.PUBLISHED;
const pendingText = (label) => `[PENDIENTE: ${label} oficial validado por el Ayuntamiento]`;
const quickSectorOptions = [...municipalConfig.sectors, 'Otro sector de Laguna Salada'];

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
    evidenceRequired: false,
  };
}

document.querySelector('#municipal-logo').src = municipalConfig.branding.logoUrl;
document.querySelector('#municipal-name').textContent = municipalConfig.municipality.name;
document.documentElement.style.setProperty('--wa-green', municipalConfig.branding.primaryColor);

defaultWelcome();

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
  if (payload === conversationIntents.MAIN_MENU) return defaultWelcome();
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
  if (payload === 'location:gps-demo') return useDemoGps();
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
  quickReplies(quickSectorOptions.map((sector) => [sector === 'Otro sector de Laguna Salada' ? '➕ Otro sector' : `📍 ${sector}`, sector === 'Otro sector de Laguna Salada' ? 'sector:other' : `sector:${sector}`]));
}
function selectSector(sector) {
  state.report.sector = sector;
  state.mode = 'report-location-choice';
  bot('📌 ¿Cómo deseas indicar la ubicación exacta del problema?');
  const options = [['📡 Compartir ubicación GPS demo', 'location:gps-demo'], ['✍️ Escribir dirección o referencia', 'location:manual']];
  if (municipalConfig.reportPolicy.allowLocationOmission) options.push(['⏭️ Omitir ubicación', 'location:omit']);
  quickReplies(options);
}
function askOtherSector() { state.mode = 'report-other-sector'; bot('✍️ Escribe el nombre del sector. Esta instancia solo gestiona reportes correspondientes a Laguna Salada.'); }
function useDemoGps() {
  const gps = municipalConfig.reportPolicy.demoGps;
  state.report.latitude = gps.latitude;
  state.report.longitude = gps.longitude;
  state.report.locationSource = 'web-demo-gps';
  state.report.locationText = `${gps.label} (${gps.latitude}, ${gps.longitude}; precisión simulada ${gps.accuracyMeters} m)`;
  bot(`📡 Ubicación GPS simulada registrada.\n\n${state.report.locationText}\n\nContrato futuro WhatsApp Location Message preparado: ${JSON.stringify(locationContracts.futureWhatsAppLocationMessage)}.`);
  askDescription();
}
function askManualLocation() { state.mode = 'report-manual-location'; bot('✍️ Escribe la dirección, calle, referencia o punto cercano dentro de Laguna Salada.'); }
function omitLocation() { state.report.locationSource = 'omitted-by-policy'; state.report.locationText = 'Ubicación omitida según política institucional'; askDescription(); }
function askDescription() { state.mode = 'report-description'; bot('📝 Describe brevemente qué está ocurriendo.'); }
function askEvidence() {
  state.mode = 'report-evidence';
  const requiredText = state.report.evidenceRequired ? 'Esta categoría requiere evidencia antes de confirmar.' : 'Puedes agregar evidencia demo antes de confirmar.';
  bot(`📷 Fotografía o evidencia. ${requiredText}\n\nEn esta demo puedes seleccionar un archivo, ver su nombre y una vista previa local. Evidencia demo · no enviada.`);
  quickReplies([['📎 Seleccionar archivo demo', 'evidence:add'], ...(state.report.evidenceRequired ? [] : [['Continuar sin evidencia', 'evidence:skip']])]);
}
function requestEvidenceFile() { evidenceInput.click(); }
function skipEvidence() { state.report.evidence = null; showReportSummary(); }
function showReportSummary() {
  state.mode = 'report-confirmation';
  const evidenceLabel = state.report.evidence ? `${state.report.evidence.name} · Evidencia demo · no enviada` : 'Sin evidencia seleccionada';
  bot(`✅ Revisa tu reporte antes de generar el folio demo:\n\nCategoría: ${state.report.category}\nSector: ${state.report.sector}\nDirección/GPS: ${state.report.locationText}\nDescripción: ${state.report.description}\nEvidencia seleccionada: ${evidenceLabel}`);
  quickReplies([['✅ Confirmar', 'report:confirm'], ['✏️ Corregir', 'report:correct']]);
}
function confirmReport() {
  const folio = `LS-${new Date().toISOString().slice(2, 10).replaceAll('-', '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  state.mode = 'menu';
  bot(`🎫 REPORTE DEMO CREADO\n\nFolio demo: ${folio}\nCategoría: ${state.report.category}\nSector: ${state.report.sector}\nUbicación: ${state.report.locationText}\nEstado: Recibido\n\nGuarda tu folio para consultar el estado. La evidencia queda marcada como demo y no fue enviada. Contratos futuros: ${JSON.stringify(evidenceContracts.futureSupabaseStorage)}.`);
  backMenu();
}
function startReportCorrection() { bot('✏️ Corregiremos el reporte desde el inicio para evitar datos inconsistentes.'); startReport(); }
function startTicketLookup() { state.mode = 'ticket-lookup'; bot('🎫 Escribe tu número de ticket para consultar el estado.\n\nEjemplo demo: LS-260715-0001'); }
function backMenu() { quickReplies([['🏠 Menú principal', conversationIntents.MAIN_MENU]]); }
function municipalityBackMenu() { quickReplies([['🏛️ Volver a Conoce tu municipio', conversationIntents.KNOW_MUNICIPALITY], ['🏠 Menú principal', conversationIntents.MAIN_MENU]]); }

function handleText() {
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  user(text);
  if (state.mode === 'report-other-sector') { state.report.sector = text; return selectSector(text); }
  if (state.mode === 'report-manual-location') { state.report.locationText = text; state.report.locationSource = 'manual-address'; return askDescription(); }
  if (state.mode === 'report-description') { state.report.description = text; return askEvidence(); }
  if (state.mode === 'ticket-lookup') { state.mode = 'menu'; bot(`🔎 Resultado demo para ${text.toUpperCase()}\n\nEstado: 🟡 Recibido\nCanal: Conversacional V1.1\nNota: la consulta real se conectará al backend sin depender del canal WhatsApp o web.`); backMenu(); return; }
  bot('🤖 Puedo ayudarte desde el menú principal con reportes, consulta de reportes, Conoce tu municipio, contactos y horarios.');
  backMenu();
}

function handleEvidenceSelection(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const previewUrl = file.type?.startsWith('image/') ? URL.createObjectURL(file) : '';
  state.report.evidence = { name: file.name, type: file.type || 'application/octet-stream', size: file.size, previewUrl, demoOnly: true };
  bot(`📎 Evidencia demo · no enviada\nArchivo: ${file.name}\nTipo: ${state.report.evidence.type}\nTamaño: ${file.size} bytes`);
  if (previewUrl) card({ title: 'Vista previa local de evidencia demo', image: previewUrl, body: 'Esta imagen solo existe en tu navegador. No se subió a Supabase ni se envió a WhatsApp.' });
  showReportSummary();
}

send.addEventListener('click', handleText);
input.addEventListener('keydown', (event) => { if (event.key === 'Enter') handleText(); });
evidenceInput.addEventListener('change', handleEvidenceSelection);
