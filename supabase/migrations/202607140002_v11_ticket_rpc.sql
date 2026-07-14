-- V1.1 workflow RPC. All mutations validate tenant, actor and state inside one transaction.

create or replace function public.v11_create_citizen_ticket(
  target_institution uuid,
  ticket_category text,
  ticket_description text,
  ticket_sector text default null,
  ticket_location_text text default null,
  ticket_latitude numeric default null,
  ticket_longitude numeric default null,
  ticket_evidence_path text default null
) returns table (public_id uuid, tracking_secret text)
language plpgsql security definer set search_path = public as $$
declare
  generated_secret text := encode(gen_random_bytes(24), 'hex');
  new_ticket public.v11_tickets;
begin
  if not exists (select 1 from public.v11_institutions where id = target_institution and active) then
    raise exception 'Institution is unavailable' using errcode = 'P0001';
  end if;
  if ticket_category is null or char_length(btrim(ticket_category)) not between 2 and 100 then
    raise exception 'Invalid category' using errcode = '22023';
  end if;
  if ticket_description is null or char_length(btrim(ticket_description)) not between 5 and 2000 then
    raise exception 'Invalid description' using errcode = '22023';
  end if;
  if ticket_evidence_path is not null and ticket_evidence_path !~ ('^' || target_institution::text || '/pending/') then
    raise exception 'Invalid evidence path' using errcode = '22023';
  end if;

  insert into public.v11_tickets (
    institution_id, tracking_secret_hash, category, sector, location_text, latitude, longitude, description, evidence_path
  ) values (
    target_institution, crypt(generated_secret, gen_salt('bf')), btrim(ticket_category), nullif(btrim(ticket_sector), ''),
    nullif(btrim(ticket_location_text), ''), ticket_latitude, ticket_longitude, btrim(ticket_description), ticket_evidence_path
  ) returning * into new_ticket;

  perform public.v11_write_audit(new_ticket.institution_id, 'ticket', new_ticket.id, 'created', null,
    jsonb_build_object('status', new_ticket.status, 'public_id', new_ticket.public_id), 'citizen_web');
  return query select new_ticket.public_id, generated_secret;
end;
$$;

create or replace function public.v11_get_citizen_ticket(ticket_public_id uuid, provided_secret text)
returns table (public_id uuid, category text, status public.v11_ticket_status, created_at timestamptz, updated_at timestamptz)
language sql security definer set search_path = public as $$
  select t.public_id, t.category, t.status, t.created_at, t.updated_at
  from public.v11_tickets t
  where t.public_id = ticket_public_id
    and t.tracking_secret_hash = extensions.crypt(
    provided_secret,
    t.tracking_secret_hash
)
$$;

create or replace function public.v11_assign_ticket(target_ticket uuid, target_brigade uuid, expected_version integer)
returns public.v11_tickets language plpgsql security definer set search_path = public as $$
declare current_ticket public.v11_tickets; next_ticket public.v11_tickets;
begin
  select * into current_ticket from public.v11_tickets where id = target_ticket for update;
  if not found then raise exception 'Ticket unavailable' using errcode = 'P0001'; end if;
  if not public.v11_has_role(current_ticket.institution_id, array['municipal_admin','supervisor']::public.v11_app_role[]) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if current_ticket.status <> 'received' or current_ticket.version <> expected_version then
    raise exception 'Ticket transition conflict' using errcode = '40001';
  end if;
  if not exists (select 1 from public.v11_brigades where id = target_brigade and institution_id = current_ticket.institution_id and active) then
    raise exception 'Brigade unavailable' using errcode = '22023';
  end if;
  update public.v11_tickets set assigned_brigade_id = target_brigade, status = 'assigned', assigned_at = now()
    where id = current_ticket.id returning * into next_ticket;
  perform public.v11_write_audit(next_ticket.institution_id, 'ticket', next_ticket.id, 'assigned',
    jsonb_build_object('status', current_ticket.status, 'brigade_id', current_ticket.assigned_brigade_id),
    jsonb_build_object('status', next_ticket.status, 'brigade_id', next_ticket.assigned_brigade_id));
  return next_ticket;
end;
$$;

create or replace function public.v11_start_ticket_work(target_ticket uuid, expected_version integer)
returns public.v11_tickets language plpgsql security definer set search_path = public as $$
declare current_ticket public.v11_tickets; next_ticket public.v11_tickets;
begin
  select * into current_ticket from public.v11_tickets where id = target_ticket for update;
  if not found then raise exception 'Ticket unavailable' using errcode = 'P0001'; end if;
  if current_ticket.assigned_brigade_id is null or not public.v11_is_brigade_member(current_ticket.assigned_brigade_id) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if current_ticket.status <> 'assigned' or current_ticket.version <> expected_version then
    raise exception 'Ticket transition conflict' using errcode = '40001';
  end if;
  update public.v11_tickets set status = 'in_progress', started_at = now() where id = current_ticket.id returning * into next_ticket;
  perform public.v11_write_audit(next_ticket.institution_id, 'ticket', next_ticket.id, 'work_started',
    jsonb_build_object('status', current_ticket.status), jsonb_build_object('status', next_ticket.status));
  return next_ticket;
