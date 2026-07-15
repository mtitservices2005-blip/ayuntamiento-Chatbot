export const moduleId = 'notifications';

const STATUSES = {
  queued: { label: 'En cola', icon: '⏳', tone: 'neutral' },
  processing: { label: 'Procesando', icon: '⚙️', tone: 'info' },
  sent: { label: 'Enviada', icon: '📤', tone: 'primary' },
  delivered: { label: 'Entregada', icon: '✅', tone: 'success' },
  failed: { label: 'Fallida', icon: '⚠️', tone: 'danger' },
  retrying: { label: 'Reintentando', icon: '🔁', tone: 'warning' },
  cancelled: { label: 'Cancelada', icon: '🛑', tone: 'muted' }
};

const channels = [
  { id: 'internal', name: 'Notificación interna', status: 'Operativo demo', configured: true, availability: '99.9%', last: '2026-07-15 14:35', delivery: '99%' },
  { id: 'email', name: 'Email', status: 'Sandbox visual', configured: false, availability: '98.7%', last: '2026-07-15 13:50', delivery: '96%' },
  { id: 'whatsapp', name: 'WhatsApp', status: 'No conectado', configured: false, availability: 'Demo', last: 'Sin actividad real', delivery: '94%' },
  { id: 'sms', name: 'SMS', status: 'No conectado', configured: false, availability: 'Demo', last: 'Sin actividad real', delivery: '91%' }
];

const institutions = ['Municipio Centro', 'Agua Norte', 'Servicios Urbanos Sur'];
const events = ['Ticket creado', 'Ticket recibido', 'Ticket asignado', 'Brigada en camino', 'Trabajo iniciado', 'Evidencia agregada', 'Pendiente de verificación', 'Ticket aprobado', 'Ticket devuelto a brigada', 'Ticket resuelto', 'Ticket reabierto'];
const recipients = ['Ciudadano', 'Brigada', 'Supervisor', 'Administrador municipal', 'MT IT Services'];
const variables = ['{{citizen_name}}', '{{ticket_folio}}', '{{ticket_status}}', '{{institution_name}}', '{{brigade_name}}', '{{category}}', '{{location}}', '{{tracking_url}}'];

let notifications = [
  { id: 'NTF-2401', event: 'Ticket creado', recipient: 'Ana López', role: 'Ciudadano', institution: 'Municipio Centro', channel: 'Email', created: '2026-07-15 09:10', sent: '2026-07-15 09:11', status: 'delivered', template: 'Ciudadano · ticket creado', ticket: 'TK-10291', attempts: 1, correlation: 'demo-corr-7f81', error: '' },
  { id: 'NTF-2402', event: 'Ticket asignado', recipient: 'Brigada Bacheo 2', role: 'Brigada', institution: 'Municipio Centro', channel: 'Notificación interna', created: '2026-07-15 09:30', sent: '2026-07-15 09:30', status: 'sent', template: 'Brigada · asignación', ticket: 'TK-10291', attempts: 1, correlation: 'demo-corr-8a22', error: '' },
  { id: 'NTF-2403', event: 'Pendiente de verificación', recipient: 'Supervisor Zona 4', role: 'Supervisor', institution: 'Agua Norte', channel: 'Notificación interna', created: '2026-07-15 10:12', sent: '2026-07-15 10:13', status: 'processing', template: 'Supervisor · verificar', ticket: 'TK-10302', attempts: 1, correlation: 'demo-corr-19ad', error: '' },
  { id: 'NTF-2404', event: 'Ticket resuelto', recipient: 'Carlos Méndez', role: 'Ciudadano', institution: 'Servicios Urbanos Sur', channel: 'WhatsApp', created: '2026-07-15 11:00', sent: '2026-07-15 11:02', status: 'failed', template: 'Ciudadano · resuelto', ticket: 'TK-10308', attempts: 2, correlation: 'demo-corr-5e10', error: 'Proveedor demo no configurado; no se envió mensaje real.' },
  { id: 'NTF-2405', event: 'Evidencia agregada', recipient: 'Admin Municipal', role: 'Administrador municipal', institution: 'Municipio Centro', channel: 'Email', created: '2026-07-15 12:44', sent: 'Pendiente', status: 'queued', template: 'Admin · evidencia', ticket: 'TK-10311', attempts: 0, correlation: 'demo-corr-6bc1', error: '' }
];

