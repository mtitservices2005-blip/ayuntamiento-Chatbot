import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { contentStatuses, municipalConfig } from '../../frontend/shared/municipal-config.js';
import { conversationIntents } from '../../frontend/shared/contracts/channel-contracts.js';

const app = readFileSync(new URL('../../frontend/chatbot-v1.1-demo/app.js', import.meta.url), 'utf8');
const configuration = readFileSync(new URL('../../frontend/modules/configuration/index.js', import.meta.url), 'utf8');
const master = readFileSync(new URL('../../frontend/modules/master-admin/index.js', import.meta.url), 'utf8');
const institutional = readFileSync(new URL('../../frontend/modules/institutional-content/index.js', import.meta.url), 'utf8');

assert.deepEqual(Object.values(contentStatuses), ['draft', 'reviewed', 'published']);
assert.equal(conversationIntents.KNOW_MUNICIPALITY, 'know_municipality');
assert.equal(conversationIntents.MUNICIPAL_COUNCIL, 'municipal_council');

const mainMenuBlock = app.slice(app.indexOf('function defaultWelcome'), app.indexOf('function knowMunicipalityMenu'));
assert.match(mainMenuBlock, /Reportar una incidencia/);
assert.match(mainMenuBlock, /Consultar mi reporte/);
assert.match(mainMenuBlock, /Conoce tu municipio/);
assert.match(mainMenuBlock, /Contactos y horarios/);
assert.doesNotMatch(mainMenuBlock, /Conoce a tu alcalde/);
assert.doesNotMatch(mainMenuBlock, /Conoce a tu vicealcaldesa/);

const submenuBlock = app.slice(app.indexOf('function knowMunicipalityMenu'), app.indexOf('function bot'));
for (const label of ['Historia del municipio', 'Lugares emblemáticos', 'Conoce a tu alcalde', 'Conoce a tu vicealcaldesa', 'Concejo municipal', 'Volver al menú principal']) {
  assert.match(submenuBlock, new RegExp(label));
}

assert.match(app, /isPublished = \(item\)/);
assert.match(app, /filter\(isPublished\)/);
assert.equal(municipalConfig.institutionalContent.history.status, contentStatuses.PUBLISHED);
assert.ok(municipalConfig.institutionalContent.landmarks.some((place) => place.name === 'Palacio Municipal de Laguna Salada' && place.status === contentStatuses.PUBLISHED));
assert.ok(municipalConfig.institutionalContent.landmarks.some((place) => place.status === contentStatuses.REVIEWED));
assert.equal(municipalConfig.institutionalContent.authorities.mayor.status, contentStatuses.DRAFT);

assert.match(configuration, /editar, revisar y publicar/);
assert.match(configuration, /draft/);
assert.match(configuration, /reviewed/);
assert.match(configuration, /published/);
assert.match(master, /draft\/reviewed\/published/);
assert.match(institutional, /fromMunicipalConfig/);
assert.match(institutional, /isPublished/);

assert.match(app, /startReport/);
assert.match(app, /startTicketLookup/);
