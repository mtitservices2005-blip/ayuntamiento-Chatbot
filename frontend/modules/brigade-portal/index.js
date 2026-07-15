export const moduleId = 'brigade-portal';

const DEMO_FLAG = 'Datos demo · no producción';
const STATUS_FLOW = ['assigned', 'in_progress', 'pending_verification'];
const STATUS_LABELS = {
  assigned: 'Asignado',
  in_progress: 'En progreso',
  pending_verification: 'Pendiente de verificación',
};

const demoBrigade = {
  name: 'Brigada Vial 02',
  members: ['Ana López · supervisora', 'Carlos Ruiz · operador', 'María Pérez · evidencias', 'Jorge Díaz · apoyo vial'],
  operativeStatus: 'En campo · turno matutino',
  base: 'Base Central de Servicios Públicos',
};

const integrationNotes = [
  'Supabase Auth: sustituir contexto demo por sesión de brigada autenticada.',
  'RLS multiinstitución: filtrar tickets por institution_id y brigade_id.',
  'Tickets V1.1: consumir vistas/RPC existentes sin modificar contratos V1.',
  'Storage: subir evidencias a buckets con políticas RLS y metadatos de auditoría.',
  'Realtime: escuchar cambios de asignación, comentarios y verificación.',
  'GPS: registrar llegada y ruta con consentimiento del operador.',
  'Auditoría: bitácora append-only para cada acción operativa.',
  'Notificaciones: avisos push/SMS para nuevas asignaciones y rechazos.',
];

const demoTickets = [
  {
    folio: 'CM-BR-2026-0214',
    category: 'Bacheo y vialidades',
    location: 'Blvd. Municipal y Calle Roble',
    address: 'Blvd. Municipal 1450, Col. Las Flores',
    coordinates: '19.4326, -99.1332',
    priority: 'Crítica',
    date: '2026-07-15 08:20 UTC',
    status: 'assigned',
    brigade: 'Brigada Vial 02',
    description: 'Bache profundo en carril derecho con riesgo para motociclistas. Se requiere señalización temporal, relleno y evidencia fotográfica del cierre.',
    evidence: ['Foto ciudadana demo del bache', 'Croquis demo del punto de riesgo'],
    comments: ['Supervisor: priorizar por cercanía a escuela.', 'Cabina: ciudadano solicita avance antes de las 14:00.'],
    timeline: [
      ['08:20', 'Ticket asignado', 'Supervisor asignó el folio a Brigada Vial 02.'],
      ['08:22', 'Ruta sugerida', 'Se generó ruta demo sin usar APIs externas.'],
    ],
  },
  {
    folio: 'CM-BR-2026-0213',
    category: 'Alumbrado público',
    location: 'Parque Central, acceso norte',
    address: 'Parque Central s/n, Centro',
    coordinates: '19.4341, -99.1308',
    priority: 'Alta',
    date: '2026-07-15 07:55 UTC',
    status: 'in_progress',
    brigade: 'Brigada Vial 02',
    description: 'Poste con luminaria intermitente junto al cruce peatonal. Validar cableado visible y reportar si requiere apoyo eléctrico especializado.',
    evidence: ['Foto demo de luminaria', 'Referencia demo de poste'],
    comments: ['Operador: unidad en camino.', 'Supervisor: documentar antes/después.'],
    timeline: [
      ['07:55', 'Ticket asignado', 'Asignado por cercanía de cuadrilla.'],
      ['08:05', 'Trabajo iniciado', 'La brigada aceptó el servicio.'],
    ],
  },
  {
    folio: 'CM-BR-2026-0212',
    category: 'Recolección de residuos',
    location: 'Mercado Municipal, andén 3',
    address: 'Calle Hidalgo 300, Centro',
    coordinates: '19.4312, -99.1364',
    priority: 'Media',
    date: '2026-07-15 07:10 UTC',
    status: 'pending_verification',
    brigade: 'Brigada Vial 02',
    description: 'Retiro de residuos voluminosos en zona de carga. La evidencia demo ya fue marcada como enviada a verificación.',
    evidence: ['Foto demo antes', 'Foto demo después'],
    comments: ['Brigada: retiro completado.', 'Supervisor: pendiente validar evidencia.'],
    timeline: [
      ['07:10', 'Ticket asignado', 'Folio recibido en la bandeja de brigada.'],
      ['07:35', 'Llegada marcada', 'Ubicación confirmada en demo.'],
      ['08:00', 'En verificación', 'Evidencia simulada enviada a supervisor.'],
    ],
  },
  {
    folio: 'CM-BR-2026-0211',
    category: 'Agua y drenaje',
    location: 'Calle Morelos 224',
    address: 'Calle Morelos 224, Barrio Sur',
    coordinates: '19.4298, -99.1390',
    priority: 'Alta',
    date: '2026-07-15 06:45 UTC',
    status: 'assigned',
    brigade: 'Brigada Vial 02',
    description: 'Reporte de fuga menor en banqueta. Validar si corresponde a intervención de agua o canalizar a cuadrilla especializada.',
    evidence: ['Foto demo de humedad en banqueta'],
    comments: ['Cabina: posible canalización a Agua 01.'],
    timeline: [['06:45', 'Ticket asignado', 'Se agregó a la ruta demo de la brigada.']],
  },
];

