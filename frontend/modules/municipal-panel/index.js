import { IMPACT_DEMO_NOTICE, ECONOMIC_DEMO_NOTICE, SCENARIO_DEMO_NOTICE, beforeAfterMetrics, economicAssumptions, impactFutureContract, impactTickets } from './impact-data.js';
import { applyImpactFilters, buildImpactSummary, compareValues } from './impact-calculations.js';

export const moduleId = 'municipal-panel';

const DEMO_FLAG = 'Datos demo · no producción';

const demoTickets = [
  {
    folio: 'CM-DEMO-2026-0108',
    category: 'Alumbrado público',
    location: 'Av. Hidalgo y Calle 5, Centro',
    date: '2026-07-14 08:45 UTC',
    priority: 'Alta',
    status: 'Nuevo',
    brigade: 'Sin asignar',
    description: 'Tres luminarias apagadas en el corredor peatonal frente al mercado municipal.',
    evidence: ['Foto demo de luminaria', 'Reporte ciudadano demo'],
    coordinates: { top: 28, left: 62 },
    timeline: [
      ['Ticket creado', 'Portal Ciudadano V2 registró el folio demo.'],
      ['Clasificación automática', 'Categoría sugerida: Alumbrado público.'],
    ],
  },
  {
    folio: 'CM-DEMO-2026-0107',
    category: 'Bacheo y vialidades',
    location: 'Blvd. Municipal, Col. Las Flores',
    date: '2026-07-14 07:20 UTC',
    priority: 'Crítica',
    status: 'En proceso',
    brigade: 'Brigada Vial 02',
    description: 'Bache profundo en carril derecho con riesgo para motociclistas y transporte público.',
    evidence: ['Foto demo del bache', 'Croquis demo de ubicación'],
    coordinates: { top: 48, left: 36 },
    timeline: [
      ['Ticket creado', 'Operador municipal validó el reporte demo.'],
      ['Ticket asignado', 'Supervisor asignó Brigada Vial 02.'],
      ['Brigada en camino', 'Unidad BV-02 marcó salida desde base central.'],
    ],
  },
  {
    folio: 'CM-DEMO-2026-0106',
    category: 'Recolección de residuos',
    location: 'Parque Lineal, Zona Norte',
    date: '2026-07-13 18:10 UTC',
    priority: 'Media',
    status: 'Pendiente de verificación',
    brigade: 'Limpia Norte',
    description: 'Contenedor desbordado después del evento comunitario del fin de semana.',
    evidence: ['Foto demo antes', 'Foto demo después'],
    coordinates: { top: 68, left: 70 },
    timeline: [
      ['Ticket creado', 'Folio demo generado desde atención ciudadana.'],
      ['Brigada asignada', 'Limpia Norte confirmó disponibilidad.'],
      ['Evidencia subida', 'La brigada adjuntó dos evidencias demo.'],
      ['Resolución pendiente de verificación', 'Supervisor debe validar el cierre.'],
    ],
  },
  {
    folio: 'CM-DEMO-2026-0105',
    category: 'Agua y drenaje',
    location: 'Calle Morelos 224, Barrio Sur',
    date: '2026-07-13 12:35 UTC',
    priority: 'Alta',
    status: 'Resuelto',
    brigade: 'Agua 01',
    description: 'Fuga menor en banqueta reparada con evidencia de cierre operativo.',
    evidence: ['Foto demo reparación', 'Acta demo de cierre'],
    coordinates: { top: 38, left: 22 },
    timeline: [
      ['Ticket creado', 'Reporte demo recibido.'],
      ['Brigada en sitio', 'Agua 01 inició reparación.'],
      ['Ticket cerrado', 'Supervisor validó evidencia demo.'],
    ],
  },
];

const demoBrigades = [
  { name: 'Brigada Vial 02', area: 'Bacheo', status: 'Ocupada', assigned: 4, operator: 'Unidad BV-02' },
  { name: 'Limpia Norte', area: 'Residuos', status: 'Ocupada', assigned: 3, operator: 'Unidad LN-04' },
  { name: 'Agua 01', area: 'Agua y drenaje', status: 'Disponible', assigned: 1, operator: 'Unidad AG-01' },
  { name: 'Alumbrado Centro', area: 'Alumbrado', status: 'Disponible', assigned: 2, operator: 'Unidad AL-03' },
];

