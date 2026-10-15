import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

// Link de ativação do acesso só de mini site (SITE101…), aberto pelo cliente:
// www.ddsinovacao.com.br/dds-avaliacoes/#/minisite?ativar=<chave>
//  - { acao: "info", chave }           → { codigo, empresa }  (o link ainda vale?)
//  - { acao: "ativar", chave, senha }  → { codigo }           (cliente escolhe a senha de 4 números)
// O link só vale enquanto o acesso espera a senha. Depois disso, o cliente entra com código e senha,
// e um novo link só sai pelo admin ("Gerar novo link de senha"). Nunca toca em placas: só códigos SITE.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const SITE_RE = /^SITE-?\d+$/i;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
});
const usado = { error: "Este link já foi usado ou não vale mais. Entre com seu código e senha, ou peça um novo link pelo WhatsApp.", usado: true };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const chave = String(body.chave ?? "").trim().toUpperCase();
    if (!/^[A-Z0-9]{8,20}$/.test(chave)) return json(usado, 400);

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { data: allowed, error: rateError } = await db.rpc("consume_plate_mini_attempt", { p_key: "ativar-site:" + ip, p_limit: 20 });
    if (rateError) throw rateError;
    if (!allowed) return json({ error: "Muitas tentativas. Aguarde 15 minutos." }, 429);

    const { data: link, error: linkErr } = await db.from("dds_links").select("id").eq("slug", chave).maybeSingle();
    if (linkErr) throw linkErr;
    if (!link) return json(usado, 404);
    const { data: plate, error: plateErr } = await db.from("plates")
      .select("id, codigo, status, oculta, company_id, companies(nome)").eq("dynamic_link_id", link.id).maybeSingle();
    if (plateErr) throw plateErr;
    if (!plate || !SITE_RE.test(plate.codigo) || plate.oculta || plate.status !== "AGUARDANDO_ATIVACAO") return json(usado, 404);
    const empresa = (plate as any).companies?.nome ?? "";

    if (body.acao === "info") return json({ codigo: plate.codigo, empresa });

    if (body.acao === "ativar") {
      const senha = String(body.senha ?? "");
      if (!/^\d{4}$/.test(senha)) return json({ error: "A senha deve ter exatamente 4 números." }, 400);
      // Só ativa se ainda estiver esperando (dois toques ao mesmo tempo não criam duas senhas).
      const { data: feito, error: upErr } = await db.from("plates").update({
        pin_hash: bcrypt.hashSync(senha), pin: null, pin_used: true, status: "ATIVA", ativada_em: new Date().toISOString(),
      }).eq("id", plate.id).eq("status", "AGUARDANDO_ATIVACAO").select("id");
      if (upErr) throw upErr;
      if (!feito?.length) return json(usado, 409);
      await db.from("audit_logs").insert({ actor_id: null, action: "SENHA_CRIADA_MINI_SITE", target_type: "plate", target_id: plate.id, details: { codigo: plate.codigo } });
      return json({ codigo: plate.codigo, empresa });
    }
    return json({ error: "Ação inválida." }, 400);
  } catch (e) {
    console.error("site-access", e);
    return json({ error: "Não foi possível concluir. Tente de novo." }, 500);
  }
});