let stylesInjected = false;
let tickets = [];
let selectedFolio = '';
let online = typeof navigator === 'undefined' ? true : navigator.onLine;
let syncQueue = [];
let previewName = '';
let resolutionComment = '';

export function mount(container, context = {}) {
  if (!container) throw new Error('A mount container is required for brigade-portal.');
  injectStyles();
  tickets = demoTickets.map((ticket) => ({ ...ticket, timeline: [...ticket.timeline], comments: [...ticket.comments], evidence: [...ticket.evidence] }));
  selectedFolio = context.initialFolio ?? tickets[0].folio;
  online = typeof navigator === 'undefined' ? true : navigator.onLine;
  syncQueue = [];
  previewName = '';
  resolutionComment = '';
  container.dataset.v2Module = moduleId;
  render(container, context);
  wireInteractions(container, context);
}

function render(container, context = {}) {
  const selected = getSelectedTicket();
  container.innerHTML = `
    <section class="bp-shell" aria-label="Portal de Brigadas V2">
      <header class="bp-hero">
        <nav class="bp-nav" aria-label="Navegación de brigada">
          <div class="bp-brand"><span aria-hidden="true">BR</span><div><strong>${context.municipalityName ?? 'Ayuntamiento Demo de Saibot'}</strong><small>Portal de Brigadas V2 · ${DEMO_FLAG}</small></div></div>
          <div class="bp-nav-actions"><a href="#tickets">Tickets</a><a href="#detalle">Detalle</a><a href="#offline">Offline</a></div>
        </nav>
        <div class="bp-hero-grid">
          <div>
            <span class="bp-badge">Interfaz móvil para campo</span>
            <h1>${demoBrigade.name}</h1>
            <p>Tablero táctil para aceptar servicios, marcar llegada, documentar evidencia y enviar tickets a verificación sin afectar producción.</p>
            <div class="bp-member-list">${demoBrigade.members.map((member) => `<span>${member}</span>`).join('')}</div>
          </div>
          <aside class="bp-status-card">
            <span class="bp-connection ${online ? 'online' : 'offline'}" data-connection>${online ? 'Online' : 'Offline'}</span>
            <strong>${demoBrigade.operativeStatus}</strong>
            <p>${demoBrigade.base}</p>
            <small>${DEMO_FLAG}</small>
          </aside>
        </div>
      </header>

      <main class="bp-main">
        <section class="bp-kpis" aria-label="Resumen de brigada">${renderKpis()}</section>
        <section class="bp-panel bp-offline ${online ? '' : 'is-offline'}" id="offline" aria-live="polite">
          <div><span class="bp-badge">Modo offline demo</span><h2>${online ? 'Conexión disponible' : 'Trabajo sin conexión'}</h2><p>${online ? 'Las acciones demo se muestran como listas para sincronización futura.' : 'Puedes continuar registrando acciones demo; no existe persistencia offline real todavía.'}</p></div>
          <div class="bp-sync-box"><strong data-sync-count>${syncQueue.length}</strong><span>acciones pendientes</span><button type="button" data-sync>Reintentar sincronización</button></div>
        </section>

        <section class="bp-panel" id="tickets">
          <div class="bp-section-head"><div><span class="bp-badge">Tickets asignados · ${DEMO_FLAG}</span><h2>Bandeja operativa</h2></div></div>
          <div class="bp-filters">
            <input data-search placeholder="Buscar folio, ubicación o brigada" aria-label="Buscar tickets">
            <select data-filter="status"><option value="">Estado: todos</option>${options('status')}</select>
            <select data-filter="priority"><option value="">Prioridad: todas</option>${options('priority')}</select>
            <select data-filter="category"><option value="">Categoría: todas</option>${options('category')}</select>
          </div>
          <div class="bp-ticket-list" data-ticket-list>${renderTicketList(tickets)}</div>
        </section>

        <section class="bp-detail-layout" id="detalle">
          <article class="bp-panel bp-detail" data-detail>${renderDetail(selected)}</article>
          <aside class="bp-panel bp-map-card">
            <span class="bp-badge">Geolocalización demo</span><h2>Ubicación y ruta</h2>
            <div class="bp-map" role="img" aria-label="Mapa placeholder sin APIs externas"><span class="bp-pin">●</span><small>GIS/GPS ready</small></div>
            <dl><div><dt>Dirección</dt><dd>${selected.address}</dd></div><div><dt>Coordenadas demo</dt><dd>${selected.coordinates}</dd></div></dl>
            <button class="bp-primary" type="button" data-route>Abrir ruta</button>
            <p class="bp-muted">Placeholder profesional sin API keys, costos ni servicios externos.</p>
          </aside>
        </section>

        <section class="bp-panel">
          <span class="bp-badge">Integración futura</span><h2>Puntos preparados</h2>
          <ul class="bp-integrations">${integrationNotes.map((note) => `<li>${note}</li>`).join('')}</ul>
        </section>
      </main>
    </section>`;
  refreshFilters(container);
}

