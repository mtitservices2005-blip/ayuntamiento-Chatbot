import { contentStatuses, municipalConfig } from '../shared/municipal-config.js';
import { conversationIntents } from '../shared/contracts/channel-contracts.js';
import { createCitizenTicket, getPublicInstitutionConfig } from '../../shared/api/v11.js';
import { getSupabaseClient } from '../../shared/supabase/client.js';

const chat = document.querySelector('#chat');
const input = document.querySelector('#message-input');
const send = document.querySelector('#send-button');
const evidenceInput = document.querySelector('#evidence-input');
const dateInput = document.querySelector('#date-input');
const timeInput = document.querySelector('#time-input');
const state = { mode: 'menu', report: {}, serviceRequest: {}, ticket: null, institution: null, integrationMode: 'DEMO' };
const content = municipalConfig.institutionalContent;

const isPublished = (item) => item?.status === contentStatuses.PUBLISHED;
const pendingText = (label) => `[PENDIENTE: ${label} oficial validado por el Ayuntamiento]`;
const PENDING_VALIDATION = 'Pendiente';
const quickSectorOptions = [...municipalConfig.sectors, 'Otro sector'];
const serviceDeskConfig = municipalConfig.serviceDesk;
const serviceStatusCycle = serviceDeskConfig.statuses;
const serviceExceptionalStatuses = serviceDeskConfig.exceptionalStatuses;

