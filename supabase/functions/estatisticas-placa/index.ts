import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

function tooManyAttempts(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const { codigo, pin } = await req.json();
    if (!codigo || !pin) {
      return json({ error: "Código e PIN são obrigatórios." }, 400);
    }
    const codigoNorm = String(codigo).trim().toUpperCase();

    if (tooManyAttempts(codigoNorm)) {
      return json({ error: "Muitas tentativas. Aguarde alguns minutos." }, 429);
    }

    const { data: plate, error: plateErr } = await supabaseAdmin
      .from("plates")
      .select("id, pin_hash, status, company_id, dynamic_link_id, codigo")
      .eq("codigo", codigoNorm)
      .maybeSingle();

    const genericError = { error: "Código ou PIN inválido." };
    if (plateErr || !plate) return json(genericError, 400);

    const pinOk = bcrypt.compareSync(String(pin), plate.pin_hash);
    if (!pinOk) return json(genericError, 400);

    let empresa: string | null = null;
    if (plate.company_id) {
      const { data: company } = await supabaseAdmin
        .from("companies")
        .select("nome, write_a_review_uri")
        .eq("id", plate.company_id)
        .maybeSingle();
      empresa = company?.nome ?? null;
    }

    // Depois de um reset completo da placa, tudo do cliente anterior (acessos
    // e telefones) fica marcado como "limpo" nesse momento, sem apagar as
    // linhas do banco — só contamos o que aconteceu depois desse marco.
    // Também traz a escolha do dono: pedir ou não telefone e aniversário antes da avaliação.
    let marco: string | null = null;
    let pedirDados = true;
    if (plate.dynamic_link_id) {
      const { data: link } = await supabaseAdmin
        .from("dds_links")
        .select("historico_limpo_em, pedir_dados")
        .eq("id", plate.dynamic_link_id)
        .maybeSingle();
      marco = link?.historico_limpo_em ?? null;
      pedirDados = link?.pedir_dados !== false;
    }

    let eventos: { created_at: string; source: string }[] = [];
    if (plate.dynamic_link_id) {
      let query = supabaseAdmin
        .from("link_scan_events")
        .select("created_at, source")
        .eq("link_id", plate.dynamic_link_id)
        .order("created_at", { ascending: false })
        .limit(5000);
      if (marco) query = query.gt("created_at", marco);
      const { data } = await query;
      eventos = data ?? [];
    }

    let leadsQuery = supabaseAdmin
      .from("review_leads")
      .select("telefone, data_nascimento, created_at")
      .eq("plate_id", plate.id)
      .order("created_at", { ascending: false })
      .limit(2000);
    if (marco) leadsQuery = leadsQuery.gt("created_at", marco);
    const { data: leadsData } = await leadsQuery;
    const telefones = leadsData ?? [];

    const porDia: Record<string, number> = {};
    const porMes: Record<string, number> = {};
    const porAno: Record<string, number> = {};
    const porOrigem: Record<string, number> = { QR: 0, NFC: 0, UNKNOWN: 0 };

    for (const ev of eventos) {
      const d = new Date(ev.created_at);
      const dia = d.toISOString().slice(0, 10); // YYYY-MM-DD
      const mes = dia.slice(0, 7); // YYYY-MM
      const ano = dia.slice(0, 4); // YYYY
      porDia[dia] = (porDia[dia] ?? 0) + 1;
      porMes[mes] = (porMes[mes] ?? 0) + 1;
      porAno[ano] = (porAno[ano] ?? 0) + 1;
      const src = ev.source ?? "UNKNOWN";
      porOrigem[src] = (porOrigem[src] ?? 0) + 1;
    }

    return json(
      {
        codigo: plate.codigo,
        empresa,
        status: plate.status,
        pedirDados,
        totalAcessos: eventos.length,
        porDia,
        porMes,
        porAno,
        porOrigem,
        telefones,
      },
      200
    );
  } catch (e) {
    console.error(e);
    return json({ error: "Erro interno." }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
