export const moduleId = 'citizen-portal';

const DEMO_TICKET = {
  id: 'DEMO-CM-2026-0042',
  category: 'Alumbrado público',
  location: 'Parque Central, Sector Norte',
  status: 'En seguimiento',
  createdAt: '2026-07-14 09:30 UTC',
  priority: 'Media',
  summary: 'Luminaria intermitente frente al área infantil.',
};

const DEMO_TIMELINE = [
  { label: 'Reporte recibido', detail: 'Datos demo: acuse automático del Portal Ciudadano V2.', state: 'done' },
  { label: 'Validación municipal', detail: 'Datos demo: folio clasificado y enviado al área responsable.', state: 'done' },
  { label: 'Brigada asignada', detail: 'Datos demo: cuadrilla de servicios urbanos programada.', state: 'active' },
  { label: 'Cierre ciudadano', detail: 'Pendiente de evidencia y confirmación final.', state: 'pending' },
];

const SUPABASE_INTEGRATION_NOTES = [
  'Tabla futura: citizen_reports para altas y consulta por folio.',
  'Storage futuro: report_attachments para fotografías ciudadanas.',
  'RLS futuro: lectura por folio + correo o teléfono verificado.',
];

let stylesInjected = false;

export function mount(container, context = {}) {
  if (!container) {
    throw new Error('A mount container is required for citizen-portal.');
  }

  injectStyles();
  container.dataset.v2Module = moduleId;
  container.innerHTML = renderPortal(context);
  wireInteractions(container);
}

function renderPortal(context) {
  const municipalityName = context.municipalityName ?? 'Ayuntamiento Digital';

  return `
    <section class="cp-shell" aria-label="Portal Ciudadano V2">
      <header class="cp-hero" data-screen="inicio">
        <nav class="cp-nav" aria-label="Navegación del portal ciudadano">
          <div class="cp-brand">
            <span class="cp-brand-mark" aria-hidden="true">CM</span>
            <div>
              <strong>${municipalityName}</strong>
              <span>Portal Ciudadano V2</span>
            </div>
          </div>
          <div class="cp-nav-actions">
            <button class="cp-link" type="button" data-cp-go="consultar">Consultar ticket</button>
            <button class="cp-primary" type="button" data-cp-go="crear">Nuevo reporte</button>
          </div>
        </nav>

        <div class="cp-hero-grid">
          <div class="cp-hero-copy">
            <span class="cp-eyebrow">Atención ciudadana · Demo visual</span>
            <h1>Reporta incidencias municipales y consulta su avance en un solo lugar.</h1>
            <p>Flujo V2 preparado para conectar con Supabase sin afectar el portal V1. Los folios y estados visibles son datos demo claramente identificados.</p>
            <div class="cp-hero-actions">
              <button class="cp-primary cp-large" type="button" data-cp-go="crear">Crear reporte</button>
              <button class="cp-secondary cp-large" type="button" data-cp-go="estado">Ver seguimiento demo</button>
            </div>
          </div>
          <aside class="cp-status-card" aria-label="Resumen demo de ticket">
            <span class="cp-demo-badge">Datos demo</span>
            <h2>${DEMO_TICKET.id}</h2>
            <p>${DEMO_TICKET.summary}</p>
            <dl>
              <div><dt>Estado</dt><dd>${DEMO_TICKET.status}</dd></div>
              <div><dt>Prioridad</dt><dd>${DEMO_TICKET.priority}</dd></div>
              <div><dt>Zona</dt><dd>${DEMO_TICKET.location}</dd></div>
            </dl>
          </aside>
        </div>
      </header>

      <main class="cp-main">
        <section class="cp-flow" aria-label="Flujo ciudadano">
          ${['Inicio', 'Nuevo Reporte', 'Formulario', 'Enviar', 'Ticket generado', 'Seguimiento'].map((step, index) => `
            <article class="cp-flow-step">
              <span>${index + 1}</span>
              <strong>${step}</strong>
            </article>
          `).join('')}
        </section>

        <section class="cp-screen is-active" data-cp-screen="crear" aria-labelledby="crear-title">
          <div class="cp-section-heading">
            <span class="cp-eyebrow">Nuevo reporte</span>
            <h2 id="crear-title">Cuéntanos qué ocurre</h2>
            <p>Formulario visual listo para enviar a Supabase cuando se habilite la capa de persistencia.</p>
          </div>
          <form class="cp-form" data-cp-form>
            <label>Tipo de incidencia
              <select name="category" required>
                <option>Alumbrado público</option>
                <option>Bacheo y vialidades</option>
                <option>Recolección de residuos</option>
                <option>Agua y drenaje</option>
              </select>
            </label>
            <label>Ubicación
              <input name="location" type="text" value="Parque Central, Sector Norte" required>
            </label>
            <label>Descripción
              <textarea name="description" rows="5" required>Luminaria intermitente frente al área infantil.</textarea>
            </label>
            <label>Contacto para seguimiento
              <input name="contact" type="email" value="ciudadano.demo@example.com" required>
            </label>
            <div class="cp-form-footer">
              <p><strong>Demo:</strong> no se guardan datos reales todavía.</p>
              <button class="cp-primary" type="submit">Enviar reporte</button>
            </div>
          </form>
        </section>

        <section class="cp-screen" data-cp-screen="consultar" aria-labelledby="consultar-title">
          <div class="cp-section-heading">
            <span class="cp-eyebrow">Consultar ticket</span>
            <h2 id="consultar-title">Ingresa tu folio</h2>
            <p>Usa el folio demo ${DEMO_TICKET.id} para previsualizar la experiencia de consulta.</p>
          </div>
          <div class="cp-lookup">
            <input aria-label="Folio" value="${DEMO_TICKET.id}">
            <button class="cp-primary" type="button" data-cp-go="estado">Consultar estado</button>
          </div>
        </section>

        <section class="cp-screen" data-cp-screen="estado" aria-labelledby="estado-title">
          <div class="cp-section-heading">
            <span class="cp-eyebrow">Ticket generado</span>
            <h2 id="estado-title">Seguimiento del reporte</h2>
            <p>Folio demo generado: <strong>${DEMO_TICKET.id}</strong></p>
          </div>
          <div class="cp-ticket-layout">
            <article class="cp-ticket-card">
              <span class="cp-demo-badge">Datos demo</span>
              <h3>${DEMO_TICKET.category}</h3>
              <p>${DEMO_TICKET.summary}</p>
              <dl>
                <div><dt>Creado</dt><dd>${DEMO_TICKET.createdAt}</dd></div>
                <div><dt>Estado</dt><dd>${DEMO_TICKET.status}</dd></div>
                <div><dt>Ubicación</dt><dd>${DEMO_TICKET.location}</dd></div>
              </dl>
            </article>
            <ol class="cp-timeline">
              ${DEMO_TIMELINE.map(item => `<li class="${item.state}"><strong>${item.label}</strong><span>${item.detail}</span></li>`).join('')}
            </ol>
          </div>
        </section>

        <section class="cp-integrations" aria-label="Integración futura Supabase">
          <div>
            <span class="cp-eyebrow">Preparado para Supabase</span>
            <h2>Contratos visuales listos para datos reales</h2>
          </div>
          <ul>${SUPABASE_INTEGRATION_NOTES.map(note => `<li>${note}</li>`).join('')}</ul>
        </section>
      </main>
    </section>
  `;
}

