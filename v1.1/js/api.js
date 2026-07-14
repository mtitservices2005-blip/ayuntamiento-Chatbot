import { getClient } from './supabase-client.js';

function assertText(value, label, min, max) {
  const result = value.trim();
  if (result.length < min || result.length > max) throw new Error(`${label} debe tener entre ${min} y ${max} caracteres.`);
  return result;
}

export async function getPublicInstitution(slug) {
  const { data, error } = await getClient().rpc('v11_get_public_institution_config', { target_slug: slug });
  if (error) throw error;
  if (!data) throw new Error('La institución no está disponible.');
  return data;
}

export async function createCitizenTicket(institution, input) {
  const payload = {
    target_institution: institution.id,
    ticket_category: assertText(input.category, 'La categoría', 2, 100),
    ticket_description: assertText(input.description, 'La descripción', 5, 2000),
    ticket_sector: input.sector?.trim() || null,
    ticket_location_text: input.location?.trim() || null,
    ticket_latitude: null,
    ticket_longitude: null,
    ticket_evidence_path: null
  };
  const { data, error } = await getClient().rpc('v11_create_citizen_ticket', payload).single();
  if (error) throw error;
  return data;
}

export async function lookupCitizenTicket(publicId, secret) {
  const { data, error } = await getClient().rpc('v11_get_citizen_ticket', {
    ticket_public_id: assertText(publicId, 'El identificador', 36, 36),
    provided_secret: assertText(secret, 'El código de seguimiento', 32, 128)
  }).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listStaffTickets() {
  const { data, error } = await getClient().from('v11_tickets')
    .select('id, institution_id, public_id, category, sector, status, assigned_brigade_id, version, created_at, updated_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
