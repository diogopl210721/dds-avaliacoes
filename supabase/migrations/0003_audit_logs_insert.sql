-- A policy original só previa SELECT para admin em audit_logs. As Edge
-- Functions administrativas gravam logs usando a service_role key (que
-- ignora RLS), então isso não é estritamente necessário para o fluxo
-- atual — mas deixamos a policy de INSERT explícita para o caso de, no
-- futuro, alguma ação admin ser feita direto pelo client autenticado.
create policy "audit_logs_admin_insert" on audit_logs
  for insert with check (is_admin());
