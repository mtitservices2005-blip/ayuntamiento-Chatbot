-- Safe public configuration for the citizen portal. Sensitive institutional settings remain private.
create or replace function public.v11_get_public_institution_config(target_slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', i.id,
    'slug', i.slug,
    'name', s.public_name,
    'logo_path', s.logo_path,
    'ticket_categories', s.ticket_categories,
    'sectors', s.sectors,
    'content', s.public_content,
    'file_policy', jsonb_build_object('enabled', false)
  )
  from public.v11_institutions i
  join public.v11_institution_settings s on s.institution_id = i.id
  where i.slug = target_slug and i.active;
$$;
revoke all on function public.v11_get_public_institution_config(text) from public;
grant execute on function public.v11_get_public_institution_config(text) to anon, authenticated;
