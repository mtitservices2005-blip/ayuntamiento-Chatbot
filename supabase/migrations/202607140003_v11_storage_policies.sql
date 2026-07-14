-- Prerequisite: create private buckets `ticket-evidence-v11` and `resolution-evidence-v11` manually in an approved environment.
-- This migration deliberately does not create or alter buckets.

create or replace function public.v11_storage_institution_id(object_name text)
returns uuid language plpgsql immutable set search_path = public as $$
begin
  if object_name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/' then
    return null;
  end if;
  return split_part(object_name, '/', 1)::uuid;
end;
$$;

create or replace function public.v11_can_read_storage_object(object_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.v11_has_role(
      public.v11_storage_institution_id(object_name),
      array['municipal_admin','supervisor']::public.v11_app_role[]
    )
    or exists (
      select 1 from public.v11_tickets t
      where t.institution_id = public.v11_storage_institution_id(object_name)
        and (t.evidence_path = object_name or t.resolution_evidence_path = object_name)
        and t.assigned_brigade_id is not null
        and public.v11_is_brigade_member(t.assigned_brigade_id)
    );
$$;

create or replace function public.v11_can_write_resolution_object(object_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.v11_tickets t
    where t.institution_id = public.v11_storage_institution_id(object_name)
      and t.id::text = split_part(object_name, '/', 2)
      and t.assigned_brigade_id is not null
      and public.v11_is_brigade_member(t.assigned_brigade_id)
      and object_name ~ ('^' || t.institution_id::text || '/' || t.id::text || '/resolution/[a-zA-Z0-9._-]+$')
  );
$$;

create policy v11_ticket_evidence_staff_read on storage.objects for select to authenticated
  using (bucket_id = 'ticket-evidence-v11' and public.v11_can_read_storage_object(name));
create policy v11_resolution_evidence_staff_read on storage.objects for select to authenticated
  using (bucket_id = 'resolution-evidence-v11' and public.v11_can_read_storage_object(name));

-- There is intentionally no direct citizen upload policy. A trusted Edge Function must validate MIME/size,
-- issue a tenant/ticket path and write the object so an anonymous browser cannot fill Storage arbitrarily.
create policy v11_resolution_evidence_brigade_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'resolution-evidence-v11' and public.v11_can_write_resolution_object(name));
