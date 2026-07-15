import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { municipalConfig, demoMunicipalConfig } from '../../frontend/shared/municipal-config.js';
import { conversationIntents } from '../../frontend/shared/contracts/channel-contracts.js';

const app = readFileSync(new URL('../../frontend/chatbot-v1.1-demo/app.js', import.meta.url), 'utf8');
const panel = readFileSync(new URL('../../frontend/modules/municipal-panel/index.js', import.meta.url), 'utf8');
const brigade = readFileSync(new URL('../../frontend/modules/brigade-portal/index.js', import.meta.url), 'utf8');
const impact = readFileSync(new URL('../../frontend/modules/municipal-panel/impact-data.js', import.meta.url), 'utf8');

assert.equal(conversationIntents.REQUEST_MUNICIPAL_SERVICE, 'request_municipal_service');
assert.equal(municipalConfig.serviceDesk.services.length, 5);
assert.deepEqual(municipalConfig.serviceDesk.statuses, ['Recibida', 'Asignada', 'En proceso', 'En revisión', 'Resuelta', 'Cerrada']);
assert.deepEqual(municipalConfig.serviceDesk.exceptionalStatuses, ['Cancelada', 'Rechazada']);
assert.equal(municipalConfig.serviceDesk.folioPrefix, 'SOL-');

for (const label of ['🧹 Limpieza y ornato', '🌳 Poda y áreas verdes', '💡 Alumbrado público', '📄 Certificaciones y documentos', '🏛️ Uso de espacios y servicios municipales']) {
  assert.ok(municipalConfig.serviceDesk.services.some((service) => service.label === label));
}

for (const id of ['limpieza-ornato', 'poda-areas-verdes', 'alumbrado-publico']) {
  const service = municipalConfig.serviceDesk.services.find((item) => item.id === id);
  assert.equal(service.requiresLocation, true);
  assert.equal(service.requiresSector, true);
}
const certification = municipalConfig.serviceDesk.services.find((item) => item.id === 'certificaciones-documentos');
assert.equal(certification.requiresLocation, false);
assert.equal(certification.evidence, 'not_required');
assert.equal(certification.assignmentTarget, 'administrative_department');
assert.match(municipalConfig.serviceDesk.notifications.ResueltaCertificacion, /documento está listo para retiro/);
assert.ok(municipalConfig.serviceDesk.certificationPickup.place.includes('PENDIENTE'));

const spaceUse = municipalConfig.serviceDesk.services.find((item) => item.id === 'espacios-servicios-municipales');
assert.equal(spaceUse.flow, 'space-use');
assert.match(app, /askSpaceUseDate/);
assert.match(app, /askSpaceUseTime/);
assert.match(app, /askSpaceUsePurpose/);
assert.match(app, /service-space-people/);

const welcomeBlock = app.slice(app.indexOf('function defaultWelcome'), app.indexOf('function knowMunicipalityMenu'));
assert.match(welcomeBlock, /Reportar una incidencia/);
assert.match(welcomeBlock, /Solicitar un servicio municipal/);
assert.match(welcomeBlock, /Consultar mi reporte o solicitud/);
assert.match(welcomeBlock, /Conoce tu municipio/);
assert.match(welcomeBlock, /Contactos y horarios/);
assert.equal((welcomeBlock.match(/conversationIntents\./g) || []).length, 5);

assert.match(app, /serviceDeskConfig\.services\.map/);
assert.match(app, /serviceDeskConfig\.folioPrefix/);
assert.match(app, /SOL-2026-00142/);
assert.match(app, /Tipo de caso: \$\{text\.toUpperCase\(\)\.startsWith\('SOL-'\)/);
assert.equal(municipalConfig.serviceDesk.citizenClosure.resolvedPrompt, '¿Confirmas que el servicio fue realizado satisfactoriamente?');
assert.match(app, /service-close:confirm/);
assert.match(app, /service-close:review/);
assert.match(app, /No se solicitará GPS ni fotografía obligatoria/);

assert.match(panel, /Tipo de caso/);
assert.match(panel, /Solicitud de servicio/);
assert.match(panel, /Departamento administrativo · no requiere brigada obligatoria/);
assert.match(panel, /Subtipo/);
assert.match(panel, /Historial|Timeline de cambios/);
assert.match(brigade, /brigada no obligatoria/);
assert.match(impact, /incidencias recibidas/);
assert.match(impact, /solicitudes de servicios recibidas/);
assert.match(impact, /documentos listos para retiro/);
assert.match(impact, /servicios confirmados satisfactoriamente/);
assert.match(impact, /solicitudes reabiertas o enviadas a revisión/);

assert.equal(demoMunicipalConfig.serviceDesk.services.length, 5);
assert.doesNotMatch(JSON.stringify(demoMunicipalConfig.institutionalContent), /Laguna Salada|10,627|Valverde|Máximo Gómez/);