const recentActivity = [
  ['08:45', 'Ticket creado', 'CM-DEMO-2026-0108 fue registrado como demo.'],
  ['08:50', 'Ticket asignado', 'CM-DEMO-2026-0107 quedó con Brigada Vial 02.'],
  ['09:05', 'Brigada en camino', 'Unidad BV-02 reportó traslado.'],
  ['09:20', 'Evidencia subida', 'Limpia Norte adjuntó fotografías demo.'],
  ['09:34', 'Resolución pendiente de verificación', 'CM-DEMO-2026-0106 espera validación.'],
  ['09:50', 'Ticket cerrado', 'CM-DEMO-2026-0105 aparece resuelto en demo.'],
];

const futureIntegrations = [
  'Supabase Auth: sesión y rol municipal_admin/supervisor.',
  'Tickets V1.1: lectura por vistas/RPC sin romper contratos actuales.',
  'RLS multiinstitución: institution_id obligatorio en consultas reales.',
  'Brigadas: asignación operativa y disponibilidad por turno.',
  'Auditoría: bitácora append-only para cada cambio de estado.',
  'Storage: evidencias fotográficas con buckets y políticas RLS.',
  'Realtime: actualización de KPIs, mapa y actividad en vivo.',
];

let stylesInjected = false;

export function mount(container, context = {}) {
  if (!container) {
    throw new Error('A mount container is required for municipal-panel.');
  }

  injectStyles();
  container.dataset.v2Module = moduleId;
  container.innerHTML = renderPanel(context);
  wireInteractions(container, context.role ?? 'municipal_admin');
}

function renderPanel(context) {
  const municipalityName = context.municipalityName ?? 'Ayuntamiento Demo de Saibot';
  const institution = context.institutionName ?? 'Institución demo · Presidencia Municipal';
  const role = context.role ?? 'municipal_admin';
  const today = new Intl.DateTimeFormat('es-MX', { dateStyle: 'full' }).format(new Date());
  const kpis = [
    ['Tickets totales', '128', '+12 esta semana'],
    ['Tickets nuevos', '18', 'requieren triage'],
    ['En proceso', '42', 'brigadas activas'],
    ['Pendientes de verificación', '9', 'supervisión'],
    ['Resueltos', '59', 'cierre operativo'],
    ['Tiempo promedio de resolución', '26 h', 'meta demo: 36 h'],
    ['Porcentaje de cumplimiento', '91%', 'SLA municipal demo'],
  ];

  return `
    <section class="mp-shell" aria-label="Municipal Panel V2">
      <header class="mp-hero">
        <nav class="mp-nav" aria-label="Navegación Municipal Panel V2">
          <div class="mp-brand"><span aria-hidden="true">MP</span><div><strong>${municipalityName}</strong><small>Municipal Panel V2 · ${DEMO_FLAG}</small></div></div>
          <div class="mp-nav-actions"><a href="#tickets">Tickets</a><a href="#impacto-municipal">Centro de Impacto Municipal</a><a href="#brigadas">Brigadas</a><a href="#mapa">Mapa</a><a href="#actividad">Actividad</a></div>
        </nav>
        <div class="mp-hero-grid">
          <div>
            <span class="mp-badge">Dashboard ejecutivo demo</span>
            <h1>Buenos días, equipo municipal.</h1>
            <p>Vista profesional para administradores y supervisores: operación, tickets, brigadas y actividad reciente preparados para integración futura con Supabase.</p>
            <div class="mp-meta-grid">
              <div><span>Institución activa</span><strong>${institution}</strong></div>
              <div><span>Fecha actual</span><strong>${today}</strong></div>
              <div><span>Rol de interfaz</span><strong data-role-label>${role}</strong></div>
            </div>
          </div>
          <aside class="mp-status-card"><span class="mp-pulse"></span><div><strong>Estado operativo del sistema</strong><p>Operación demo estable · sin conexión a producción · sin escrituras en Supabase.</p></div></aside>
        </div>
      </header>

      <main class="mp-main">
        <section class="mp-kpis" aria-label="KPIs demo">${kpis.map(([label, value, hint]) => `<article><span>${DEMO_FLAG}</span><strong>${value}</strong><p>${label}</p><small>${hint}</small></article>`).join('')}</section>

        <section class="mp-panel" id="tickets" aria-labelledby="tickets-title">
          <div class="mp-section-head"><div><span class="mp-badge">Gestión de tickets</span><h2 id="tickets-title">Bandeja operativa</h2><p>Todos los folios visibles son simulados para demostración.</p></div><select data-role-select aria-label="Cambiar rol demo"><option value="municipal_admin">municipal_admin</option><option value="supervisor">supervisor</option></select></div>
          <div class="mp-filters"><input data-search placeholder="Buscar folio, ubicación o brigada" aria-label="Buscar tickets"><select data-filter="status"><option value="">Estado: todos</option>${uniqueOptions('status')}</select><select data-filter="priority"><option value="">Prioridad: todas</option>${uniqueOptions('priority')}</select><select data-filter="category"><option value="">Categoría: todas</option>${uniqueOptions('category')}</select></div>
          <div class="mp-table-wrap"><table class="mp-table"><thead><tr><th>Folio</th><th>Categoría</th><th>Ubicación</th><th>Fecha</th><th>Prioridad</th><th>Estado</th><th>Brigada asignada</th><th>Acción</th></tr></thead><tbody data-ticket-rows>${renderTicketRows(demoTickets)}</tbody></table></div>
        </section>



        ${renderImpactCenter()}
        <section class="mp-detail-grid">
          <article class="mp-panel mp-detail" data-ticket-detail aria-live="polite">${renderTicketDetail(demoTickets[0], 'municipal_admin')}</article>
          <aside class="mp-panel" id="brigadas"><div class="mp-section-head"><div><span class="mp-badge">Brigadas</span><h2>Estado operativo</h2></div></div><div class="mp-brigades">${demoBrigades.map(renderBrigade).join('')}</div></aside>
        </section>

        <section class="mp-panel" id="mapa"><div class="mp-section-head"><div><span class="mp-badge">Mapa operativo demo</span><h2>Incidencias georreferenciadas simuladas</h2><p>Placeholder local sin servicios externos ni API keys.</p></div></div><div class="mp-map" role="img" aria-label="Mapa demo con marcadores de incidencias">${demoTickets.map(ticket => `<button class="mp-marker ${priorityClass(ticket.priority)}" style="top:${ticket.coordinates.top}%;left:${ticket.coordinates.left}%" data-ticket="${ticket.folio}" title="${ticket.folio}"><span>${ticket.folio.slice(-2)}</span></button>`).join('')}<div class="mp-map-label">Centro municipal · Demo GIS ready</div></div></section>

        <section class="mp-bottom-grid"><article class="mp-panel" id="actividad"><span class="mp-badge">Actividad reciente</span><h2>Timeline operativo</h2><ol class="mp-activity">${recentActivity.map(([time, title, detail]) => `<li><time>${time}</time><div><strong>${title}</strong><p>${detail}</p></div></li>`).join('')}</ol></article><article class="mp-panel"><span class="mp-badge">Integración futura</span><h2>Contratos preparados</h2><ul class="mp-integrations">${futureIntegrations.map(item => `<li>${item}</li>`).join('')}</ul></article></section>
      </main>
    </section>`;
}