const legacyCategoryLabel = (category) => typeof category === 'string' ? category : category.label;
const subtypeLabel = (subtype) => typeof subtype === 'string' ? subtype : subtype.label;
const formatCurrency = (amount, currency = serviceDeskConfig.currency || 'RD$') => `${currency} ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
function getSubtypePricing(service, subtypeName) { return service?.subtypes?.find((subtype) => subtypeLabel(subtype) === subtypeName) || { label: subtypeName, price: null, price_status: 'pendiente', free: false, requires_evaluation: false, payment_required: false, payment_instructions: '', fee_notes: 'Costo pendiente de validación' }; }
function formatPriceLine(pricing, estimated = true) {
  if (pricing?.price_status === 'pendiente') return '**Costo:** Pendiente de validación';
  if (pricing?.free) return '**Costo:** Gratis';
  if (Number.isFinite(Number(pricing?.price))) return `**Costo${estimated ? ' estimado' : ''}:** ${formatCurrency(pricing.price)}`;
  return '**Costo:** Pendiente de validación';
}
function priceStatusLabel(status) { return status === 'oficial' ? 'oficial' : status === 'pendiente' ? 'pendiente' : 'Demo'; }


function isSummaryValidated(item) {
  return isPublished(item) && item?.summaryValidated === true;
}

export function buildMunicipalStatistics(profile = municipalConfig) {
  const institutionalContent = profile.institutionalContent || {};
  const population = institutionalContent.population;
  const territorialArea = institutionalContent.territorialArea;
  const economy = institutionalContent.economy;
  const economyActivities = isSummaryValidated(economy) && economy.productiveActivities?.length
    ? 'Agricultura · Comercio · Servicios'
    : PENDING_VALIDATION;

  return {
    items: [
      {
        label: 'Población',
        value: isSummaryValidated(population) && population.total ? population.total : PENDING_VALIDATION,
      },
      {
        label: 'Área km²',
        value: isSummaryValidated(territorialArea) && territorialArea.valueKm2 ? `${territorialArea.valueKm2} km²` : PENDING_VALIDATION,
      },
      {
        label: 'Economía',
        value: economyActivities,
      },
    ],
  };
}

function buildWelcomeStatisticsText(profile = municipalConfig) {
  const summary = buildMunicipalStatistics(profile);
  return summary.items.map((item) => `**${item.label.replace(' km²', '')}:** ${item.value}`).join('\n');
}

function formatDateForSummary(value) {
  if (!value) return 'No aplica';
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('es-DO', { dateStyle: 'long' }).format(new Date(year, month - 1, day));
}

function formatTimeForSummary(value) {
  if (!value) return 'No aplica';
  const [hour, minute] = value.split(':').map(Number);
  return new Intl.DateTimeFormat('es-DO', { timeStyle: 'short' }).format(new Date(2026, 0, 1, hour, minute));
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function isPastDate(value) {
  return Boolean(value) && value < todayIsoDate();
}

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
dateInput.min = todayIsoDate();

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
  if (error?.code === error?.PERMISSION_DENIED || error?.code === 1) return '🚫 No pudimos acceder a tu ubicación porque el permiso fue rechazado. Puedes escribir una dirección o referencia.';
  if (error?.code === error?.POSITION_UNAVAILABLE || error?.code === 2) return '📍 Tu ubicación no está disponible en este momento. Puedes escribir una dirección o referencia.';
  if (error?.code === error?.TIMEOUT || error?.code === 3) return '⏱️ La solicitud de ubicación tardó demasiado. Puedes intentarlo nuevamente o escribir una dirección.';
  return '📍 No pudimos obtener tu ubicación automáticamente. Puedes escribir una dirección o referencia.';
}

function showLocationRetryOptions() {
  quickReplies([['📍 Intentar nuevamente', 'location:gps'], ['✍️ Escribir dirección o referencia', 'location:manual']]);
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
    status: 'Pendiente de envío',
    message: 'La fotografía fue seleccionada, pero el envío de evidencia aún no está disponible en este entorno.',
  };
}

function defaultWelcome() {
  state.mode = 'menu';
  bot(`👋 ¡Hola! Soy el asistente virtual de ${municipalConfig.municipality.name}.\n\n${buildWelcomeStatisticsText(municipalConfig)}\n\n¿En qué puedo ayudarte hoy?`);
  quickReplies([
    ['🚨 Reportar una incidencia', conversationIntents.REPORT_INCIDENT],
    ['🏛️ Solicitar un servicio municipal', conversationIntents.REQUEST_MUNICIPAL_SERVICE],
    ['🎫 Consultar mi reporte o solicitud', conversationIntents.LOOKUP_TICKET],
    ['🏛️ Conoce tu municipio', conversationIntents.KNOW_MUNICIPALITY],
    ['📞 Contactos y horarios', conversationIntents.CONTACTS_AND_HOURS],
  ]);
}

function knowMunicipalityMenu() {
  state.mode = 'know-municipality';
  bot('🏛️ Conoce tu municipio. Selecciona una opción:');
  quickReplies([
    ['📜 Historia del municipio', conversationIntents.MUNICIPAL_HISTORY],
    ['👥 Población', 'municipal_population'],
    ['💼 Economía', 'municipal_economy'],
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
  if (type === 'user') {
    el.textContent = text;
  } else {
    text.split('\n').forEach((line, index) => {
      if (index) el.append(document.createElement('br'));
      const match = line.match(/^\*\*([^*]+):\*\*\s?(.*)$/);
      if (match) {
        const strong = document.createElement('strong');
        strong.textContent = `${match[1]}:`;
        el.append(strong, ` ${match[2]}`);
      } else {
        el.append(line);
      }
    });
  }
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
  if (payload === 'service-date:pick') { dateInput.showPicker?.(); dateInput.focus(); return; }
  if (payload === 'service-time:pick') { timeInput.showPicker?.(); timeInput.focus(); return; }
  if (payload === 'service-date:type') return bot('✏️ Escribe la fecha en formato AAAA-MM-DD.');
  if (payload === 'service-time:type') return bot('✏️ Escribe la hora en formato HH:MM.');
  if (payload === conversationIntents.MAIN_MENU) { initializeIntegration(); return defaultWelcome(); }
  if (payload === conversationIntents.KNOW_MUNICIPALITY) return knowMunicipalityMenu();
  if (payload === conversationIntents.MUNICIPAL_HISTORY) return showHistory();
  if (payload === 'municipal_population') return showPopulation();
  if (payload === 'municipal_economy') return showEconomy();
  if (payload === conversationIntents.MAYOR_PROFILE) return showAuthority(content.authorities.mayor, 'alcalde');
  if (payload === conversationIntents.DEPUTY_MAYOR_PROFILE) return showAuthority(content.authorities.deputyMayor, 'vicealcaldesa');
  if (payload === conversationIntents.MUNICIPAL_COUNCIL) return showCouncil();
  if (payload === conversationIntents.LANDMARKS) return showLandmarks();
  if (payload.startsWith('landmark:')) return showLandmarkDetail(payload.replace('landmark:', ''));
  if (payload === conversationIntents.CONTACTS_AND_HOURS) return showContacts();
  if (payload === conversationIntents.REPORT_INCIDENT) return startReport();
  if (payload === conversationIntents.REQUEST_MUNICIPAL_SERVICE) return startServiceRequest();
  if (payload === conversationIntents.LOOKUP_TICKET) return startTicketLookup();
  if (payload.startsWith('category:')) return selectCategory(payload.replace('category:', ''));
  if (payload === 'sector:other') return askOtherSector();
  if (payload.startsWith('sector:')) return selectSector(payload.replace('sector:', ''));
  if (payload === 'service-sector:other') return askOtherServiceSector();
  if (payload.startsWith('service-sector:')) return selectServiceSector(payload.replace('service-sector:', ''));
  if (payload === 'location:gps') return requestCurrentLocation();
  if (payload === 'location:manual') return askManualLocation();
  if (payload === 'location:omit') return omitLocation();
  if (payload === 'evidence:add') return requestEvidenceFile();
  if (payload === 'evidence:skip') return skipEvidence();
  if (payload === 'report:confirm') return confirmReport();
  if (payload === 'report:correct') return startReportCorrection();
  if (payload.startsWith('service:')) return selectMunicipalService(payload.replace('service:', ''));
  if (payload.startsWith('service-subtype:')) return selectServiceSubtype(payload.replace('service-subtype:', ''));
  if (payload === 'service-location:gps') return requestServiceCurrentLocation();
  if (payload === 'service-location:manual') return askServiceManualLocation();
  if (payload === 'service-evidence:add') return requestEvidenceFile();
  if (payload === 'service-evidence:skip') return showServiceSummary();
  if (payload === 'service:confirm') return confirmServiceRequest();
  if (payload === 'service:correct') return startServiceRequest();
  if (payload === 'service-close:confirm') return closeResolvedService();
  if (payload === 'service-close:review') return reopenServiceForReview();
}

function showHistory() {
  if (!isPublished(content.history)) bot(`📜 Historia del municipio\n\n${pendingText('historia del municipio')}`);
  else bot(`📜 ${content.history.title}\n\n${content.history.body}`);
  municipalityBackMenu();
}
function showPopulation() {
  const population = content.population;
  if (!isPublished(population)) bot(`👥 Población\n\nInformación pendiente de validación oficial`);
  else bot(`👥 ${population.title}\n\nPoblación total: ${population.total || 'Información pendiente de validación oficial'}\nPoblación urbana/rural: ${population.urbanRural || 'Información pendiente de validación oficial'}\nCrecimiento: ${population.growth || 'Información pendiente de validación oficial'}\nComunidades o distritos: ${(population.communities?.length ? population.communities.join(', ') : 'Información pendiente de validación oficial')}\nFuente y año: ${population.source || 'Información pendiente de validación oficial'} · ${population.year || 'año pendiente'}${population.note ? `\n\n${population.note}` : ''}`);
  municipalityBackMenu();
}
function showEconomy() {
  const economy = content.economy;
  if (!isPublished(economy)) bot(`💼 Economía\n\nInformación pendiente de validación oficial`);
  else bot(`💼 ${economy.title}\n\nDescripción general: ${economy.generalDescription}\n\nAgricultura: ${economy.agriculture}\n\nComercio: ${economy.commerce}\n\nPrincipales actividades productivas: ${(economy.productiveActivities?.length ? economy.productiveActivities.join(', ') : 'Información pendiente de validación oficial')}\n\nEmpleo y emprendimiento local: ${economy.employmentEntrepreneurship}\n\nOportunidades económicas: ${economy.opportunities}\n\nCifras oficiales: ${economy.officialFigures}\nFuente: ${economy.source}`);
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
  bot('📸 Lugares emblemáticos del municipio. Selecciona un lugar para ver su detalle:');
  if (!publishedPlaces.length) bot(pendingText('lugares emblemáticos'));
  else quickReplies(publishedPlaces.map((place) => [`📍 ${place.name}`, `landmark:${place.id}`]));
  municipalityBackMenu();
}
function showLandmarkDetail(placeId) {
  const place = content.landmarks.find((item) => item.id === placeId && isPublished(item));
  if (!place) bot(pendingText('detalle del lugar emblemático'));
  else card({ title: place.name, image: place.photoUrl, body: `${place.description}

