-- Agenda a Edge Function refresh-ratings para rodar todo dia às 06:00 (UTC).
-- Ela mesma decide, empresa por empresa, se já passou tempo suficiente
-- (semanal ou diário) para valer a pena chamar o Google de novo.
--
-- Isso também resolve o problema do projeto Supabase free pausar por
-- inatividade: com essa chamada diária, o projeto nunca fica 7 dias parado.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'refresh-ratings-daily',
  '0 6 * * *',
  $$
  select net.http_post(
    url := 'https://SEU_PROJECT_REF.functions.supabase.co/refresh-ratings',
    headers := jsonb_build_object(
      'Authorization', 'Bearer SEU_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    )
  );
  $$
);

-- Lembrete: troque SEU_PROJECT_REF e SEU_SERVICE_ROLE_KEY pelos valores
-- reais do seu projeto antes de rodar esta migration (ou configure via
-- Supabase Vault, se preferir não deixar a chave visível na migration).