function wireInteractions(container) {
  const screens = [...container.querySelectorAll('[data-cp-screen]')];
  const showScreen = (target) => {
    screens.forEach((screen) => screen.classList.toggle('is-active', screen.dataset.cpScreen === target));
    container.querySelector(`[data-cp-screen="${target}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  container.querySelectorAll('[data-cp-go]').forEach((button) => {
    button.addEventListener('click', () => showScreen(button.dataset.cpGo));
  });

  container.querySelector('[data-cp-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    showScreen('estado');
  });
}

function injectStyles() {
  if (stylesInjected || document.getElementById('citizen-portal-v2-styles')) return;
  const style = document.createElement('style');
  style.id = 'citizen-portal-v2-styles';
  style.textContent = `
    .cp-shell{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#102033;background:#f5f7fb;min-height:100%;}
    .cp-hero{background:radial-gradient(circle at top left,#dff7ff 0,#f8fbff 34%,#eaf1ff 100%);padding:24px;overflow:hidden;}
    .cp-nav,.cp-hero-grid,.cp-main{max-width:1180px;margin:0 auto;}.cp-nav{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:54px}.cp-brand{display:flex;align-items:center;gap:12px}.cp-brand-mark{display:grid;place-items:center;width:48px;height:48px;border-radius:16px;background:#0f62fe;color:white;font-weight:900;box-shadow:0 14px 35px rgba(15,98,254,.25)}.cp-brand span:last-child{display:block;color:#667085;font-size:.9rem}.cp-nav-actions,.cp-hero-actions,.cp-form-footer,.cp-lookup{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.cp-link,.cp-primary,.cp-secondary{border:0;border-radius:999px;padding:12px 18px;font-weight:800;cursor:pointer}.cp-link{background:transparent;color:#0f62fe}.cp-primary{background:#0f62fe;color:#fff;box-shadow:0 14px 28px rgba(15,98,254,.24)}.cp-secondary{background:#fff;color:#0f355f;border:1px solid #d9e2f2}.cp-large{padding:15px 22px}.cp-hero-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(300px,.8fr);gap:28px;align-items:stretch}.cp-eyebrow,.cp-demo-badge{display:inline-flex;align-items:center;width:max-content;border-radius:999px;background:#e7f0ff;color:#0f62fe;padding:7px 11px;font-size:.78rem;font-weight:900;text-transform:uppercase;letter-spacing:.08em}.cp-demo-badge{background:#fff7df;color:#946200}.cp-hero h1{font-size:clamp(2.4rem,6vw,5rem);line-height:.96;margin:18px 0;color:#07172d}.cp-hero p,.cp-section-heading p{color:#5b687a;font-size:1.08rem;line-height:1.7;max-width:760px}.cp-status-card,.cp-screen,.cp-integrations{background:rgba(255,255,255,.88);border:1px solid #dbe5f5;border-radius:30px;padding:28px;box-shadow:0 24px 70px rgba(16,32,51,.10);backdrop-filter:blur(16px)}.cp-status-card h2{font-size:1.65rem;margin:18px 0 8px}.cp-status-card dl,.cp-ticket-card dl{display:grid;gap:12px;margin-top:20px}.cp-status-card div,.cp-ticket-card div{background:#f6f9ff;border-radius:18px;padding:14px}.cp-status-card dt,.cp-ticket-card dt{font-size:.78rem;color:#6b778c;text-transform:uppercase;font-weight:900}.cp-status-card dd,.cp-ticket-card dd{margin:4px 0 0;font-weight:800}.cp-main{padding:28px 24px 56px}.cp-flow{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:24px}.cp-flow-step{background:#fff;border:1px solid #dbe5f5;border-radius:20px;padding:16px;position:relative}.cp-flow-step span{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#0f62fe;color:#fff;font-weight:900;margin-bottom:10px}.cp-screen{display:none;margin-bottom:24px}.cp-screen.is-active{display:block}.cp-section-heading{margin-bottom:22px}.cp-section-heading h2{font-size:clamp(1.8rem,4vw,3rem);margin:12px 0 8px}.cp-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.cp-form label{display:grid;gap:8px;font-weight:850;color:#24364b}.cp-form textarea,.cp-form input,.cp-form select,.cp-lookup input{width:100%;box-sizing:border-box;border:1px solid #cfd9ea;border-radius:18px;padding:14px 16px;font:inherit;background:#fff;color:#17253a}.cp-form label:nth-child(3),.cp-form-footer{grid-column:1/-1}.cp-form-footer{justify-content:space-between;background:#f6f9ff;border-radius:22px;padding:16px}.cp-lookup input{max-width:420px}.cp-ticket-layout{display:grid;grid-template-columns:minmax(260px,.8fr) minmax(0,1.2fr);gap:22px}.cp-ticket-card{border:1px solid #dbe5f5;border-radius:26px;padding:22px;background:#fff}.cp-timeline{list-style:none;margin:0;padding:0;display:grid;gap:14px}.cp-timeline li{background:#fff;border:1px solid #dbe5f5;border-left:7px solid #c8d3e6;border-radius:20px;padding:18px}.cp-timeline li.done{border-left-color:#12a150}.cp-timeline li.active{border-left-color:#0f62fe;box-shadow:0 16px 34px rgba(15,98,254,.12)}.cp-timeline strong,.cp-timeline span{display:block}.cp-timeline span{color:#64748b;margin-top:6px}.cp-integrations{display:grid;grid-template-columns:.9fr 1.1fr;gap:24px;background:#07172d;color:#fff}.cp-integrations .cp-eyebrow{background:rgba(255,255,255,.12);color:#9ed7ff}.cp-integrations ul{margin:0;display:grid;gap:12px}.cp-integrations li{color:#d9e7ff}@media (max-width:820px){.cp-nav,.cp-hero-grid,.cp-ticket-layout,.cp-integrations{grid-template-columns:1fr}.cp-nav{align-items:flex-start;flex-direction:column}.cp-flow{grid-template-columns:repeat(2,1fr)}.cp-form{grid-template-columns:1fr}.cp-hero{padding:18px}.cp-main{padding:18px}.cp-status-card,.cp-screen,.cp-integrations{border-radius:22px;padding:20px}}@media (max-width:520px){.cp-flow{grid-template-columns:1fr}.cp-nav-actions,.cp-hero-actions,.cp-form-footer,.cp-lookup{align-items:stretch;flex-direction:column}.cp-link,.cp-primary,.cp-secondary{width:100%}.cp-hero h1{font-size:2.35rem}}
  `;
  document.head.appendChild(style);
  stylesInjected = true;
}