let templates = recipients.map((role, i) => ({ id: `TPL-${i + 1}`, role, channel: channels[i % channels.length].name, active: i !== 4, language: 'Español · futuro multiidioma', name: `${role} · actualización de ticket`, body: `Hola {{citizen_name}}, el ticket {{ticket_folio}} en {{institution_name}} cambió a {{ticket_status}}. Seguimiento: {{tracking_url}}` }));

let rules = [
  { id: 'R-01', event: 'Ticket creado', to: 'Ciudadano', channel: 'Notificación interna + Email', template: 'Ciudadano · ticket creado', delay: '0 min', priority: 'Alta', active: true },
  { id: 'R-02', event: 'Ticket asignado', to: 'Brigada', channel: 'Notificación interna', template: 'Brigada · asignación', delay: '0 min', priority: 'Alta', active: true },
  { id: 'R-03', event: 'Pendiente de verificación', to: 'Supervisor', channel: 'Notificación interna', template: 'Supervisor · verificar', delay: '5 min', priority: 'Media', active: true },
  { id: 'R-04', event: 'Ticket resuelto', to: 'Ciudadano', channel: 'WhatsApp + Email', template: 'Ciudadano · resuelto', delay: '0 min', priority: 'Alta', active: false }
];

function badge(status) {
  const item = STATUSES[status] ?? STATUSES.queued;
  return `<span class="ntf-badge ${item.tone}" aria-label="Estado ${item.label}">${item.icon} ${item.label}</span>`;
}

function renderPreview(template) {
  return template.replaceAll('{{citizen_name}}', 'Ana López').replaceAll('{{ticket_folio}}', 'TK-DEMO-2048').replaceAll('{{ticket_status}}', 'Pendiente de verificación').replaceAll('{{institution_name}}', 'Municipio Centro').replaceAll('{{brigade_name}}', 'Brigada Bacheo 2').replaceAll('{{category}}', 'Alumbrado').replaceAll('{{location}}', 'Av. Principal 123').replaceAll('{{tracking_url}}', 'https://demo.local/tickets/TK-DEMO-2048');
}

export function mount(container, context = {}) {
  if (!container) throw new Error('A mount container is required for notifications.');
  container.dataset.v2Module = moduleId;
  container.innerHTML = `<style>${styles()}</style><section class="ntf-shell"><header class="ntf-hero"><div><p class="ntf-demo">Datos demo · no producción</p><h1>Centro de Notificaciones V2</h1><p>Comunicaciones multiinstitución para tickets, brigadas, usuarios y alertas operativas. No envía mensajes reales ni conecta proveedores externos.</p></div><div class="ntf-context"><label>Institución activa<select id="institutionSelect">${institutions.map(i => `<option>${i}</option>`).join('')}</select></label><label>Rol demo<select id="roleSelect"><option>mt_superadmin</option><option>municipal_admin</option><option>supervisor</option></select></label></div></header><nav class="ntf-tabs" aria-label="Secciones de notificaciones">${['Resumen','Bandeja','Plantillas','Reglas','Canales','Preferencias','Simulador','Historial','Estado operativo'].map((t, i) => `<button class="${i ? '' : 'active'}" data-tab="${t}">${t}</button>`).join('')}</nav><main id="ntfContent"></main></section>`;
  const state = { tab: 'Resumen', selected: notifications[0], history: [] };
  const content = container.querySelector('#ntfContent');
  const draw = () => { content.innerHTML = renderTab(state); bind(container, state, draw); };
  container.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => { container.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('active')); btn.classList.add('active'); state.tab = btn.dataset.tab; draw(); }));
  draw();
}

function renderTab(state) {
  if (state.tab === 'Bandeja') return inbox(state);
  if (state.tab === 'Plantillas') return templatesView();
  if (state.tab === 'Reglas') return rulesView();
  if (state.tab === 'Canales') return channelsView();
  if (state.tab === 'Preferencias') return preferencesView();
  if (state.tab === 'Simulador') return simulatorView();
  if (state.tab === 'Historial') return historyView(state);
  if (state.tab === 'Estado operativo') return operationalView();
  return summaryView();
}

