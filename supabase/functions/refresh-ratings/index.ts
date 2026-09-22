// supabase/functions/refresh-ratings/index.ts
//
// Roda 1x por dia via pg_cron (ver supabase/migrations/0002_cron.sql).
// Para cada empresa, decide se é "dia de atualizar" com base em
// update_frequency: 'weekly' (padrão gratuito) ou 'daily' (upsell futuro).
// Grava snapshot em review_snapshots a cada atualização real.
//
// Deploy: supabase functions deploy refresh-ratings

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);
const GOOGLE_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY")!;

const DETAILS_FIELD_MASK = ["rating", "userRatingCount"].join(",");

Deno.serve(async (_req) => {
  const { data: companies, error } = await supabaseAdmin
    .from("companies")
    .select("id, google_place_id, update_frequency, last_synced_at")
    .not("google_place_id", "is", null);

  if (error) return json({ error: error.message }, 500);

  let updated = 0;
  for (const company of companies ?? []) {
    if (!shouldSync(company.update_frequency, company.last_synced_at)) continue;

    try {
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
        .update({ rating, review_count, last_synced_at: now, updated_at: now })
        .eq("id", company.id);

      await supabaseAdmin.from("review_snapshots").insert({
        company_id: company.id,
        rating,
        review_count,
        captured_at: now,
      });

      updated += 1;
    } catch (e) {
      console.error(`falha ao sincronizar company ${company.id}:`, e);
    }
  }

  return json({ updated, total: companies?.length ?? 0 }, 200);
});

function shouldSync(frequency: string, lastSyncedAt: string | null): boolean {
  if (!lastSyncedAt) return true;
  const hoursSince =
    (Date.now() - new Date(lastSyncedAt).getTime()) / (1000 * 60 * 60);
  if (frequency === "daily") return hoursSince >= 24;
  return hoursSince >= 24 * 7; // weekly (padrão)
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
