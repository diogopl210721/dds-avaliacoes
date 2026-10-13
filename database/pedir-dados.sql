-- Escolha do dono da placa: pedir (ou não) telefone e aniversário do cliente antes da avaliação.
-- Só acrescenta um campo: todas as placas existentes ficam com "sim" (o comportamento de antes).
-- Slug, código, destino e status não mudam, então os QR Codes impressos continuam valendo.
alter table public.dds_links
  add column if not exists pedir_dados boolean not null default true;

comment on column public.dds_links.pedir_dados is
  'true: antes da avaliação mostra a tela de telefone e aniversário (com "Pular"). false: vai direto (no iPhone, uma tela de um toque só).';

-- Reset completo da placa volta a escolha para o padrão (sim), como o resto do cadastro.
CREATE OR REPLACE FUNCTION public.admin_reset_plate_pin(p_plate_id uuid, p_full boolean DEFAULT false)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_novo_pin text;
  v_dynamic_link_id uuid;
begin
  if not is_admin() then
    raise exception 'Apenas administradores podem resetar placas.';
  end if;

  v_novo_pin := lpad((floor(random() * 10000))::int::text, 4, '0');

  select dynamic_link_id into v_dynamic_link_id from plates where id = p_plate_id;
  if v_dynamic_link_id is null then
    raise exception 'Placa nao encontrada.';
  end if;

  if p_full then
    update plates set pin_hash = crypt(v_novo_pin, gen_salt('bf')), pin = v_novo_pin, pin_used = false,
      status = 'AGUARDANDO_ATIVACAO', company_id = null, apelido = null, ativada_em = null,
      ultimo_acesso_em = null
    where id = p_plate_id;
    -- Reset completo: a placa volta pra "de fabrica" pra um novo cliente, entao
    -- tudo do cliente anterior (acessos, telefones e historico de destino)
    -- fica marcado como limpo (nao aparece mais no painel), sem apagar as
    -- linhas do banco.
    update dds_links set destino_atual = null, company_id = null, status = 'AGUARDANDO_DESTINO',
      historico_limpo_em = now(), pedir_dados = true
    where id = v_dynamic_link_id;
  else
    update plates set pin_hash = crypt(v_novo_pin, gen_salt('bf')), pin = v_novo_pin, pin_used = false
    where id = p_plate_id;
  end if;

  return v_novo_pin;
end;
$function$;