function summaryView() { return `<section class="ntf-grid kpis">${[['Enviadas hoy','128'],['Pendientes','14'],['Entregadas','109'],['Fallidas','5'],['Tasa de entrega','96.1%'],['Tiempo promedio','42s'],['WhatsApp','23'],['Email','61'],['SMS','9'],['Internas','35']].map(([k,v])=>`<article><span>${k}</span><strong>${v}</strong><div class="bar"><i style="width:${Math.min(parseInt(v)||70,100)}%"></i></div></article>`).join('')}</section><section class="panel"><h2>Eventos del ciclo de tickets</h2><div class="event-grid">${events.map(e=>`<button data-event="${e}">${e}<small>Destinatarios y canales demo</small></button>`).join('')}</div><p class="note">Aislamiento real por institución deberá aplicarse con backend, Auth y RLS; el frontend solo ilustra el contexto activo.</p></section>`; }

function inbox(state) { return `<section class="panel filters"><input id="searchBox" placeholder="Buscar folio, evento, destinatario"><select id="statusFilter"><option value="">Todos los estados</option>${Object.keys(STATUSES).map(s=>`<option>${s}</option>`).join('')}</select><select id="channelFilter"><option value="">Todos los canales</option>${channels.map(c=>`<option>${c.name}</option>`).join('')}</select><select id="instFilter"><option value="">Todas las instituciones</option>${institutions.map(i=>`<option>${i}</option>`).join('')}</select><select id="eventFilter"><option value="">Todos los eventos</option>${events.map(e=>`<option>${e}</option>`).join('')}</select></section><section class="ntf-two"><div class="panel"><h2>Bandeja de actividad</h2><div id="notificationList">${notificationRows(notifications)}</div></div>${detailView(state.selected)}</section>`; }
function notificationRows(items) { return items.map(n=>`<button class="row" data-id="${n.id}"><b>${n.id}</b><span>${n.event}</span><span>${n.recipient}</span><span>${n.institution}</span><span>${n.channel}</span><time>${n.created}</time>${badge(n.status)}<em>Ver detalle</em></button>`).join('') || '<p>No hay resultados demo.</p>'; }
function detailView(n) { return `<aside class="panel detail"><h2>Detalle ${n.id}</h2><p class="ntf-demo">Datos demo · no producción</p><dl><dt>Evento origen</dt><dd>${n.event}</dd><dt>Ticket relacionado</dt><dd>${n.ticket}</dd><dt>Institución</dt><dd>${n.institution}</dd><dt>Destinatario</dt><dd>${n.recipient} · ${n.role}</dd><dt>Canal</dt><dd>${n.channel}</dd><dt>Plantilla</dt><dd>${n.template}</dd><dt>Contenido renderizado demo</dt><dd>${renderPreview('Hola {{citizen_name}}, el ticket {{ticket_folio}} está en {{ticket_status}} para {{institution_name}}.')}</dd><dt>Creación / envío</dt><dd>${n.created} / ${n.sent}</dd><dt>Estado</dt><dd>${badge(n.status)}</dd><dt>Intentos</dt><dd>${n.attempts}</dd><dt>Correlation ID</dt><dd>${n.correlation}</dd><dt>Error demo</dt><dd>${n.error || 'Sin error demo'}</dd></dl><ol class="timeline"><li>Notificación creada</li><li>Regla aplicada</li><li>Plantilla renderizada</li><li>Envío iniciado</li><li>${STATUSES[n.status].label}</li></ol><div class="actions"><button data-action="retry">Reintentar demo</button><button>Ver ticket relacionado</button><button>Ver institución</button><button data-action="copy">Copiar contenido</button><button>Marcar como revisada</button></div></aside>`; }

