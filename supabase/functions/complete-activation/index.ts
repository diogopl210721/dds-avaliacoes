// supabase/functions/complete-activation/index.ts
//
// Chamada logo após supabase.auth.signUp() no fluxo de ativação. Faz tudo
// que precisa de service_role de uma vez: cria profile, cria company,
// grava o destino no dds_link (+ histórico), e marca a placa como ATIVA.
//
// Centralizar isso aqui evita ter que desenhar policies de RLS para um
// usuário recém-criado escrever em dds_links/link_destination_history —
// e mantém a troca de destino sempre passando pelo mesmo caminho
// auditado (o mesmo espírito da função alter_link_destino).
//
// Deploy: supabase functions deploy complete-activation

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();
    if (!user) return json({ error: "Não autenticado." }, 401);

    const { plateId, profile, empresa } = await req.json();
    if (!plateId || !profile || !empresa) {
      return json({ error: "Dados incompletos." }, 400);
    }

    // 1. profile
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: user.id,
      nome: profile.nome,
      sobrenome: profile.sobrenome,
      whatsapp: profile.whatsapp,
    });
    if (profileError) throw profileError;

    // 2. company
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .insert({
        owner_id: user.id,
        nome: empresa.nome,
        cidade: empresa.cidade ?? null,
        estado: empresa.estado ?? null,
        google_place_id: empresa.google_place_id,
        google_maps_uri: empresa.google_maps_uri,
        write_a_review_uri: empresa.write_a_review_uri,
        rating: empresa.rating,
        review_count: empresa.review_count,
        last_synced_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (companyError) throw companyError;

    await supabaseAdmin.from("review_snapshots").insert({
      company_id: company.id,
      rating: empresa.rating,
      review_count: empresa.review_count,
    });

    // 3. placa -> dynamic_link_id
    const { data: plate, error: plateError } = await supabaseAdmin
      .from("plates")
      .select("id, dynamic_link_id")
      .eq("id", plateId)
      .maybeSingle();
    if (plateError || !plate) throw plateError ?? new Error("Placa não encontrada.");

    // 4. dds_link: grava destino + histórico (mesmo espírito de alter_link_destino,
    //    mas aqui é a primeira definição de destino, então "anterior" é null)
    await supabaseAdmin
      .from("dds_links")
      .update({
        destino_atual: empresa.write_a_review_uri,
        company_id: company.id,
        status: "ATIVO",
        updated_at: new Date().toISOString(),
      })
      .eq("id", plate.dynamic_link_id);

    await supabaseAdmin.from("link_destination_history").insert({
      link_id: plate.dynamic_link_id,
      destino_anterior: null,
      destino_novo: empresa.write_a_review_uri,
      alterado_por: user.id,
    });

    // 5. placa -> ATIVA
    await supabaseAdmin
      .from("plates")
      .update({ status: "ATIVA", company_id: company.id, ativada_em: new Date().toISOString() })
      .eq("id", plateId);

    return json({ company_id: company.id }, 200);
  } catch (e) {
    console.error(e);
    return json({ error: "Não foi possível concluir a ativação." }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