function renderKpis() {
  const counts = {
    assigned: tickets.filter((ticket) => ticket.status === 'assigned').length,
    in_progress: tickets.filter((ticket) => ticket.status === 'in_progress').length,
    pending_verification: tickets.filter((ticket) => ticket.status === 'pending_verification').length,
  };
  const kpis = [
    ['Tickets asignados', tickets.length, 'ruta activa'],
    ['En progreso', counts.in_progress, 'servicios iniciados'],
    ['Pendientes de verificación', counts.pending_verification, 'requieren supervisor'],
    ['Resueltos hoy', 3, 'cierre demo'],
  ];
  return kpis.map(([label, value, hint]) => `<article><span>${DEMO_FLAG}</span><strong>${value}</strong><p>${label}</p><small>${hint}</small></article>`).join('');
}

function renderTicketList(items) {
  return items.map((ticket) => `<article class="bp-ticket ${ticket.folio === selectedFolio ? 'is-selected' : ''}" data-ticket-card data-ticket="${ticket.folio}" data-status="${ticket.status}" data-priority="${ticket.priority}" data-category="${ticket.category}">
    <div class="bp-ticket-main"><strong>${ticket.folio}</strong><span>${ticket.category}</span><small>${ticket.location}</small></div>
    <div class="bp-ticket-meta"><span class="bp-chip ${priorityClass(ticket.priority)}">${ticket.priority}</span><span class="bp-chip">${STATUS_LABELS[ticket.status]}</span><span>${ticket.date}</span><span>${ticket.brigade}</span></div>
    <button type="button" data-view-ticket="${ticket.folio}">Ver detalle</button>
  </article>`).join('');
}