Importancia histórica/cultural: ${place.importance || 'Información pendiente de validación oficial'}

Ubicación o referencia: ${place.location || 'Información pendiente de validación oficial'}` });
  quickReplies([['📸 Volver al listado de lugares', conversationIntents.LANDMARKS], ['🏛️ Volver a Conoce tu municipio', conversationIntents.KNOW_MUNICIPALITY], ['🏠 Menú principal', conversationIntents.MAIN_MENU]]);
}
function showContacts() { const c = municipalConfig.contacts; bot(`📞 ${c.title}\n\nTeléfono: ${c.phone}\nCorreo: ${c.email}\nDirección: ${c.address}\nHorario: ${c.openingHours}`); backMenu(); }


function newServiceRequestDraft() {
  return { caseType: 'Solicitud de servicio', folioPrefix: serviceDeskConfig.folioPrefix, municipality: municipalConfig.municipality.shortName, serviceId: '', category: '', subtype: '', pricing: {}, citizenContact: '', sector: '', locationText: '', latitude: null, longitude: null, locationSource: '', description: '', evidence: null, evidenceValidation: null, department: '', assignmentTarget: '', priority: 'Normal', status: serviceStatusCycle[0], paymentStatus: 'no aplica', futurePaymentMethod: '', futurePaymentReference: '', timestamps: { createdAt: null, updatedAt: null, assignedAt: null, resolvedAt: null, closedAt: null }, history: [], tracking: '', details: {} };
}
function getSelectedService() { return serviceDeskConfig.services.find((service) => service.id === state.serviceRequest.serviceId); }
function startServiceRequest() {
  state.mode = 'service-category';
  state.serviceRequest = newServiceRequestDraft();
  bot(`🏛️ Solicitar un servicio municipal. Selecciona el servicio disponible para ${municipalConfig.municipality.shortName}:`);
  quickReplies(serviceDeskConfig.services.map((service) => [service.label, `service:${service.id}`]));
}
function selectMunicipalService(serviceId) {
  const service = serviceDeskConfig.services.find((item) => item.id === serviceId);
  if (!service) return startServiceRequest();
  Object.assign(state.serviceRequest, { serviceId: service.id, category: service.label, department: service.department, assignmentTarget: service.assignmentTarget });
  state.mode = 'service-subtype';
  const subtypePromptLabel = service.flow === 'certification' ? 'tipo de documento' : service.flow === 'space-use' ? 'espacio o servicio solicitado' : 'subtipo';
  bot(`Selecciona el ${subtypePromptLabel} para ${service.label}:`);
  quickReplies(service.subtypes.map((subtype) => [subtypeLabel(subtype), `service-subtype:${subtypeLabel(subtype)}`]));
}
function selectServiceSubtype(subtype) {
  const service = getSelectedService();
  const pricing = getSubtypePricing(service, subtype);
  Object.assign(state.serviceRequest, { subtype, pricing, paymentStatus: pricing.free ? 'exento' : pricing.payment_required ? 'pendiente' : 'no aplica', futurePaymentMethod: '', futurePaymentReference: '' });
  bot(`${formatPriceLine(pricing)}\n${serviceDeskConfig.priceDisclaimer}\nEstado del precio: ${priceStatusLabel(pricing.price_status)}${pricing.requires_evaluation ? '\nSujeto a evaluación municipal.' : ''}\nNo se procesan pagos ni cargos reales en esta demo.`);
  if (service.flow === 'certification') return askCertificationApplicantData();
  if (service.flow === 'space-use') return askSpaceUseDate();
  state.mode = 'service-sector';
  bot('📍 Selecciona el sector o barrio donde se requiere el servicio.');
  quickReplies(quickSectorOptions.map((sector) => [sector === 'Otro sector' ? '➕ Otro sector' : `📍 ${sector}`, sector === 'Otro sector' ? 'service-sector:other' : `service-sector:${sector}`]));
}
function selectServiceSector(sector) { state.serviceRequest.sector = sector; askServiceLocationChoice(); }
function askOtherServiceSector() { state.mode = 'service-other-sector'; bot(`✍️ Escribe el sector o barrio de ${municipalConfig.municipality.shortName}.`); }
function askServiceLocationChoice() { state.mode = 'service-location-choice'; bot('📌 Indica la ubicación del servicio: GPS o dirección/referencia.'); quickReplies([['📍 Usar mi ubicación actual', 'service-location:gps'], ['✍️ Escribir dirección o referencia', 'service-location:manual']]); }
function requestServiceCurrentLocation() { state.mode = 'service-location-choice'; state.serviceRequest.locationText = municipalConfig.reportPolicy.demoGps?.label || 'Ubicación GPS proporcionada'; state.serviceRequest.locationSource = 'gps_or_demo'; askServiceDetails(); }
function askServiceManualLocation() { state.mode = 'service-manual-location'; bot('✍️ Escribe dirección, calle o referencia del lugar.'); }
function askServiceDetails() { const service = getSelectedService(); state.mode = service.flow === 'lighting-reference' ? 'service-lighting-reference' : 'service-description'; bot(service.flow === 'lighting-reference' ? '💡 Escribe la referencia del poste o lugar.' : '📝 Describe brevemente el servicio solicitado.'); }
function askCertificationApplicantData() { state.mode = 'service-cert-applicant'; bot('📄 Escribe los datos del solicitante para el documento. No se solicitará GPS ni fotografía obligatoria.'); }
function askCertificationRequirements() { state.mode = 'service-cert-requirements'; bot(getSelectedService().requirementsPrompt); }
function askSpaceUseDate() { state.mode = 'service-space-date'; dateInput.min = todayIsoDate(); bot('📅 Selecciona la fecha solicitada para el espacio o servicio municipal. Usaré el calendario nativo del dispositivo.'); quickReplies([['📅 Abrir calendario', 'service-date:pick'], ['✏️ Escribir fecha AAAA-MM-DD', 'service-date:type']]); }
function askSpaceUseTime() { state.mode = 'service-space-time'; bot('🕒 Selecciona la hora solicitada. Usaré el reloj nativo del dispositivo.'); quickReplies([['🕒 Abrir reloj', 'service-time:pick'], ['✏️ Escribir hora HH:MM', 'service-time:type']]); }
function askSpaceUsePurpose() { state.mode = 'service-space-purpose'; bot('🎯 Indica el propósito de la actividad.'); }
function askSpaceUsePeople() { state.mode = 'service-space-people'; bot('👥 Indica la cantidad estimada de personas.'); }
function askServiceContact() { state.mode = 'service-contact'; bot('☎️ Escribe un contacto para seguimiento de la solicitud.'); }
function askServiceEvidence() { const service = getSelectedService(); if (service.evidence === 'not_required') return askServiceContact(); state.mode = 'service-evidence'; bot(`📷 Evidencia ${service.evidence === 'recommended' ? 'recomendada' : 'opcional'} para esta solicitud. No es obligatoria para continuar.`); quickReplies([['📎 Seleccionar fotografía', 'service-evidence:add'], ['Continuar sin evidencia', 'service-evidence:skip']]); }
function showServiceSummary() { const r = state.serviceRequest; state.mode = 'service-confirmation'; const detailText = r.description || r.details?.purpose || JSON.stringify(r.details); const summaryLines = ['✅ Revisa tu solicitud antes de generar el folio ' + serviceDeskConfig.folioPrefix + ':', '', '**Tipo:** Solicitud de servicio', `**Servicio:** ${r.category}`, `**Subtipo:** ${r.subtype}`, `${formatPriceLine(r.pricing)}`, `**Estado del precio:** ${priceStatusLabel(r.pricing?.price_status)}`, `**Estado de pago:** ${r.paymentStatus}`, `**Sector:** ${r.sector || 'No aplica'}`, `**Ubicación:** ${r.locationText || 'No aplica'}`, `**Descripción:** ${detailText}`, `**Evidencia:** ${r.evidence?.name || 'No requerida/seleccionada'}`, `**Fecha:** ${formatDateForSummary(r.details?.date)}`, `**Hora:** ${formatTimeForSummary(r.details?.time)}`, `**Contacto:** ${r.citizenContact}`, `**Departamento:** ${r.department}`, serviceDeskConfig.priceDisclaimer, 'No se procesan pagos ni cargos reales.']; bot(summaryLines.join('\n')); quickReplies([['✅ Confirmar solicitud', 'service:confirm'], ['✏️ Corregir información', 'service:correct'], ['↩️ Volver', conversationIntents.MAIN_MENU]]); }
function confirmServiceRequest() { const now = new Date().toISOString(); const folio = `${serviceDeskConfig.folioPrefix}${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`; const tracking = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`; Object.assign(state.serviceRequest, { folio, tracking, timestamps: { ...state.serviceRequest.timestamps, createdAt: now, updatedAt: now }, history: [{ status: 'Recibida', at: now, by: 'chatbot', note: 'Solicitud recibida' }] }); bot(`${serviceDeskConfig.notifications.Recibida.replace('{{folio}}', folio)}\n\nCódigo de seguimiento: ${tracking}\nEstado: Recibida\nDepartamento responsable: ${state.serviceRequest.department}`); serviceActions(); }
function serviceActions() { quickReplies([['🏠 Menú principal', conversationIntents.MAIN_MENU], ['🎫 Consultar mi reporte o solicitud', conversationIntents.LOOKUP_TICKET]]); }
function closeResolvedService() { bot('✅ Solicitud cerrada con confirmación ciudadana. Estado: Cerrada.'); backMenu(); }
function reopenServiceForReview() { bot('🔎 Mantendremos la trazabilidad y devolveremos la solicitud a En revisión para validar lo pendiente.'); backMenu(); }

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
  bot(`📍 Selecciona el sector o barrio de ${municipalConfig.municipality.shortName} donde ocurre la incidencia. No te pediré municipio porque esta institución activa ya es ${municipalConfig.municipality.shortName}.`);
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
function askOtherSector() { state.mode = 'report-other-sector'; bot(`✍️ Escribe el nombre del sector o barrio de ${municipalConfig.municipality.shortName}.`); }
function requestCurrentLocation() {
  state.mode = 'report-location-choice';
  if (window.isSecureContext === false) {
    bot('📍 Para obtener tu ubicación automáticamente, abre este chatbot desde una conexión segura HTTPS. Puedes escribir una dirección o referencia.');
    return showLocationRetryOptions();
  }
  if (!navigator.geolocation) {
    bot('📍 Este dispositivo o navegador no permite obtener la ubicación automáticamente. Puedes escribir una dirección o referencia.');
    return showLocationRetryOptions();
  }
  bot('📍 Solicitando permiso para acceder a tu ubicación...');
  navigator.geolocation.getCurrentPosition((position) => {
    const { latitude, longitude, accuracy } = position.coords;
    state.report.latitude = latitude;
    state.report.longitude = longitude;
    state.report.accuracy = accuracy;
    state.report.locationSource = 'browser_geolocation';
    state.report.locationText = 'Ubicación GPS proporcionada';
    bot('📍 Ubicación obtenida correctamente.\n\nTu ubicación se ha añadido al reporte.');
    askDescription();
  }, (error) => {
    bot(translateGeolocationError(error));
    showLocationRetryOptions();
  }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
}
function askManualLocation() { state.mode = 'report-manual-location'; bot(`✍️ Escribe la dirección, calle, referencia o punto cercano dentro de ${municipalConfig.municipality.shortName}.`); }
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
  bot(`✅ Revisa tu reporte antes de generar el folio:\n\n**Tipo:** Incidencia\n**Categoría:** ${state.report.category}\n**Sector:** ${state.report.sector}\n**Ubicación:** ${state.report.locationText}\n**Descripción:** ${state.report.description}\n**Evidencia:** ${evidenceLabel}`);
  quickReplies([['✅ Confirmar reporte', 'report:confirm'], ['✏️ Corregir información', 'report:correct'], ['↩️ Volver', conversationIntents.MAIN_MENU]]);
}
async function confirmReport() {
  if (state.integrationMode === 'REAL' && state.institution?.id) {
    try {
      const rows = await createCitizenTicket({ institutionId: state.institution.id, category: state.report.category, description: state.report.description, sector: state.report.sector, locationText: state.report.locationText, latitude: state.report.latitude, longitude: state.report.longitude, evidencePath: null });
      const result = Array.isArray(rows) ? rows[0] : rows;
      state.mode = 'menu';
      bot(`✅ REPORTE CREADO\n\nFolio: ${result.public_id}\nCódigo de seguimiento: ${result.tracking_secret}\nCategoría: ${state.report.category}\nSector: ${state.report.sector}\nUbicación: ${state.report.locationText}\nEstado: Recibido\n\nGuarda tu folio para consultar el estado de tu reporte. La fotografía no fue enviada en este entorno.`);
      return ticketActions();
    } catch (error) {
      bot(`⚠️ Backend no disponible en este momento: ${error.message || 'No fue posible crear el ticket real.'} Usaré fallback demo claramente identificado.`);
    }
  }
  const folio = `LS-${new Date().toISOString().slice(2, 10).replaceAll('-', '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  const tracking = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  state.mode = 'menu';
  bot(`✅ REPORTE DEMO CREADO\n\nFolio demo: ${folio}\nCódigo de seguimiento demo: ${tracking}\nCategoría: ${state.report.category}\nSector: ${state.report.sector}\nUbicación: ${state.report.locationText}\nEstado: Recibido\n\nGuarda tu folio para consultar el estado de tu reporte. La fotografía no fue enviada en este entorno.`);
  ticketActions();
}
function startReportCorrection() { bot('✏️ Corregiremos el reporte desde el inicio para evitar datos inconsistentes.'); startReport(); }
function startTicketLookup() { state.mode = 'ticket-lookup'; bot('🎫 Escribe tu folio de incidencia o solicitud para consultar el estado.\n\nEjemplos demo: LS-260715-0001 o SOL-2026-00142'); }
function backMenu() { quickReplies([['🏠 Menú principal', conversationIntents.MAIN_MENU]]); }
function ticketActions() { quickReplies([['🏠 Menú principal', conversationIntents.MAIN_MENU], ['🎫 Consultar mi reporte o solicitud', conversationIntents.LOOKUP_TICKET]]); }
function municipalityBackMenu() { quickReplies([['🏛️ Volver a Conoce tu municipio', conversationIntents.KNOW_MUNICIPALITY], ['🏠 Menú principal', conversationIntents.MAIN_MENU]]); }

function handleText() {
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  user(text);
  if (state.mode === 'report-other-sector') { return selectSector(text); }
  if (state.mode === 'service-other-sector') { return selectServiceSector(text); }
  if (state.mode === 'service-manual-location') { state.serviceRequest.locationText = text; state.serviceRequest.locationSource = 'manual-address'; return askServiceDetails(); }
  if (state.mode === 'service-description' || state.mode === 'service-lighting-reference') { state.serviceRequest.description = text; return askServiceEvidence(); }
  if (state.mode === 'service-cert-applicant') { state.serviceRequest.details.applicant = text; return askCertificationRequirements(); }
  if (state.mode === 'service-cert-requirements') { state.serviceRequest.description = text; return askServiceContact(); }
  if (state.mode === 'service-space-date') { if (isPastDate(text)) { bot('⚠️ Esa fecha ya pasó. Selecciona o escribe una fecha futura para continuar.'); return askSpaceUseDate(); } state.serviceRequest.details.date = text; return askSpaceUseTime(); }
  if (state.mode === 'service-space-time') { state.serviceRequest.details.time = text; return askSpaceUsePurpose(); }
  if (state.mode === 'service-space-purpose') { state.serviceRequest.details.purpose = text; return askSpaceUsePeople(); }
  if (state.mode === 'service-space-people') { state.serviceRequest.details.people = text; return askServiceContact(); }
  if (state.mode === 'service-contact') { state.serviceRequest.citizenContact = text; return showServiceSummary(); }
  if (state.mode === 'report-manual-location') { state.report.locationText = text; state.report.locationSource = 'manual-address'; return askDescription(); }
  if (state.mode === 'report-description') { state.report.description = text; return askEvidence(); }
  if (state.mode === 'ticket-lookup') { state.mode = 'menu'; bot(`🔎 Resultado demo para ${text.toUpperCase()}\n\nTipo de caso: ${text.toUpperCase().startsWith('SOL-') ? 'Solicitud de servicio' : 'Incidencia'}\nFolio: ${text.toUpperCase()}\nServicio/incidencia: Demo configurable\nEstado actual: 🟡 Recibido\nÚltima actualización: DEMO_ONLY\nSiguiente paso: seguimiento municipal según estado\nCanal: Conversacional V1.1\nNota: la consulta real se conectará al backend sin depender del canal WhatsApp o web.`); backMenu(); return; }
  bot('🤖 Puedo ayudarte desde el menú principal con reportes, consulta de reportes, Conoce tu municipio, contactos y horarios.');
  backMenu();
}

function handleEvidenceSelection(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const validation = validateEvidenceFile(file);
  const previewUrl = file.type?.startsWith('image/') ? URL.createObjectURL(file) : '';
  if (state.mode === 'service-evidence') { state.serviceRequest.evidence = { name: file.name, type: file.type || 'application/octet-stream', size: file.size, previewUrl }; state.serviceRequest.evidenceValidation = validation; bot('📸 Evidencia seleccionada para la solicitud; no fue enviada en este entorno.'); return showServiceSummary(); }
  state.report.evidence = { name: file.name, type: file.type || 'application/octet-stream', size: file.size, previewUrl };
  state.report.evidenceValidation = validation;
  bot(`📸 La fotografía fue seleccionada, pero el envío de evidencia aún no está disponible en este entorno.`);
  if (previewUrl) card({ title: 'Vista previa local de evidencia', image: previewUrl, body: 'Esta imagen solo existe localmente en tu navegador y no fue enviada.' });
  showReportSummary();
}

dateInput.addEventListener('change', () => {
  if (!dateInput.value) return;
  if (isPastDate(dateInput.value)) {
    bot('⚠️ Esa fecha ya pasó. Puedes corregirla con el calendario.');
    dateInput.value = '';
    return askSpaceUseDate();
  }
  state.serviceRequest.details.date = dateInput.value;
  user(formatDateForSummary(dateInput.value));
  askSpaceUseTime();
});
timeInput.addEventListener('change', () => {
  if (!timeInput.value) return;
  state.serviceRequest.details.time = timeInput.value;
  user(formatTimeForSummary(timeInput.value));
  askSpaceUsePurpose();
});
send.addEventListener('click', handleText);
input.addEventListener('keydown', (event) => { if (event.key === 'Enter') handleText(); });
evidenceInput.addEventListener('change', handleEvidenceSelection);
