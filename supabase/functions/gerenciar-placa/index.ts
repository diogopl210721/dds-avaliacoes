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
const MAX_ATTEMPTS = 8;
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

// Tira protocolo, "www." e barra final pra comparar links sem se importar
// com pequenas diferenças de digitação.
function nucleoDoLink(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const body = await req.json();
    const acao = String(body.acao ?? "");
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "sem-ip";

    if (acao === "trocar") return await trocar(body, ip);
    if (acao === "recuperar") return await recuperar(body, ip);
    return json({ error: "Ação inválida." }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: "Erro interno." }, 500);
  }
});

// Troca o link de destino de uma placa já ativada. Exige código + senha.
async function trocar(body: any, ip: string) {
  const codigo = String(body.codigo ?? "").trim().toUpperCase();
  const senha = String(body.senha ?? "").trim();
  const novoLink = String(body.novoLink ?? "").trim();

  if (!codigo || !senha || !novoLink) {
    return json({ error: "Preencha o código, a senha e o novo link." }, 400);
  }
  if (tooManyAttempts(`t:${codigo}`) || tooManyAttempts(`ti:${ip}`)) {
    return json({ error: "Muitas tentativas. Aguarde alguns minutos." }, 429);
  }
  if (!novoLink.startsWith("http")) {
    return json({ error: "Cole o link completo (começando com https://)." }, 400);
  }

  const genericError = { error: "Código ou senha inválidos." };
  const { data: plate } = await supabaseAdmin
    .from("plates")
    .select("id, pin_hash, status, company_id, dynamic_link_id")
    .eq("codigo", codigo)
    .maybeSingle();
  if (!plate || !bcrypt.compareSync(senha, plate.pin_hash)) return json(genericError, 400);
  if (plate.status === "BLOQUEADA" || plate.status === "DESATIVADA") {
    return json({ error: "Esta placa não está disponível." }, 400);
  }
  if (!plate.company_id || !plate.dynamic_link_id) {
    return json({ error: "Esta placa ainda não foi ativada." }, 400);
  }

  const { data: link } = await supabaseAdmin
    .from("dds_links")
    .select("destino_atual")
    .eq("id", plate.dynamic_link_id)
    .maybeSingle();

  await supabaseAdmin
    .from("companies")
    .update({ write_a_review_uri: novoLink, updated_at: new Date().toISOString() })
    .eq("id", plate.company_id);

  await supabaseAdmin
    .from("dds_links")
    .update({ destino_atual: novoLink, updated_at: new Date().toISOString() })
    .eq("id", plate.dynamic_link_id);

  await supabaseAdmin.from("link_destination_history").insert({
    link_id: plate.dynamic_link_id,
    destino_anterior: link?.destino_atual ?? null,
    destino_novo: novoLink,
    alterado_por: null,
  });

  return json({ ok: true }, 200);
}

// Descobre o código da placa a partir do link atual + senha.
async function recuperar(body: any, ip: string) {
  const link = String(body.link ?? "").trim();
  const senha = String(body.senha ?? "").trim();
  if (!link || !senha) return json({ error: "Informe o link atual e a senha." }, 400);

  if (tooManyAttempts(`r:${ip}`)) {
    return json({ error: "Muitas tentativas. Aguarde alguns minutos." }, 429);
  }

  const nucleo = nucleoDoLink(link);
  if (nucleo.length < 10) {
    return json({ error: "Cole o link completo que a placa abre hoje." }, 400);
  }
  const padrao = `%${nucleo.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

  const { data: candidatos } = await supabaseAdmin
    .from("dds_links")
    .select("id, codigo, destino_atual")
    .ilike("destino_atual", padrao)
    .limit(20);

  const notFound = { error: "Não encontramos uma placa com esse link e senha." };
  for (const c of candidatos ?? []) {
    const { data: plate } = await supabaseAdmin
      .from("plates")
      .select("codigo, pin_hash, status")
      .eq("dynamic_link_id", c.id)
      .maybeSingle();
    if (!plate || plate.status === "BLOQUEADA" || plate.status === "DESATIVADA") continue;
    if (bcrypt.compareSync(senha, plate.pin_hash)) {
      return json({ ok: true, codigo: plate.codigo }, 200);
    }
  }
  return json(notFound, 400);
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
