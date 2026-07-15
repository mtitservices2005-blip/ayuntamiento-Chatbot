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
    ticket_latitude: input.latitude ?? null,
    ticket_longitude: input.longitude ?? null,
    ticket_evidence_path: input.evidencePath || null
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


const CITIZEN_EVIDENCE_BUCKET = 'ticket-evidence-v11';
const CITIZEN_PENDING_PREFIX = 'pending';
const ALLOWED_CITIZEN_EVIDENCE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_CITIZEN_EVIDENCE_SIZE = 8 * 1024 * 1024;

function safeFileName(name) {
  return name.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120) || 'evidencia';
}

export async function validateCitizenEvidence(institution, file) {
  if (!institution?.id) throw new Error('La institución no está disponible para validar evidencia.');
  if (!file) return { canUpload: false, evidencePath: null, status: 'validando', kind: 'info', message: 'Sin fotografía seleccionada.' };
  if (!ALLOWED_CITIZEN_EVIDENCE_TYPES.includes(file.type)) return { canUpload: false, evidencePath: null, status: 'validando', kind: 'error', message: 'Solo se permiten fotografías JPEG, PNG o WebP.' };
  if (file.size <= 0) return { canUpload: false, evidencePath: null, status: 'validando', kind: 'error', message: 'La fotografía está vacía.' };
  if (file.size > MAX_CITIZEN_EVIDENCE_SIZE) return { canUpload: false, evidencePath: null, status: 'validando', kind: 'error', message: 'La fotografía supera 8 MB.' };

  const { data: sessionData, error: sessionError } = await getClient().auth.getSession();
  if (sessionError) return { canUpload: false, evidencePath: null, status: 'error de autorización', kind: 'error', message: sessionError.message };

  const objectName = `${institution.id}/${CITIZEN_PENDING_PREFIX}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const hasAuthenticatedUser = Boolean(sessionData?.session?.user);
  if (!hasAuthenticatedUser) {
    return {
      canUpload: false,
      evidencePath: null,
      status: 'error de autorización',
      kind: 'warning',
      message: `Contrato confirmado: bucket ${CITIZEN_EVIDENCE_BUCKET}, ruta ${institution.id}/${CITIZEN_PENDING_PREFIX}/… y RPC v11_create_citizen_ticket acepta ticket_evidence_path. Bloqueo: las migraciones confirman que no existe policy de upload ciudadano directo; se requiere Edge Function confiable o policy aprobada antes de subir.`
    };
  }

  return {
    canUpload: false,
    evidencePath: objectName,
    status: 'error de autorización',
    kind: 'warning',
    message: `Usuario autenticado detectado, pero las policies confirmadas no conceden insert a ${CITIZEN_EVIDENCE_BUCKET}. No se intentó subir para no inventar permisos; se requiere infraestructura Supabase aprobada.`
  };
}
