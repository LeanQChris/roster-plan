-- companies_update (0002) allowed any company member to update company
-- settings — tighten to company_admin (or super_admin) only, matching the
-- plan's intent ("company_admin updates own non-platform fields").
drop policy "companies_update" on companies;

create policy "companies_update" on companies for update
  using (
    (id = current_company_id() and current_app_role() = 'company_admin')
    or is_super_admin()
  )
  with check (
    (id = current_company_id() and current_app_role() = 'company_admin')
    or is_super_admin()
  );