function renderDetail(ticket) {
  const nextAction = ticket.status === 'assigned' ? 'Iniciar trabajo' : ticket.status === 'in_progress' ? 'Enviar a verificación' : 'Pendiente de supervisor';
  return `<span class="bp-badge">Detalle del ticket · ${DEMO_FLAG}</span><h2>${ticket.folio}</h2><p>${ticket.description}</p>
    <div class="bp-flow">${STATUS_FLOW.map((status) => `<span class="${flowClass(ticket.status, status)}">${STATUS_LABELS[status]}</span>`).join('<b>→</b>')}</div>
    <dl class="bp-detail-list"><div><dt>Categoría</dt><dd>${ticket.category}</dd></div><div><dt>Ubicación</dt><dd>${ticket.location}</dd></div><div><dt>Prioridad</dt><dd>${ticket.priority}</dd></div><div><dt>Estado actual</dt><dd data-current-status>${STATUS_LABELS[ticket.status]}</dd></div><div><dt>Fecha de creación</dt><dd>${ticket.date}</dd></div><div><dt>Brigada asignada</dt><dd>${ticket.brigade}</dd></div></dl>
    <div class="bp-actions"><button type="button" data-action="start" ${ticket.status !== 'assigned' ? 'disabled' : ''}>Iniciar trabajo</button><button type="button" data-action="arrive">Marcar llegada</button><button type="button" data-evidence-focus>Subir evidencia</button><button type="button" data-action="verify" ${ticket.status !== 'in_progress' ? 'disabled' : ''}>Enviar a verificación</button></div>
    <section class="bp-evidence"><h3>Evidencias demo</h3><div class="bp-evidence-grid">${ticket.evidence.map((item, index) => `<div><span>▧</span><strong>${item}</strong><small>Demo ${index + 1}</small></div>`).join('')}</div><label class="bp-file">Seleccionar imagen<input type="file" accept="image/*" data-evidence-input></label><div class="bp-preview" data-preview>${previewName ? `<strong>Vista previa demo</strong><span>${previewName}</span>` : 'Sin imagen seleccionada'}</div><label>Comentario de resolución<textarea data-resolution-comment rows="3" placeholder="Describe el trabajo realizado">${resolutionComment}</textarea></label><p class="bp-validation" data-validation></p></section>
    <section><h3>Timeline</h3><ol class="bp-timeline">${ticket.timeline.map(([time, title, detail]) => `<li><time>${time}</time><div><strong>${title}</strong><span>${detail}</span></div></li>`).join('')}</ol></section>
    <section><h3>Comentarios</h3><ul class="bp-comments">${ticket.comments.map((comment) => `<li>${comment}</li>`).join('')}</ul></section>
    <p class="bp-muted">Siguiente acción demo: ${nextAction}. No se persisten cambios reales en Supabase.</p>`;
}

function wireInteractions(container, context) {
  container.addEventListener('input', (event) => {
    if (event.target.matches('[data-search], [data-filter]')) refreshFilters(container);
    if (event.target.matches('[data-resolution-comment]')) resolutionComment = event.target.value;
  });
  container.addEventListener('change', (event) => {
    if (event.target.matches('[data-filter]')) refreshFilters(container);
    if (event.target.matches('[data-evidence-input]')) {
      previewName = event.target.files?.[0]?.name ?? 'imagen-demo-local.jpg';
      queue('evidencia seleccionada');
      updateDetail(container, context);
    }
  });
  container.addEventListener('click', (event) => {
    const view = event.target.closest('[data-view-ticket]');
    if (view) { selectedFolio = view.dataset.viewTicket; previewName = ''; resolutionComment = ''; updateDetail(container, context); return; }
    if (event.target.matches('[data-action="start"]')) advance(container, 'in_progress', 'Trabajo iniciado');
    if (event.target.matches('[data-action="arrive"]')) addTimeline(container, 'Llegada marcada');
    if (event.target.matches('[data-action="verify"]')) {
      const validation = container.querySelector('[data-validation]');
      if (!previewName || !resolutionComment.trim()) { validation.textContent = 'Para enviar a verificación demo selecciona evidencia y añade comentario de resolución.'; return; }
      advance(container, 'pending_verification', 'Evidencia enviada a verificación');
    }
    if (event.target.matches('[data-evidence-focus]')) container.querySelector('[data-evidence-input]')?.click();
    if (event.target.matches('[data-route]')) { queue('ruta abierta'); event.target.textContent = 'Ruta demo abierta'; }
    if (event.target.matches('[data-sync]')) { syncQueue = []; render(container, context); }
  });
  window.addEventListener('online', () => { online = true; render(container, context); });
  window.addEventListener('offline', () => { online = false; render(container, context); });
}

