import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { municipalConfig } from '../../frontend/shared/municipal-config.js';

const app = readFileSync(new URL('../../frontend/chatbot-v1.1-demo/app.js', import.meta.url), 'utf8');
const panel = readFileSync(new URL('../../frontend/modules/municipal-panel/index.js', import.meta.url), 'utf8');
const config = JSON.stringify(municipalConfig.serviceDesk);

assert.doesNotMatch(app, /Esta demo V1\.1 conserva el flujo conversacional ciudadano pensado para WhatsApp|Esta versión mantiene el flujo conversacional de WhatsApp/);
assert.equal(municipalConfig.serviceDesk.currency, 'RD$');
assert.equal(municipalConfig.serviceDesk.priceDisclaimer, 'Precio demo · sujeto a validación oficial del ayuntamiento');

for (const field of ['price', 'price_status', 'free', 'requires_evaluation', 'payment_required', 'payment_instructions', 'fee_notes']) {
  assert.match(config, new RegExp(field));
}

assert.match(app, /serviceDeskConfig\.currency/);
assert.match(app, /minimumFractionDigits: 2/);
assert.match(app, /maximumFractionDigits: 2/);
assert.match(app, /formatCurrency/);
assert.match(app, /getSubtypePricing/);
assert.match(app, /formatPriceLine/);
assert.match(app, /Costo\$\{estimated \? ' estimado' : ''\}/);
assert.match(app, /\*\*Costo:\*\* Gratis/);
assert.match(app, /\*\*Costo:\*\* Pendiente de validación/);
assert.match(app, /\*\*Servicio:\*\*/);
assert.match(app, /\*\*Subtipo:\*\*/);
assert.match(app, /\*\*Estado del precio:\*\*/);
assert.match(app, /\*\*Contacto:\*\*/);
assert.match(app, /No se procesan pagos ni cargos reales/);
assert.doesNotMatch(app, /stripe|paypal|checkout|pasarela/i);

const cleanup = municipalConfig.serviceDesk.services.find((service) => service.id === 'limpieza-ornato');
assert.equal(cleanup.subtypes.find((item) => item.label === 'Retiro de escombros').price, 1500);
assert.equal(cleanup.subtypes.find((item) => item.label === 'Recogida especial').price, 2000);
assert.equal(cleanup.subtypes.find((item) => item.label === 'Limpieza de espacio público').free, true);

const lighting = municipalConfig.serviceDesk.services.find((service) => service.id === 'alumbrado-publico');
assert.ok(lighting.subtypes.every((item) => item.free === true));

assert.match(panel, /Costo estimado|costo estimado/);
assert.match(panel, /Estado del precio|estado del precio/);
assert.match(panel, /Pago|pago/);
assert.match(panel, /Método de pago futuro|método de pago futuro/);
assert.match(panel, /Referencia de pago futura|referencia de pago futura/);
assert.match(panel, /no hay pasarela, cargos ni procesamiento real/);
