import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { impactTickets, beforeAfterMetrics, impactFutureContract, economicAssumptions } from '../../frontend/modules/municipal-panel/impact-data.js';
import { applyImpactFilters, buildImpactSummary, compareValues, calculateEconomicImpact } from '../../frontend/modules/municipal-panel/impact-calculations.js';

const citizenApp = readFileSync(new URL('../../frontend/chatbot-v1.1-demo/app.js', import.meta.url), 'utf8');
const municipalPanel = readFileSync(new URL('../../frontend/modules/municipal-panel/index.js', import.meta.url), 'utf8');
const impactDataSource = readFileSync(new URL('../../frontend/modules/municipal-panel/impact-data.js', import.meta.url), 'utf8');

const mainMenuBlock = citizenApp.slice(citizenApp.indexOf('function defaultWelcome'), citizenApp.indexOf('function knowMunicipalityMenu'));
const mainMenuLabels = [...mainMenuBlock.matchAll(/\['([^']+)', conversationIntents\./g)].map((match) => match[1].replace(/^[^A-Za-zÁÉÍÓÚÑáéíóúñ]+\s*/, ''));
assert.deepEqual(mainMenuLabels, ['Reportar una incidencia', 'Consultar mi reporte', 'Conoce tu municipio', 'Contactos y horarios']);

const submenuBlock = citizenApp.slice(citizenApp.indexOf('function knowMunicipalityMenu'), citizenApp.indexOf('function bot'));
assert.deepEqual(['Historia del municipio', 'Lugares emblemáticos', 'Conoce a tu alcalde', 'Conoce a tu vicealcaldesa', 'Concejo municipal', 'Volver al menú principal'].map((label) => submenuBlock.includes(label)), [true, true, true, true, true, true]);

for (const required of ['startReport', 'navigator.geolocation', 'validateEvidenceFile', 'Revisa tu reporte', 'Confirmar reporte', 'Corregir información', 'tracking']) {
  assert.match(citizenApp, new RegExp(required));
}
assert.match(citizenApp, /startTicketLookup/);
assert.doesNotMatch(mainMenuBlock, /Centro de Impacto Municipal|Datos simulados para demostración|Impacto económico estimado/);
assert.match(municipalPanel, /Centro de Impacto Municipal/);
assert.match(impactDataSource, /Datos simulados para demostración · no representan resultados reales del ayuntamiento/);
assert.match(impactDataSource, /Estimación demo · requiere datos reales del ayuntamiento para validación/);

const summary = buildImpactSummary(applyImpactFilters(impactTickets, { period: '30d' }), economicAssumptions);
assert.equal(summary.total, summary.resolved + summary.pending);
assert.equal(summary.resolutionRate, Math.round((summary.resolved / summary.total) * 100));
assert.ok(summary.gpsRate > 0 && summary.photoRate > 0);
assert.ok(Object.keys(summary.byCategory).length >= 5);
assert.ok(Object.keys(summary.bySector).length >= 5);
assert.ok(Object.keys(summary.byStatus).length >= 4);
assert.ok(Object.keys(summary.byBrigade).length >= 5);

const percentagePointMetric = beforeAfterMetrics.find((metric) => metric.percentagePoint);
assert.equal(compareValues(percentagePointMetric.before, percentagePointMetric.after, percentagePointMetric).label, '+60 puntos porcentuales');
const reductionMetric = beforeAfterMetrics.find((metric) => metric.label === 'Llamadas administrativas estimadas');
assert.equal(compareValues(reductionMetric.before, reductionMetric.after, reductionMetric).change, 66);

const economic = calculateEconomicImpact(economicAssumptions);
assert.equal(economic.hoursFreed, Math.round((economicAssumptions.automatedInteractions * economicAssumptions.administrativeMinutesPerCall) / 60));
assert.equal(economic.annualProjection, economic.monthlyAvoidedCost * 12);

assert.ok(impactFutureContract.demoOnly.length >= 3);
assert.ok(impactFutureContract.blocked.length >= 3);
assert.ok(impactFutureContract.preparedForBackend.length >= 5);
