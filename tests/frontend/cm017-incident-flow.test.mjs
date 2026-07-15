import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { municipalConfig } from '../../frontend/shared/municipal-config.js';

const app = readFileSync(new URL('../../frontend/chatbot-v1.1-demo/app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../../frontend/chatbot-v1.1-demo/index.html', import.meta.url), 'utf8');
const contracts = readFileSync(new URL('../../frontend/shared/contracts/channel-contracts.js', import.meta.url), 'utf8');

assert.deepEqual(municipalConfig.sectors, [
  'San Antonio',
  'Puerto Rico',
  'La Curva',
  'Pueblo Nuevo',
  'Las Flores',
  'Alto de La Hicotea',
]);
assert.equal(municipalConfig.reportPolicy.askMunicipality, false);
assert.equal(municipalConfig.reportPolicy.allowLocationOmission, false);
assert.ok(municipalConfig.reportCategories.some((category) => category.label === '🗑️ Basura acumulada' && category.requiresEvidence));

const flowOrder = [
  'function startReport',
  'function selectCategory',
  'function selectSector',
  'function useDemoGps',
  'function askManualLocation',
  'function askDescription',
  'function askEvidence',
  'function showReportSummary',
  'function confirmReport',
];
let previousIndex = -1;
for (const marker of flowOrder) {
  const index = app.indexOf(marker);
  assert.ok(index > previousIndex, `${marker} debe aparecer en orden de flujo`);
  previousIndex = index;
}

assert.match(app, /quickSectorOptions/);
assert.match(app, /Otro sector de Laguna Salada/);
assert.match(app, /state\.mode = 'report-sector'/);
assert.match(app, /state\.mode = 'report-other-sector'/);
assert.match(app, /web-demo-gps/);
assert.match(app, /GPS simulada registrada/);
assert.match(app, /futureWhatsAppLocationMessage/);
assert.match(app, /state\.mode = 'report-manual-location'/);
assert.match(app, /manual-address/);
assert.match(app, /evidence-input/);
assert.match(html, /type="file"/);
assert.match(app, /Evidencia demo · no enviada/);
assert.match(app, /Vista previa local/);
assert.match(app, /Categoría: \$\{state\.report\.category\}/);
assert.match(app, /Sector: \$\{state\.report\.sector\}/);
assert.match(app, /Dirección\/GPS: \$\{state\.report\.locationText\}/);
assert.match(app, /Descripción: \$\{state\.report\.description\}/);
assert.match(app, /Evidencia seleccionada/);
assert.match(app, /report:confirm/);
assert.match(app, /report:correct/);
assert.match(app, /startReportCorrection/);
assert.match(app, /Folio demo: \$\{folio\}/);
assert.match(app, /LS-\$\{new Date\(\)\.toISOString/);

assert.match(contracts, /ticketDraft/);
assert.match(contracts, /latitude/);
assert.match(contracts, /evidence/);
