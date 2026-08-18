-- handle_new_user(): SECURITY DEFINER trigger on auth.users insert.
-- Reads raw_user_meta_data to create companies/profiles rows, avoiding the
-- chicken-and-egg RLS problem for brand-new users (no profiles row yet
-- means current_company_id()/current_app_role() would otherwise return null).
--
-- Expected raw_user_meta_data shapes:
--   super_admin seed:      { intended_role: 'super_admin' }
--   company_admin signup:  { intended_role: 'company_admin', company_name }
--   employee/manager invite: { intended_role, company_id, person_id }

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := new.raw_user_meta_data;
  intended_role text := meta->>'intended_role';
  company_name text := meta->>'company_name';
  meta_company_id uuid := nullif(meta->>'company_id', '')::uuid;
  meta_person_id uuid := nullif(meta->>'person_id', '')::uuid;
  display_name text := coalesce(meta->>'name', split_part(new.email, '@', 1));
  new_company_id uuid;
  base_slug text;
  final_slug text;
  suffix int := 0;
  person_name text;
begin
  if intended_role = 'super_admin' then
    insert into public.profiles (id, company_id, person_id, role, email, name)
    values (new.id, null, null, 'super_admin', new.email, display_name);

  elsif intended_role = 'company_admin' then
    base_slug := lower(regexp_replace(trim(coalesce(company_name, display_name)), '[^a-z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    if base_slug = '' then
      base_slug := 'company';
    end if;
    final_slug := base_slug;
    while exists(select 1 from public.companies where slug = final_slug) loop
      suffix := suffix + 1;
      final_slug := base_slug || '-' || suffix;
    end loop;

    insert into public.companies (name, slug)
    values (coalesce(company_name, display_name), final_slug)
    returning id into new_company_id;

    insert into public.profiles (id, company_id, person_id, role, email, name)
    values (new.id, new_company_id, null, 'company_admin', new.email, display_name);

  elsif intended_role in ('employee', 'manager')
    and meta_company_id is not null
    and meta_person_id is not null then

    select name into person_name from public.people where id = meta_person_id;

    insert into public.profiles (id, company_id, person_id, role, email, name)
    values (
      new.id,
      meta_company_id,
      meta_person_id,
      intended_role::app_role,
      new.email,
      coalesce(person_name, display_name)
    );

    update public.people
      set status = 'active', updated_at = now()
      where id = meta_person_id and status = 'invited';

  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
