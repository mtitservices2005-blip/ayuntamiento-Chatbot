import { config, findOrCreateUser, service, assert } from './supabase-http.mjs';

const cfg = config();
const password = process.env.SAIBOT_DEV_TEST_PASSWORD;
if (!password || password.length < 16) throw new Error('Define SAIBOT_DEV_TEST_PASSWORD con al menos 16 caracteres.');
const suffix = process.env.SAIBOT_DEV_TEST_SUFFIX || '001';
const domain = `saibot-dev-${suffix}.invalid`;
const users = await Promise.all([
  ['mt', 'Superadmin MT'], ['admin-a', 'Administración A'], ['supervisor-a', 'Supervisión A'],
  ['brigade-a', 'Brigada A'], ['admin-b', 'Administración B'], ['brigade-b', 'Brigada B'], ['new-user', 'Usuario sin membresía']
].map(async ([local, displayName]) => [local, await findOrCreateUser({ email: `${local}@${domain}`, password, displayName })]));
const ids = Object.fromEntries(users.map(([name, user]) => [name, user.id]));

async function upsert(path, body, onConflict) {
  return service(path, { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation', ...(onConflict ? { 'on-conflict': onConflict } : {}) }, body });
}

const institutions = await upsert('/rest/v1/v11_institutions?on_conflict=slug', [
  { slug: `saibot-dev-a-${suffix}`, legal_name: `Saibot Dev Ayuntamiento A ${suffix}`, active: true },
  { slug: `saibot-dev-b-${suffix}`, legal_name: `Saibot Dev Ayuntamiento B ${suffix}`, active: true }
]);
const [a, b] = institutions;
assert(a && b, 'No se pudieron preparar las instituciones sintéticas.');
await upsert('/rest/v1/v11_institution_settings?on_conflict=institution_id', [
  { institution_id: a.id, public_name: `Saibot Dev A ${suffix}`, ticket_categories: ['Residuos', 'Alumbrado'], sectors: ['Sector A'] },
  { institution_id: b.id, public_name: `Saibot Dev B ${suffix}`, ticket_categories: ['Residuos', 'Alumbrado'], sectors: ['Sector B'] }
]);
const brigades = await upsert('/rest/v1/v11_brigades?on_conflict=institution_id,name', [
  { institution_id: a.id, name: `Brigada Saibot A ${suffix}`, active: true },
  { institution_id: b.id, name: `Brigada Saibot B ${suffix}`, active: true }
]);
const [brigadeA, brigadeB] = brigades;
await upsert('/rest/v1/v11_memberships?on_conflict=institution_id,user_id', [
  { institution_id: a.id, user_id: ids.mt, role: 'mt_superadmin', active: true },
  { institution_id: a.id, user_id: ids['admin-a'], role: 'municipal_admin', active: true },
  { institution_id: a.id, user_id: ids['supervisor-a'], role: 'supervisor', active: true },
  { institution_id: a.id, user_id: ids['brigade-a'], role: 'brigade_member', active: true },
  { institution_id: b.id, user_id: ids['admin-b'], role: 'municipal_admin', active: true },
  { institution_id: b.id, user_id: ids['brigade-b'], role: 'brigade_member', active: true }
]);
await upsert('/rest/v1/v11_brigade_members?on_conflict=brigade_id,user_id', [
  { brigade_id: brigadeA.id, user_id: ids['brigade-a'] }, { brigade_id: brigadeB.id, user_id: ids['brigade-b'] }
]);
console.log(JSON.stringify({ status: 'seeded', suffix, institutions: { a: a.id, b: b.id }, brigades: { a: brigadeA.id, b: brigadeB.id }, users: Object.keys(ids) }, null, 2));