end;
$$;

create or replace function public.v11_submit_ticket_resolution(
  target_ticket uuid, expected_version integer, evidence_path text, resolution_note text default null
) returns public.v11_tickets language plpgsql security definer set search_path = public as $$
declare current_ticket public.v11_tickets; next_ticket public.v11_tickets;
begin
  select * into current_ticket from public.v11_tickets where id = target_ticket for update;
  if not found then raise exception 'Ticket unavailable' using errcode = 'P0001'; end if;
  if current_ticket.assigned_brigade_id is null or not public.v11_is_brigade_member(current_ticket.assigned_brigade_id) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if current_ticket.status <> 'in_progress' or current_ticket.version <> expected_version then
    raise exception 'Ticket transition conflict' using errcode = '40001';
  end if;
  if evidence_path !~ ('^' || current_ticket.institution_id::text || '/' || current_ticket.id::text || '/resolution/') then
    raise exception 'Invalid resolution evidence path' using errcode = '22023';
  end if;
  update public.v11_tickets set status = 'pending_verification', resolution_evidence_path = evidence_path,
    resolution_comment = nullif(btrim(resolution_note), ''), return_reason = null, submitted_at = now()
    where id = current_ticket.id returning * into next_ticket;
  perform public.v11_write_audit(next_ticket.institution_id, 'ticket', next_ticket.id, 'resolution_submitted',
    jsonb_build_object('status', current_ticket.status), jsonb_build_object('status', next_ticket.status));
  return next_ticket;
end;
$$;

create or replace function public.v11_review_ticket_resolution(
  target_ticket uuid, expected_version integer, approve boolean, review_note text default null
) returns public.v11_tickets language plpgsql security definer set search_path = public as $$
declare current_ticket public.v11_tickets; next_ticket public.v11_tickets;
begin
  select * into current_ticket from public.v11_tickets where id = target_ticket for update;
  if not found then raise exception 'Ticket unavailable' using errcode = 'P0001'; end if;
  if not public.v11_has_role(current_ticket.institution_id, array['municipal_admin','supervisor']::public.v11_app_role[]) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if current_ticket.status <> 'pending_verification' or current_ticket.version <> expected_version then
    raise exception 'Ticket transition conflict' using errcode = '40001';
  end if;
  if not approve and (review_note is null or char_length(btrim(review_note)) < 3) then
    raise exception 'A return reason is required' using errcode = '22023';
  end if;
  if approve then
    update public.v11_tickets set status = 'resolved', resolved_at = now(), return_reason = null where id = current_ticket.id returning * into next_ticket;
  else
    update public.v11_tickets set status = 'in_progress', return_reason = btrim(review_note) where id = current_ticket.id returning * into next_ticket;
  end if;
  perform public.v11_write_audit(next_ticket.institution_id, 'ticket', next_ticket.id,
    case when approve then 'resolution_approved' else 'resolution_returned' end,
    jsonb_build_object('status', current_ticket.status),
    jsonb_build_object('status', next_ticket.status, 'return_reason', next_ticket.return_reason));
  return next_ticket;
end;
$$;

revoke all on function public.v11_create_citizen_ticket(uuid, text, text, text, text, numeric, numeric, text) from public;
revoke all on function public.v11_get_citizen_ticket(uuid, text) from public;
revoke all on function public.v11_assign_ticket(uuid, uuid, integer) from public;
revoke all on function public.v11_start_ticket_work(uuid, integer) from public;
revoke all on function public.v11_submit_ticket_resolution(uuid, integer, text, text) from public;
revoke all on function public.v11_review_ticket_resolution(uuid, integer, boolean, text) from public;
grant execute on function public.v11_create_citizen_ticket(uuid, text, text, text, text, numeric, numeric, text) to anon, authenticated;
grant execute on function public.v11_get_citizen_ticket(uuid, text) to anon, authenticated;
grant execute on function public.v11_assign_ticket(uuid, uuid, integer) to authenticated;
grant execute on function public.v11_start_ticket_work(uuid, integer) to authenticated;
grant execute on function public.v11_submit_ticket_resolution(uuid, integer, text, text) to authenticated;
grant execute on function public.v11_review_ticket_resolution(uuid, integer, boolean, text) to authenticated;