function templatesView() { return `<section class="panel"><h2>Plantillas demo</h2><p>Variables: ${variables.map(v=>`<code>${v}</code>`).join(' ')}</p><div class="cards">${templates.map(t=>`<article><h3>${t.name}</h3><p>${t.role} · ${t.channel} · ${t.language}</p><textarea>${t.body}</textarea><p><b>Vista previa:</b> ${renderPreview(t.body)}</p><button>${t.active?'Desactivar':'Activar'}</button><button>Duplicar</button><button>Vista previa</button></article>`).join('')}</div></section>`; }
function rulesView() { return `<section class="panel"><h2>Reglas de envío demo</h2><button id="addRule">Crear regla demo</button><div class="cards">${rules.map(r=>`<article><h3>${r.event} → ${r.to}</h3><p>${r.channel} · ${r.template}</p><p>Retraso ${r.delay} · Prioridad ${r.priority}</p><button data-rule="${r.id}">${r.active?'Activa':'Inactiva'}</button><button>Editar demo</button></article>`).join('')}</div></section>`; }
function channelsView() { return `<section class="panel"><h2>Canales</h2><div class="cards">${channels.map(c=>`<article><h3>${c.name}</h3><p>${c.status}</p><p>${c.configured?'Configurado demo':'No configurado'}</p><p>Disponibilidad ${c.availability} · Última actividad ${c.last} · Entrega ${c.delivery}</p></article>`).join('')}</div><p class="note">No solicitar ni almacenar secretos reales. La integración debe hacerse en backend seguro o Edge Functions.</p></section>`; }
function preferencesView() { return `<section class="panel"><h2>Preferencias por rol</h2><div class="cards">${['Ciudadano','Brigade member','Supervisor','Municipal admin','MT superadmin'].map(r=>`<article><h3>${r}</h3>${channels.map(c=>`<label><input type="checkbox" checked> ${c.name}</label>`).join('')}<select multiple>${events.slice(0,5).map(e=>`<option selected>${e}</option>`).join('')}</select></article>`).join('')}</div><p class="note">Las preferencias reales deberán respetar consentimiento, privacidad y reglas aplicables.</p></section>`; }
function simulatorView() { return `<section class="panel simulator"><h2>Simulador · no enviado</h2>${[['Institución',institutions],['Evento',events],['Destinatario',recipients],['Canal',channels.map(c=>c.name)],['Plantilla',templates.map(t=>t.name)]].map(([l,arr])=>`<label>${l}<select>${arr.map(x=>`<option>${x}</option>`).join('')}</select></label>`).join('')}<div class="preview">${renderPreview(templates[0].body)}</div><button id="simulateSend">Simular envío</button><p id="simResult"></p></section>`; }
function historyView(state) { const base = ['Notificación creada','Regla aplicada','Plantilla renderizada','Envío iniciado','Entregada','Fallida','Reintento','Cancelada'].map((h,i)=>({h, by:i%2?'Sistema demo':'Usuario demo', at:`2026-07-15 1${i}:00`, corr:`demo-audit-${i}`, inst:institutions[i%3]})); return `<section class="panel"><h2>Historial y auditoría demo</h2><ol class="timeline">${[...state.history, ...base].map(x=>`<li><b>${x.h}</b> · ${x.by} · ${x.at} · ${x.corr} · ${x.inst}</li>`).join('')}</ol><p class="note">Preparado conceptualmente para Audit V2.</p></section>`; }
function operationalView() { return `<section class="panel"><h2>Estado operativo</h2><p>Salud global visible para mt_superadmin; administración institucional para municipal_admin; acceso operativo limitado para supervisor.</p><ul><li>Supabase Auth, Tickets V1.1, Institutions, Memberships y RLS: integración futura.</li><li>Realtime, Edge Functions, proveedores Email/WhatsApp/SMS y auditoría: no conectados en esta demo.</li><li>No usar service_role en frontend, no exponer secretos y no confiar en frontend para seguridad real.</li></ul></section>`; }