function uniqueOptions(key) {
  return [...new Set(demoTickets.map(ticket => ticket[key]))].map(value => `<option value="${value}">${value}</option>`).join('');
}

function renderTicketRows(tickets) {
  return tickets.map(ticket => `<tr data-ticket-row data-ticket="${ticket.folio}" data-status="${ticket.status}" data-priority="${ticket.priority}" data-category="${ticket.category}"><td data-label="Folio"><strong>${ticket.folio}</strong><small>${DEMO_FLAG}</small></td><td data-label="Categoría">${ticket.category}</td><td data-label="Ubicación">${ticket.location}</td><td data-label="Fecha">${ticket.date}</td><td data-label="Prioridad"><span class="mp-chip ${priorityClass(ticket.priority)}">${ticket.priority}</span></td><td data-label="Estado"><span class="mp-chip">${ticket.status}</span></td><td data-label="Brigada">${ticket.brigade}</td><td data-label="Acción"><button class="mp-action" data-view-ticket="${ticket.folio}" type="button">Ver detalle</button></td></tr>`).join('');
}

function renderTicketDetail(ticket, role) {
  const adminActions = ['Asignar brigada', 'Cambiar prioridad', 'Solicitar evidencia', 'Cerrar ticket demo'];
  const supervisorActions = ['Verificar resolución', 'Reabrir ticket demo', 'Solicitar corrección'];
  const actions = role === 'supervisor' ? supervisorActions : adminActions;
  return `<span class="mp-badge">Detalle de ticket · ${DEMO_FLAG}</span><h2>${ticket.folio}</h2><p>${ticket.description}</p><dl class="mp-detail-list"><div><dt>Categoría</dt><dd>${ticket.category}</dd></div><div><dt>Ubicación</dt><dd>${ticket.location}</dd></div><div><dt>Fecha</dt><dd>${ticket.date}</dd></div><div><dt>Prioridad</dt><dd>${ticket.priority}</dd></div><div><dt>Estado actual</dt><dd>${ticket.status}</dd></div><div><dt>Brigada asignada</dt><dd>${ticket.brigade}</dd></div></dl><h3>Evidencias demo</h3><div class="mp-evidence">${ticket.evidence.map((item, index) => `<div><span aria-hidden="true">▧</span><strong>${item}</strong><small>Archivo simulado ${index + 1}</small></div>`).join('')}</div><h3>Timeline de cambios</h3><ol class="mp-ticket-timeline">${ticket.timeline.map(([title, detail]) => `<li><strong>${title}</strong><span>${detail}</span></li>`).join('')}</ol><h3>Acciones visuales para ${role}</h3><div class="mp-actions">${actions.map(action => `<button type="button">${action}</button>`).join('')}</div>`;
}

