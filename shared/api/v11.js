import { getSupabaseClient } from '../supabase/client.js';

export const V11_CONTRACTS = Object.freeze({
  roles: ['mt_superadmin', 'municipal_admin', 'supervisor', 'brigade_member'],
  ticketStatuses: ['received', 'assigned', 'in_progress', 'pending_verification', 'resolved'],
  buckets: ['ticket-evidence-v11', 'resolution-evidence-v11'],
});

export class V11ContractError extends Error {
  constructor(message, code = 'contract_unavailable', details = {}) {
    super(message);
    this.name = 'V11ContractError';
    this.code = code;
    this.details = details;
  }
}

export function normalizeSupabaseError(error) {
  if (!error) return null;
  const code = error.code || error.status || 'supabase_error';
  const safeMessageByCode = {
    42501: 'Acceso denegado por las políticas de seguridad.',
    40001: 'El registro cambió; vuelve a cargar antes de continuar.',
    P0001: 'El recurso solicitado no está disponible.',
    22023: 'Los datos enviados no cumplen el contrato confirmado.',
  };
  return { code, message: safeMessageByCode[code] || 'No fue posible completar la operación.', correlationId: error.correlationId || null };
}

async function unwrap(query) {
  const { data, error } = await query;
  if (error) {
    const safe = normalizeSupabaseError(error);
    throw Object.assign(new Error(safe.message), safe);
  }
  return data;
}

export async function getCurrentSession() {
  const client = getSupabaseClient();
  const data = await unwrap(client.auth.getSession());
  return data?.session || null;
}

export async function getCurrentUser() {
  const client = getSupabaseClient();
  const data = await unwrap(client.auth.getUser());
  return data?.user || null;
}

export async function getMembershipContext(options = {}) {
  const session = options.session || await getCurrentSession();
  const userId = session?.user?.id;
  if (!userId) return { user: null, memberships: [], activeMembership: null, role: null, institutionId: null };

  const memberships = await unwrap(getSupabaseClient()
    .from('v11_memberships')
    .select('id,institution_id,user_id,role,active,created_at,updated_at,v11_institutions(id,slug,legal_name,active)')
    .eq('user_id', userId)
    .eq('active', true));
  const activeMembership = memberships?.[0] || null;
  return { user: session.user, memberships: memberships || [], activeMembership, role: activeMembership?.role || null, institutionId: activeMembership?.institution_id || null };
}

export async function getPublicInstitutionConfig(slug) {
  if (!slug) throw new V11ContractError('La configuración pública requiere slug institucional.', 'missing_slug');
  return unwrap(getSupabaseClient().rpc('v11_get_public_institution_config', { target_slug: slug }));
}

export async function createCitizenTicket(input) {
  return unwrap(getSupabaseClient().rpc('v11_create_citizen_ticket', {
    target_institution: input.institutionId,
    ticket_category: input.category,
    ticket_description: input.description,
    ticket_sector: input.sector || null,
    ticket_location_text: input.locationText || null,
    ticket_latitude: input.latitude ?? null,
    ticket_longitude: input.longitude ?? null,
    ticket_evidence_path: input.evidencePath || null,
  }));
}

export async function getCitizenTicket(publicId, trackingSecret) {
  return unwrap(getSupabaseClient().rpc('v11_get_citizen_ticket', { ticket_public_id: publicId, provided_secret: trackingSecret }));
}

export async function listInstitutionTickets(filters = {}) {
  let query = getSupabaseClient().from('v11_tickets').select('id,public_id,institution_id,category,sector,location_text,status,assigned_brigade_id,version,created_at,updated_at,assigned_at,started_at,submitted_at,resolved_at');
  if (filters.institutionId) query = query.eq('institution_id', filters.institutionId);
  if (filters.status) query = query.eq('status', filters.status);
  return unwrap(query.order('created_at', { ascending: false }).limit(filters.limit || 100));
}

export async function listBrigadeTickets(brigadeId) {
  if (!brigadeId) throw new V11ContractError('La consulta de brigada requiere brigade_id confirmado.', 'missing_brigade');
  const tickets = await listInstitutionTickets({ limit: 250 });
  return tickets.filter((ticket) => ticket.assigned_brigade_id === brigadeId);
}

export const ticketWorkflow = Object.freeze({
  assign: (ticketId, brigadeId, version) => unwrap(getSupabaseClient().rpc('v11_assign_ticket', { target_ticket: ticketId, target_brigade: brigadeId, expected_version: version })),
  startWork: (ticketId, version) => unwrap(getSupabaseClient().rpc('v11_start_ticket_work', { target_ticket: ticketId, expected_version: version })),
  submitResolution: (ticketId, version, evidencePath, note) => unwrap(getSupabaseClient().rpc('v11_submit_ticket_resolution', { target_ticket: ticketId, expected_version: version, evidence_path: evidencePath, resolution_note: note || null })),
  reviewResolution: (ticketId, version, approve, note) => unwrap(getSupabaseClient().rpc('v11_review_ticket_resolution', { target_ticket: ticketId, expected_version: version, approve, review_note: note || null })),
});
