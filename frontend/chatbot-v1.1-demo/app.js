import { municipalConfig } from '../shared/municipal-config.js';
import { conversationIntents } from '../shared/contracts/channel-contracts.js';

const chat = document.querySelector('#chat');
const input = document.querySelector('#message-input');
const send = document.querySelector('#send-button');
const state = { mode: 'menu', report: {}, ticket: null };

document.querySelector('#municipal-logo').src = municipalConfig.branding.logoUrl;
document.querySelector('#municipal-name').textContent = municipalConfig.municipality.name;
document.documentElement.style.setProperty('--wa-green', municipalConfig.branding.primaryColor);

defaultWelcome();

function defaultWelcome() {
  bot(`👋 ¡Hola! Soy el asistente virtual de ${municipalConfig.municipality.name}.\n\nEsta demo V1.1 conserva el flujo conversacional ciudadano pensado para WhatsApp.\n\n¿En qué puedo ayudarte hoy?`);
  quickReplies([
    ['🏛️ Conoce el municipio', conversationIntents.MUNICIPAL_HISTORY],
    ['👤 Conoce al alcalde', conversationIntents.MAYOR_PROFILE],
    ['👥 Conoce a la vicealcaldesa', conversationIntents.DEPUTY_MAYOR_PROFILE],
    ['📸 Lugares emblemáticos', conversationIntents.LANDMARKS],
    ['🚨 Reportar incidencia', conversationIntents.REPORT_INCIDENT],
    ['🎫 Consultar ticket', conversationIntents.LOOKUP_TICKET],
    ['📞 Contactos y horarios', conversationIntents.CONTACTS_AND_HOURS],
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
  if (payload === conversationIntents.MUNICIPAL_HISTORY) return showHistory();
  if (payload === conversationIntents.MAYOR_PROFILE) return showAuthority(municipalConfig.authorities.mayor);
  if (payload === conversationIntents.DEPUTY_MAYOR_PROFILE) return showAuthority(municipalConfig.authorities.deputyMayor);
  if (payload === conversationIntents.LANDMARKS) return showLandmarks();
  if (payload === conversationIntents.CONTACTS_AND_HOURS) return showContacts();
  if (payload === conversationIntents.REPORT_INCIDENT) return startReport();
  if (payload === conversationIntents.LOOKUP_TICKET) return startTicketLookup();
  if (payload.startsWith('category:')) return selectCategory(payload.replace('category:', ''));
}

function showHistory() {
  bot(`📜 ${municipalConfig.history.title}\n\n${municipalConfig.history.body}`);
  backMenu();
}
function showAuthority(authority) {
  card({
    title: `${authority.name}\n${authority.role}`,
    image: authority.photoUrl,
    body: `Período: ${authority.term}\n\nBiografía: ${authority.biography}\n\nTrayectoria: ${authority.career}\n\nMensaje institucional: ${authority.institutionalMessage}`,
    list: authority.functions,
  });
  backMenu();
}
function showLandmarks() {
  bot('📸 Lugares emblemáticos del municipio. Selecciona o revisa las tarjetas demo configurables:');
  municipalConfig.landmarks.forEach((place) => card({ title: place.name, image: place.photoUrl, body: place.description }));
  backMenu();
}
function showContacts() {
  const c = municipalConfig.contacts;
  bot(`📞 ${c.title}\n\nTeléfono: ${c.phone}\nCorreo: ${c.email}\nDirección: ${c.address}\nHorario: ${c.openingHours}`);
  backMenu();
}
function startReport() {
  state.mode = 'report-category';
  state.report = {};
  bot('🚨 Vamos a crear un reporte ciudadano. Selecciona el tipo de incidencia:');
  quickReplies(municipalConfig.reportCategories.map((category) => [category, `category:${category}`]));
}
function selectCategory(category) {
  state.report.category = category;
  state.mode = 'report-location';
  bot('📍 Escribe el sector, calle o punto de referencia donde ocurre la incidencia.');
}
function startTicketLookup() {
  state.mode = 'ticket-lookup';
  bot('🎫 Escribe tu número de ticket para consultar el estado.\n\nEjemplo demo: LS-260715-0001');
}
function backMenu() { quickReplies([['🏠 Menú principal', conversationIntents.MAIN_MENU]]); }

function handleText() {
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  user(text);
  if (state.mode === 'report-location') {
    state.report.location = text;
    state.mode = 'report-description';
    bot('📝 Describe brevemente qué está ocurriendo.');
    return;
  }
  if (state.mode === 'report-description') {
    state.report.description = text;
    state.mode = 'menu';
    const ticket = `DEMO-${Date.now().toString().slice(-6)}`;
    bot(`🎫 REPORTE DEMO CREADO\n\nTicket: ${ticket}\nCategoría: ${state.report.category}\nUbicación: ${state.report.location}\nDescripción: ${state.report.description}\nEstado: Recibido\n\nGuarda tu número de ticket para consultar el estado. En producción se registrará mediante el contrato independiente del canal.`);
    backMenu();
    return;
  }
  if (state.mode === 'ticket-lookup') {
    state.mode = 'menu';
    bot(`🔎 Resultado demo para ${text.toUpperCase()}\n\nEstado: 🟡 Recibido\nCanal: Conversacional V1.1\nNota: la consulta real se conectará al backend sin depender del canal WhatsApp o web.`);
    backMenu();
    return;
  }
  bot('🤖 Puedo ayudarte desde el menú principal con autoridades, historia, lugares, reportes, consulta de tickets, contactos y horarios.');
  backMenu();
}

send.addEventListener('click', handleText);
input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') handleText();
});
