// supabase/functions/manual-refresh/index.ts
//
// Chamado pelo botão "Atualizar agora" no dashboard do cliente.
// Requer JWT do usuário logado (verifica que ele é dono da company_id).
// Limite: 1 atualização manual a cada 24h por empresa — evita que o botão
// vire uma forma gratuita de burlar a cadência semanal/diária.
//
// Deploy: supabase functions deploy manual-refresh

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY")!;
const DETAILS_FIELD_MASK = ["rating", "userRatingCount"].join(",");

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const {
    data: { user },
  } = await supabaseUser.auth.getUser();
  if (!user) return json({ error: "Não autenticado." }, 401);

  const { companyId } = await req.json();
  const { data: company } = await supabaseUser
    .from("companies")
    .select("id, owner_id, google_place_id, last_manual_refresh_at")
    .eq("id", companyId)
    .maybeSingle();

  if (!company || company.owner_id !== user.id) {
    return json({ error: "Empresa não encontrada." }, 404);
  }

  if (company.last_manual_refresh_at) {
    const hoursSince =
      (Date.now() - new Date(company.last_manual_refresh_at).getTime()) /
      (1000 * 60 * 60);
    if (hoursSince < 24) {
      return json(
        { error: "Você já atualizou recentemente. Tente novamente mais tarde." },
        429
      );
    }
  }

  const res = await fetch(
    `https://places.googleapis.com/v1/places/${company.google_place_id}`,
    {
      headers: {
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": DETAILS_FIELD_MASK,
      },
    }
  );
  const place = await res.json();
  const rating = place.rating ?? null;
  const review_count = place.userRatingCount ?? null;
  const now = new Date().toISOString();

  await supabaseAdmin
    .from("companies")
    .update({
      rating,
      review_count,
      last_synced_at: now,
      last_manual_refresh_at: now,
      updated_at: now,
    })
    .eq("id", company.id);

  await supabaseAdmin.from("review_snapshots").insert({
    company_id: company.id,
    rating,
    review_count,
    captured_at: now,
  });

  return json({ rating, review_count }, 200);
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