function renderBrigade(brigade) {
  return `<article><div><strong>${brigade.name}</strong><span>${brigade.area} · ${brigade.operator}</span></div><span class="mp-chip ${brigade.status === 'Disponible' ? 'ok' : 'warn'}">${brigade.status}</span><small>${brigade.assigned} tickets asignados</small></article>`;
}

function priorityClass(priority) {
  return priority === 'Crítica' ? 'critical' : priority === 'Alta' ? 'high' : priority === 'Media' ? 'medium' : 'ok';
}

function optionList(values, selected = 'all') {
  return ['all', ...new Set(values)].map((value) => `<option value="${value}" ${value === selected ? 'selected' : ''}>${value === 'all' ? 'Todos' : value}</option>`).join('');
}

function periodOptions(selected = '30d') {
  return [['today', 'Hoy'], ['7d', 'Últimos 7 días'], ['30d', 'Últimos 30 días'], ['quarter', 'Trimestre'], ['year', 'Año'], ['custom', 'Rango personalizado preparado']].map(([value, label]) => `<option value="${value}" ${value === selected ? 'selected' : ''}>${label}</option>`).join('');
}

function renderBars(title, data) {
  const max = Math.max(...Object.values(data), 1);
  return `<article class="mp-impact-card"><h3>${title}</h3><div class="mp-bars">${Object.entries(data).map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong><i style="width:${Math.max(8, Math.round((value / max) * 100))}%"></i></div>`).join('')}</div></article>`;
}

function renderImpactCenter(filters = {}) {
  const filtered = applyImpactFilters(impactTickets, filters);
  const summary = buildImpactSummary(filtered, economicAssumptions);
  const kpis = [
    ['Conversaciones iniciadas', summary.conversations], ['Ciudadanos atendidos automáticamente', summary.automatedCitizens], ['Reportes creados', summary.total], ['Reportes resueltos', summary.resolved], ['Tasa de resolución', `${summary.resolutionRate}%`], ['Reportes pendientes', summary.pending], ['Satisfacción ciudadana demo', `${summary.satisfaction}%`], ['Ciudadanos recurrentes', summary.recurrentCitizens],
    ['Primera respuesta promedio', `${summary.firstResponseAverage} min`], ['Asignación promedio', `${summary.assignmentAverage} min`], ['Resolución promedio', `${summary.resolutionAverage} h`], ['Resuelto dentro del objetivo', `${summary.withinTargetRate}%`],
    ['Reportes con GPS', `${summary.gpsRate}%`], ['Reportes con fotografía', `${summary.photoRate}%`], ['Descripción completa', `${summary.completeDescriptionRate}%`], ['Duplicados detectados demo', summary.duplicates], ['Requirieron información adicional', summary.needsMoreInfo],
  ];
  const comparisons = beforeAfterMetrics.map((metric) => ({ ...metric, comparison: compareValues(metric.before, metric.after, metric) }));
  return `<section class="mp-panel mp-impact" id="impacto-municipal" aria-labelledby="impact-title" data-impact-center>
    <div class="mp-section-head"><div><span class="mp-badge">Centro de Impacto Municipal</span><h2 id="impact-title">Impacto Municipal 360</h2><p><strong>${IMPACT_DEMO_NOTICE}</strong></p></div></div>
    <div class="mp-impact-filters" aria-label="Filtros ejecutivos demo"><select data-impact-filter="period">${periodOptions(filters.period || '30d')}</select><select data-impact-filter="category">${optionList(impactTickets.map(t => t.category), filters.category || 'all')}</select><select data-impact-filter="sector">${optionList(impactTickets.map(t => t.sector), filters.sector || 'all')}</select><select data-impact-filter="status">${optionList(impactTickets.map(t => t.status), filters.status || 'all')}</select><select data-impact-filter="brigade">${optionList(impactTickets.map(t => t.brigade), filters.brigade || 'all')}</select></div>
    <div class="mp-impact-360"><article><h3>Ciudadanía</h3><strong>${summary.automatedCitizens}</strong><p>personas atendidas · ${summary.total} reportes · ${summary.satisfaction}% satisfacción · ${summary.firstResponseAverage} min respuesta</p></article><article><h3>Gestión</h3><strong>${summary.resolutionRate}%</strong><p>resolución · ${summary.pending} pendientes · ${summary.withinTargetRate}% cumplimiento · trazabilidad demo</p></article><article><h3>Operaciones</h3><strong>${Object.keys(summary.byBrigade).length}</strong><p>brigadas · ${summary.resolutionAverage} h resolución · ${Object.keys(summary.bySector).length} sectores · carga operativa visible</p></article><article><h3>Impacto económico</h3><strong>$${summary.economic.monthlyAvoidedCost.toLocaleString('es-DO')}</strong><p>${summary.economic.hoursFreed} h potencialmente liberadas · proyección anual demo $${summary.economic.annualProjection.toLocaleString('es-DO')}</p></article></div>
    <div class="mp-impact-kpis">${kpis.map(([label, value]) => `<article><span>DEMO_ONLY</span><strong>${value}</strong><p>${label}</p></article>`).join('')}</div>
    <div class="mp-impact-grid">${renderBars('Reportes por categoría', summary.byCategory)}${renderBars('Reportes por sector/barrio', summary.bySector)}${renderBars('Reportes por estado', summary.byStatus)}${renderBars('Reportes por brigada', summary.byBrigade)}<article class="mp-impact-card"><h3>Evolución de reportes y tiempos</h3><div class="mp-trend"><i style="height:42%"></i><i style="height:56%"></i><i style="height:63%"></i><i style="height:48%"></i><i style="height:72%"></i><i style="height:86%"></i><i style="height:66%"></i></div><p>Tiempo de respuesta evoluciona de ${summary.firstResponseAverage + 5} a ${summary.firstResponseAverage} min en el escenario filtrado.</p></article><article class="mp-impact-card"><h3>GPS y evidencia</h3><div class="mp-donut-row"><div style="--value:${summary.gpsRate}"><strong>${summary.gpsRate}%</strong><span>GPS</span></div><div style="--value:${summary.photoRate}"><strong>${summary.photoRate}%</strong><span>Evidencia</span></div></div></article></div>
    <article class="mp-impact-card"><h3>Antes del sistema vs. con el sistema</h3><p><strong>${SCENARIO_DEMO_NOTICE}</strong></p><div class="mp-compare">${comparisons.map((item) => `<div><span>${item.label}</span><b>Antes: ${item.before} ${item.unit}</b><b>Con sistema: ${item.after} ${item.unit}</b><strong>${item.comparison.label}</strong><small>Diferencia absoluta: ${item.comparison.absoluteDifference} ${item.unit}</small></div>`).join('')}</div></article>
    <article class="mp-impact-card"><h3>Impacto económico estimado</h3><p><strong>${ECONOMIC_DEMO_NOTICE}</strong></p><div class="mp-economic"><div><span>Horas potencialmente ahorradas</span><strong>${summary.economic.hoursFreed}</strong></div><div><span>Costo mensual estimado evitado</span><strong>$${summary.economic.monthlyAvoidedCost.toLocaleString('es-DO')}</strong></div><div><span>Proyección anual estimada</span><strong>$${summary.economic.annualProjection.toLocaleString('es-DO')}</strong></div><div><span>Volumen automatizado</span><strong>${summary.economic.automatedInteractions}</strong></div></div><h4>Supuestos configurables</h4><ul><li>Costo promedio estimado por llamada: $${economicAssumptions.averageCostPerCall}</li><li>Minutos administrativos por llamada: ${economicAssumptions.administrativeMinutesPerCall}</li><li>Costo estimado por hora administrativa: $${economicAssumptions.administrativeHourlyCost}</li><li>Interacciones automatizadas estimadas: ${economicAssumptions.automatedInteractions}</li></ul></article>
    <details class="mp-impact-contract"><summary>Arquitectura de datos e integración futura</summary><p>Datos demo separados de cálculos y renderizado. No inventa tablas, RPCs ni endpoints.</p><p>DEMO_ONLY: ${impactFutureContract.demoOnly.join('; ')}.</p><p>BLOCKED: ${impactFutureContract.blocked.join('; ')}.</p><p>Preparado para backend real: ${impactFutureContract.preparedForBackend.join('; ')}.</p></details>
  </section>`;
}

function wireImpactFilters(container) {
  const center = container.querySelector('[data-impact-center]');
  if (!center) return;
  center.querySelectorAll('[data-impact-filter]').forEach((filter) => filter.addEventListener('change', () => {
    const filters = Object.fromEntries([...center.querySelectorAll('[data-impact-filter]')].map((item) => [item.dataset.impactFilter, item.value]));
    center.outerHTML = renderImpactCenter(filters);
    wireImpactFilters(container);
  }));
}

function wireInteractions(container, initialRole) {
  let role = initialRole;
  const detail = container.querySelector('[data-ticket-detail]');
  const roleSelect = container.querySelector('[data-role-select]');
  roleSelect.value = role;

  const selectTicket = (folio) => {
    const ticket = demoTickets.find(item => item.folio === folio) ?? demoTickets[0];
    detail.innerHTML = renderTicketDetail(ticket, role);
    container.querySelectorAll('[data-ticket-row]').forEach(row => row.classList.toggle('is-selected', row.dataset.ticket === ticket.folio));
    detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  container.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-view-ticket], .mp-marker');
    if (trigger) selectTicket(trigger.dataset.viewTicket ?? trigger.dataset.ticket);
  });

  roleSelect.addEventListener('change', () => {
    role = roleSelect.value;
    container.querySelector('[data-role-label]').textContent = role;
    const selected = container.querySelector('[data-ticket-row].is-selected')?.dataset.ticket ?? demoTickets[0].folio;
    selectTicket(selected);
  });

  const applyFilters = () => {
    const search = container.querySelector('[data-search]').value.toLowerCase().trim();
    const filters = Object.fromEntries([...container.querySelectorAll('[data-filter]')].map(filter => [filter.dataset.filter, filter.value]));
    container.querySelectorAll('[data-ticket-row]').forEach(row => {
      const ticket = demoTickets.find(item => item.folio === row.dataset.ticket);
      const text = `${ticket.folio} ${ticket.category} ${ticket.location} ${ticket.brigade}`.toLowerCase();
      const visible = (!search || text.includes(search)) && (!filters.status || ticket.status === filters.status) && (!filters.priority || ticket.priority === filters.priority) && (!filters.category || ticket.category === filters.category);
      row.hidden = !visible;
    });
  };

  container.querySelector('[data-search]').addEventListener('input', applyFilters);
  container.querySelectorAll('[data-filter]').forEach(filter => filter.addEventListener('change', applyFilters));
  wireImpactFilters(container);
  selectTicket(demoTickets[0].folio);
}

function injectStyles() {
  if (stylesInjected || document.getElementById('municipal-panel-v2-styles')) return;
  const style = document.createElement('style');
  style.id = 'municipal-panel-v2-styles';
  style.textContent = `
    .mp-shell{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#eef3f8;color:#102033;min-height:100vh}.mp-hero{padding:24px;background:radial-gradient(circle at 20% 0,#8ed9ff 0,#e9f4ff 30%,#f8fbff 62%),linear-gradient(135deg,#08214a,#0f62fe);}.mp-nav,.mp-hero-grid,.mp-main{max-width:1240px;margin:0 auto}.mp-nav{display:flex;justify-content:space-between;gap:18px;align-items:center;margin-bottom:34px}.mp-brand{display:flex;align-items:center;gap:12px}.mp-brand>span{width:50px;height:50px;border-radius:18px;display:grid;place-items:center;background:#0b2345;color:#fff;font-weight:950}.mp-brand small,.mp-meta-grid span,.mp-status-card p,.mp-section-head p,.mp-table small,.mp-brigades span,.mp-brigades small,.mp-ticket-timeline span{color:#64748b}.mp-nav-actions{display:flex;gap:8px;flex-wrap:wrap}.mp-nav-actions a,.mp-action,.mp-actions button{border:0;border-radius:999px;background:#fff;color:#0b4bb3;text-decoration:none;padding:11px 15px;font-weight:850;cursor:pointer}.mp-hero-grid{display:grid;grid-template-columns:1.4fr .6fr;gap:24px;align-items:stretch}.mp-badge{display:inline-flex;width:max-content;border-radius:999px;background:#e8f1ff;color:#0f62fe;padding:7px 11px;font-size:.76rem;font-weight:950;text-transform:uppercase;letter-spacing:.08em}.mp-hero h1{font-size:clamp(2.2rem,5vw,4.8rem);line-height:.95;margin:18px 0 14px;color:#07172d}.mp-hero p{font-size:1.08rem;line-height:1.65;max-width:760px}.mp-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:24px}.mp-meta-grid div,.mp-status-card,.mp-panel,.mp-kpis article{background:rgba(255,255,255,.9);border:1px solid #d7e3f3;box-shadow:0 24px 60px rgba(15,35,70,.10);border-radius:26px}.mp-meta-grid div{padding:16px}.mp-meta-grid strong{display:block;margin-top:5px}.mp-status-card{display:flex;gap:14px;align-items:flex-start;padding:24px;align-self:end}.mp-pulse{width:15px;height:15px;border-radius:50%;background:#18a058;box-shadow:0 0 0 9px rgba(24,160,88,.16);margin-top:4px;flex:0 0 auto}.mp-main{padding:24px}.mp-kpis{display:grid;grid-template-columns:repeat(7,minmax(130px,1fr));gap:14px;margin-bottom:20px}.mp-kpis article{padding:18px}.mp-kpis strong{display:block;font-size:2rem;margin:10px 0 2px}.mp-kpis p{font-weight:900;margin:0}.mp-kpis small,.mp-kpis span{color:#667085}.mp-panel{padding:24px;margin-bottom:20px}.mp-section-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:18px}.mp-section-head h2,.mp-panel h2{font-size:clamp(1.6rem,3vw,2.35rem);margin:10px 0 6px}.mp-section-head select,.mp-filters input,.mp-filters select{border:1px solid #cfd9ea;border-radius:16px;background:#fff;padding:13px 14px;font:inherit}.mp-filters{display:grid;grid-template-columns:1.5fr repeat(3,1fr);gap:12px;margin-bottom:16px}.mp-table-wrap{overflow:auto;border:1px solid #dbe5f5;border-radius:20px}.mp-table{width:100%;border-collapse:collapse;background:#fff;min-width:980px}.mp-table th,.mp-table td{text-align:left;padding:15px;border-bottom:1px solid #edf2f7;vertical-align:middle}.mp-table th{font-size:.78rem;text-transform:uppercase;color:#526274;background:#f8fbff}.mp-table tr.is-selected{background:#eef6ff}.mp-chip{display:inline-flex;border-radius:999px;background:#edf2f7;color:#263b55;padding:7px 10px;font-size:.8rem;font-weight:900}.mp-chip.critical{background:#ffe8e8;color:#b42318}.mp-chip.high{background:#fff0d5;color:#9a5b00}.mp-chip.medium{background:#e9f3ff;color:#0758b7}.mp-chip.ok{background:#e8f8ee;color:#087443}.mp-chip.warn{background:#fff8df;color:#946200}.mp-detail-grid,.mp-bottom-grid{display:grid;grid-template-columns:1.25fr .75fr;gap:20px}.mp-detail-list{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.mp-detail-list div{background:#f8fbff;border-radius:16px;padding:14px}.mp-detail-list dt{text-transform:uppercase;font-size:.75rem;color:#667085;font-weight:950}.mp-detail-list dd{margin:5px 0 0;font-weight:850}.mp-evidence{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.mp-evidence div{min-height:96px;border:1px dashed #9db3d1;background:linear-gradient(135deg,#f7fbff,#eef5ff);border-radius:18px;padding:14px;display:grid;align-content:center}.mp-evidence span{font-size:2rem;color:#0f62fe}.mp-ticket-timeline,.mp-activity{list-style:none;margin:0;padding:0;display:grid;gap:12px}.mp-ticket-timeline li,.mp-activity li{border-left:5px solid #0f62fe;background:#fff;border-radius:16px;padding:14px;box-shadow:0 10px 28px rgba(15,35,70,.06)}.mp-actions{display:flex;gap:10px;flex-wrap:wrap}.mp-actions button{background:#0f62fe;color:white}.mp-brigades{display:grid;gap:12px}.mp-brigades article{display:grid;grid-template-columns:1fr auto;gap:8px;border:1px solid #dbe5f5;border-radius:18px;padding:15px;background:#fff}.mp-brigades small{grid-column:1/-1}.mp-map{position:relative;min-height:430px;overflow:hidden;border-radius:26px;background:linear-gradient(90deg,rgba(15,98,254,.10) 1px,transparent 1px),linear-gradient(rgba(15,98,254,.10) 1px,transparent 1px),radial-gradient(circle at 70% 25%,#d9f2ff,transparent 26%),linear-gradient(135deg,#f8fbff,#dbeafe);background-size:52px 52px,52px 52px,auto,auto;border:1px solid #cbd9ef}.mp-map:before,.mp-map:after{content:"";position:absolute;background:rgba(11,35,69,.18);border-radius:999px}.mp-map:before{width:78%;height:18px;left:8%;top:44%;transform:rotate(-18deg)}.mp-map:after{width:18px;height:82%;left:52%;top:8%;transform:rotate(22deg)}.mp-marker{position:absolute;z-index:2;transform:translate(-50%,-50%);width:44px;height:44px;border:4px solid #fff;border-radius:50%;display:grid;place-items:center;background:#0f62fe;color:#fff;font-weight:950;box-shadow:0 14px 30px rgba(15,35,70,.28);cursor:pointer}.mp-marker.critical{background:#d92d20}.mp-marker.high{background:#f79009}.mp-marker.medium{background:#0f62fe}.mp-map-label{position:absolute;left:22px;bottom:22px;background:rgba(255,255,255,.92);border-radius:999px;padding:12px 16px;font-weight:900}.mp-activity li{display:grid;grid-template-columns:58px 1fr;gap:12px}.mp-activity time{font-weight:950;color:#0f62fe}.mp-activity p{margin:4px 0 0;color:#64748b}.mp-integrations{display:grid;gap:11px;margin:0;padding-left:20px}.mp-integrations li{line-height:1.5}@media (max-width:1080px){.mp-kpis{grid-template-columns:repeat(2,1fr)}.mp-hero-grid,.mp-detail-grid,.mp-bottom-grid{grid-template-columns:1fr}.mp-meta-grid,.mp-filters{grid-template-columns:1fr 1fr}}@media (max-width:720px){.mp-hero,.mp-main{padding:16px}.mp-nav,.mp-section-head{flex-direction:column}.mp-nav{align-items:flex-start}.mp-nav-actions a{flex:1}.mp-meta-grid,.mp-kpis,.mp-filters,.mp-detail-list,.mp-evidence{grid-template-columns:1fr}.mp-panel,.mp-status-card{border-radius:20px;padding:18px}.mp-table{min-width:0}.mp-table thead{display:none}.mp-table,.mp-table tbody,.mp-table tr,.mp-table td{display:block;width:100%}.mp-table tr{border-bottom:1px solid #dbe5f5;padding:12px}.mp-table td{border:0;display:flex;justify-content:space-between;gap:12px;padding:9px}.mp-table td:before{content:attr(data-label);font-weight:950;color:#526274}.mp-table td[data-label="Acción"]{display:block}.mp-action{width:100%;margin-top:8px}.mp-map{min-height:340px}}.mp-impact{scroll-margin-top:80px}.mp-impact-filters{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin:16px 0}.mp-impact-filters select{border:1px solid #cfd9ea;border-radius:16px;padding:12px;background:#fff}.mp-impact-360,.mp-impact-kpis,.mp-impact-grid,.mp-economic{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.mp-impact-360 article,.mp-impact-kpis article,.mp-impact-card,.mp-economic div{border:1px solid #dbe5f5;background:#fff;border-radius:20px;padding:16px}.mp-impact-360 strong,.mp-impact-kpis strong,.mp-economic strong{display:block;font-size:1.8rem;color:#0f2f68}.mp-impact-kpis{grid-template-columns:repeat(3,1fr);margin:14px 0}.mp-impact-kpis span{color:#b45309;font-size:.72rem;font-weight:950}.mp-impact-grid{grid-template-columns:repeat(2,1fr);margin:14px 0}.mp-bars{display:grid;gap:10px}.mp-bars div{display:grid;grid-template-columns:1fr auto;gap:8px}.mp-bars i{grid-column:1/-1;display:block;height:10px;border-radius:999px;background:#0f62fe}.mp-trend{height:150px;display:flex;align-items:end;gap:10px}.mp-trend i{flex:1;border-radius:10px 10px 0 0;background:linear-gradient(#0f62fe,#8ed9ff)}.mp-donut-row{display:flex;gap:18px;flex-wrap:wrap}.mp-donut-row div{width:128px;height:128px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#0f62fe calc(var(--value)*1%),#e5edf8 0)}.mp-donut-row strong,.mp-donut-row span{background:white;border-radius:999px;padding:4px 8px}.mp-compare{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.mp-compare div{background:#f8fbff;border-radius:16px;padding:14px;display:grid;gap:6px}.mp-impact-contract{margin-top:14px;border:1px solid #dbe5f5;border-radius:18px;padding:16px;background:#f8fbff}@media (max-width:1080px){.mp-impact-filters,.mp-impact-360,.mp-impact-kpis,.mp-impact-grid,.mp-economic,.mp-compare{grid-template-columns:1fr 1fr}}@media (max-width:720px){.mp-impact-filters,.mp-impact-360,.mp-impact-kpis,.mp-impact-grid,.mp-economic,.mp-compare{grid-template-columns:1fr}.mp-impact-360 strong,.mp-impact-kpis strong,.mp-economic strong{font-size:1.5rem}}@media (max-width:460px){.mp-hero h1{font-size:2.2rem}.mp-nav-actions,.mp-actions{width:100%;flex-direction:column}.mp-nav-actions a,.mp-actions button{width:100%;box-sizing:border-box;text-align:center}.mp-status-card{display:block}.mp-pulse{display:inline-block;margin-bottom:12px}}
  `;
  document.head.appendChild(style);
  stylesInjected = true;
}