function bind(container, state, draw) {
  container.querySelectorAll('.row').forEach(row => row.addEventListener('click', () => { state.selected = notifications.find(n => n.id === row.dataset.id) || state.selected; draw(); }));
  ['searchBox','statusFilter','channelFilter','instFilter','eventFilter'].forEach(id => container.querySelector(`#${id}`)?.addEventListener('input', () => applyFilters(container)));
  container.querySelector('#simulateSend')?.addEventListener('click', () => { const entry = { h: 'Simulación · no enviado', by: 'Usuario demo', at: new Date().toISOString().slice(0,16).replace('T',' '), corr: `demo-sim-${Date.now()}`, inst: container.querySelector('#institutionSelect')?.value || institutions[0] }; state.history.unshift(entry); container.querySelector('#simResult').textContent = 'Simulación · no enviado. Entrada agregada al historial local del módulo.'; });
  container.querySelector('#addRule')?.addEventListener('click', () => { rules.unshift({ id:`R-${rules.length+1}`, event:'Ticket reabierto', to:'Supervisor', channel:'Notificación interna', template:'Supervisor · verificar', delay:'0 min', priority:'Media', active:true }); draw(); });
}
function applyFilters(container) { const q = (container.querySelector('#searchBox')?.value || '').toLowerCase(); const sf = container.querySelector('#statusFilter')?.value; const cf = container.querySelector('#channelFilter')?.value; const inf = container.querySelector('#instFilter')?.value; const ef = container.querySelector('#eventFilter')?.value; const items = notifications.filter(n => (!q || Object.values(n).join(' ').toLowerCase().includes(q)) && (!sf || n.status === sf) && (!cf || n.channel === cf) && (!inf || n.institution === inf) && (!ef || n.event === ef)); container.querySelector('#notificationList').innerHTML = notificationRows(items); }
function styles() { return `.ntf-shell{font-family:Inter,system-ui,sans-serif;color:#132238;background:#f5f7fb;padding:24px}.ntf-hero{display:flex;justify-content:space-between;gap:20px;background:linear-gradient(135deg,#102a43,#2563eb);color:white;border-radius:24px;padding:28px}.ntf-demo{font-weight:800;color:#fde68a;text-transform:uppercase;letter-spacing:.08em}.ntf-context,.filters,.simulator{display:grid;gap:12px}.ntf-context{grid-template-columns:1fr 1fr}.ntf-tabs{display:flex;gap:8px;overflow:auto;padding:16px 0}.ntf-tabs button,.actions button,.panel button{border:0;border-radius:999px;padding:10px 14px;background:#e0e7ff;color:#1e3a8a;font-weight:700;cursor:pointer}.ntf-tabs .active{background:#1d4ed8;color:white}.panel{background:white;border:1px solid #dbe3ef;border-radius:20px;padding:18px;box-shadow:0 10px 28px #0f172a12;margin-bottom:16px}.ntf-grid,.cards,.event-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px}.kpis article,.cards article{background:#fff;border:1px solid #dbe3ef;border-radius:18px;padding:16px}.kpis strong{display:block;font-size:2rem}.bar{height:8px;background:#e5e7eb;border-radius:999px}.bar i{display:block;height:100%;background:#22c55e;border-radius:999px}.ntf-two{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(320px,.8fr);gap:16px}.filters{grid-template-columns:repeat(5,minmax(150px,1fr))}.row{width:100%;display:grid;grid-template-columns:.7fr 1fr 1fr 1fr 1fr 1fr auto auto;gap:8px;align-items:center;text-align:left;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;margin:8px 0;padding:12px}.ntf-badge{border-radius:999px;padding:5px 9px;font-weight:800;white-space:nowrap}.success{background:#dcfce7;color:#166534}.danger{background:#fee2e2;color:#991b1b}.warning{background:#fef3c7;color:#92400e}.info{background:#dbeafe;color:#1e40af}.primary{background:#e0e7ff;color:#3730a3}.neutral,.muted{background:#e5e7eb;color:#374151}dt{font-weight:800}dd{margin:0 0 10px}.timeline{border-left:3px solid #93c5fd;padding-left:18px}.timeline li{margin:10px 0}textarea{width:100%;min-height:90px;border-radius:12px;border:1px solid #cbd5e1;padding:10px}.note{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:12px}select,input{border:1px solid #cbd5e1;border-radius:12px;padding:10px;width:100%}.preview{background:#f8fafc;border:1px dashed #94a3b8;border-radius:14px;padding:16px}@media(max-width:850px){.ntf-hero,.ntf-two{grid-template-columns:1fr;display:grid}.filters,.ntf-context{grid-template-columns:1fr}.row{grid-template-columns:1fr}.ntf-shell{padding:12px}}`; }