function getSelectedTicket() { return tickets.find((ticket) => ticket.folio === selectedFolio) ?? tickets[0]; }
function options(key) { return [...new Set(tickets.map((ticket) => ticket[key]))].map((value) => `<option value="${value}">${key === 'status' ? STATUS_LABELS[value] : value}</option>`).join(''); }
function priorityClass(priority) { return priority === 'Crítica' ? 'critical' : priority === 'Alta' ? 'high' : priority === 'Media' ? 'medium' : 'ok'; }
function flowClass(current, status) { return STATUS_FLOW.indexOf(status) <= STATUS_FLOW.indexOf(current) ? 'is-active' : ''; }
function queue(label) { syncQueue.push({ label, at: new Date().toISOString() }); }
function addTimeline(container, label) { const ticket = getSelectedTicket(); ticket.timeline.push(['Ahora', label, `${label} registrada como acción demo sin persistencia real.`]); queue(label); updateDetail(container); }
function advance(container, status, label) { const ticket = getSelectedTicket(); ticket.status = status; addTimeline(container, label); }
function updateDetail(container, context = {}) { render(container, context); document.getElementById('detalle')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

function refreshFilters(container) {
  const query = container.querySelector('[data-search]')?.value.toLowerCase() ?? '';
  const status = container.querySelector('[data-filter="status"]')?.value ?? '';
  const priority = container.querySelector('[data-filter="priority"]')?.value ?? '';
  const category = container.querySelector('[data-filter="category"]')?.value ?? '';
  container.querySelectorAll('[data-ticket-card]').forEach((card) => {
    const text = card.textContent.toLowerCase();
    card.hidden = Boolean((query && !text.includes(query)) || (status && card.dataset.status !== status) || (priority && card.dataset.priority !== priority) || (category && card.dataset.category !== category));
  });
}

function injectStyles() {
  if (stylesInjected) return;
  const style = document.createElement('style');
  style.textContent = `
    :root{color-scheme:light}.bp-shell{min-height:100vh;background:#edf4f8;color:#0f172a;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.bp-hero{background:linear-gradient(145deg,#06233f,#0f766e);color:white;padding:18px 16px 28px}.bp-nav,.bp-hero-grid,.bp-main{max-width:1180px;margin:auto}.bp-nav{display:flex;justify-content:space-between;gap:16px;align-items:center}.bp-brand{display:flex;gap:12px;align-items:center}.bp-brand>span{display:grid;place-items:center;width:48px;height:48px;border-radius:16px;background:#22c55e;color:#052e16;font-weight:900}.bp-brand small,.bp-muted{color:#64748b}.bp-hero .bp-brand small,.bp-hero p,.bp-hero small{color:#d8fff6}.bp-nav-actions{display:flex;gap:8px;flex-wrap:wrap}.bp-nav-actions a{color:white;text-decoration:none;padding:10px 14px;border:1px solid rgba(255,255,255,.28);border-radius:999px}.bp-hero-grid{display:grid;grid-template-columns:1.6fr .8fr;gap:20px;align-items:end;padding-top:34px}.bp-hero h1{font-size:clamp(2.1rem,8vw,4.6rem);line-height:.95;margin:10px 0}.bp-badge,.bp-chip{display:inline-flex;align-items:center;border-radius:999px;padding:6px 10px;font-size:.78rem;font-weight:800}.bp-badge{background:#dffdf1;color:#065f46}.bp-member-list{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}.bp-member-list span,.bp-status-card{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);border-radius:18px;padding:12px}.bp-status-card{display:grid;gap:8px}.bp-connection{justify-self:start;border-radius:999px;padding:8px 12px;font-weight:900}.bp-connection.online{background:#dcfce7;color:#166534}.bp-connection.offline{background:#fee2e2;color:#991b1b}.bp-main{padding:18px 16px 44px;display:grid;gap:18px}.bp-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.bp-kpis article,.bp-panel{background:white;border:1px solid #dbe6ef;box-shadow:0 18px 50px rgba(15,23,42,.08);border-radius:24px;padding:18px}.bp-kpis strong{display:block;font-size:2rem;margin-top:8px}.bp-kpis p,.bp-kpis small{margin:4px 0;color:#475569}.bp-offline{display:flex;justify-content:space-between;gap:14px;align-items:center}.bp-offline.is-offline{border-color:#fecaca;background:#fff7f7}.bp-sync-box{display:grid;gap:4px;text-align:center}.bp-sync-box strong{font-size:2rem}.bp-sync-box button,.bp-actions button,.bp-primary,.bp-ticket button{border:0;border-radius:14px;background:#0f766e;color:white;font-weight:900;padding:13px 16px;min-height:48px;cursor:pointer}.bp-section-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.bp-filters{display:grid;grid-template-columns:2fr repeat(3,1fr);gap:10px;margin:16px 0}.bp-filters input,.bp-filters select,textarea{border:1px solid #cbd5e1;border-radius:14px;padding:13px;background:white;font:inherit}.bp-ticket-list{display:grid;gap:10px}.bp-ticket{display:grid;grid-template-columns:1.2fr 2fr auto;gap:12px;align-items:center;border:1px solid #e2e8f0;border-radius:18px;padding:14px}.bp-ticket.is-selected{outline:3px solid #99f6e4}.bp-ticket-main,.bp-ticket-meta{display:grid;gap:4px}.bp-ticket-meta{grid-template-columns:repeat(4,auto);justify-content:start;align-items:center}.bp-chip{background:#e2e8f0;color:#334155}.bp-chip.critical{background:#fee2e2;color:#991b1b}.bp-chip.high{background:#ffedd5;color:#9a3412}.bp-chip.medium{background:#fef9c3;color:#854d0e}.bp-detail-layout{display:grid;grid-template-columns:1.5fr .8fr;gap:18px}.bp-detail h2{font-size:2rem;margin:.3rem 0}.bp-flow{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:16px 0}.bp-flow span{padding:10px 12px;border-radius:14px;background:#e2e8f0;font-weight:900}.bp-flow span.is-active{background:#0f766e;color:white}.bp-detail-list{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.bp-detail-list div,.bp-map-card dl div{background:#f8fafc;border-radius:14px;padding:12px}.bp-detail-list dt,.bp-map-card dt{font-size:.75rem;color:#64748b;text-transform:uppercase;font-weight:900}.bp-detail-list dd,.bp-map-card dd{margin:4px 0 0}.bp-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0}.bp-actions button:disabled{background:#cbd5e1;color:#64748b;cursor:not-allowed}.bp-evidence-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.bp-evidence-grid div,.bp-preview,.bp-comments li{background:#f1f5f9;border-radius:16px;padding:12px}.bp-file{display:block;margin:12px 0;border:2px dashed #14b8a6;border-radius:18px;padding:18px;text-align:center;font-weight:900;color:#0f766e}.bp-file input{display:none}.bp-preview{min-height:68px;display:grid;place-items:center;color:#475569}.bp-validation{color:#b91c1c;font-weight:800}.bp-timeline,.bp-comments,.bp-integrations{padding-left:18px}.bp-timeline li{margin:10px 0}.bp-timeline time{font-weight:900;color:#0f766e}.bp-map{height:240px;border-radius:22px;background:linear-gradient(135deg,#dbeafe,#ccfbf1),repeating-linear-gradient(45deg,transparent 0 16px,rgba(15,118,110,.1) 16px 18px);position:relative;display:grid;place-items:center;overflow:hidden}.bp-pin{font-size:4rem;color:#dc2626;text-shadow:0 8px 20px rgba(0,0,0,.2)}.bp-map small{position:absolute;right:14px;bottom:14px;background:white;border-radius:999px;padding:8px}.bp-integrations{columns:2}.bp-muted{font-size:.9rem}@media (max-width:850px){.bp-nav,.bp-hero-grid,.bp-offline,.bp-detail-layout{display:grid;grid-template-columns:1fr}.bp-kpis{grid-template-columns:repeat(2,1fr)}.bp-filters,.bp-actions,.bp-detail-list,.bp-evidence-grid{grid-template-columns:1fr}.bp-ticket{grid-template-columns:1fr}.bp-ticket-meta{grid-template-columns:1fr 1fr}.bp-integrations{columns:1}.bp-nav-actions a,.bp-ticket button,.bp-actions button,.bp-primary{width:100%;font-size:1rem}.bp-hero{padding-bottom:18px}}@media (max-width:480px){.bp-kpis{grid-template-columns:1fr}.bp-panel,.bp-kpis article{border-radius:18px;padding:14px}.bp-hero h1{font-size:2.4rem}}`;
  document.head.appendChild(style);
  stylesInjected = true;
}
