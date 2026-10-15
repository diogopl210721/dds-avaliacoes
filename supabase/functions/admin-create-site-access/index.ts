import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

// Acesso só de mini site, para quem não tem (ou não quer) plaquinha.
// Cria, só com linhas novas: a empresa, um link interno pausado (exigido pela tabela de placas,
// nunca impresso em QR) e o acesso "SITE-0001" com senha de 4 números, já ativo.
// O mini site continua bloqueado até o admin liberar após o pagamento (mini_site_enabled).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUser = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) return json({ error: "Não autenticado." }, 401);
    const { data: profile } = await supabaseUser.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "admin") return json({ error: "Apenas administradores podem criar acessos." }, 403);

    const body = await req.json().catch(() => ({}));
    const nome = String(body.nome ?? "").trim().slice(0, 100);
    const telefone = String(body.telefone ?? "").replace(/\D/g, "").slice(0, 13);
    if (!nome) return json({ error: "Informe o nome da empresa." }, 400);

    // Próximo número da série SITE-0001, SITE-0002…
    const { data: ultimo, error: ultErr } = await admin.from("plates").select("codigo").like("codigo", "SITE-%")
      .order("codigo", { ascending: false }).limit(1);
    if (ultErr) throw ultErr;
    let numero = ultimo?.[0] ? (parseInt(String(ultimo[0].codigo).slice(5), 10) || 0) + 1 : 1;

    const { data: company, error: compErr } = await admin.from("companies")
      .insert({ nome, telefone: telefone || null }).select("id").single();
    if (compErr) throw compErr;

    for (let tentativa = 0; tentativa < 5; tentativa++, numero++) {
      const codigo = `SITE-${String(numero).padStart(4, "0")}`;
      const pin = String(Math.floor(1000 + Math.random() * 9000));
      const { data: link, error: linkErr } = await admin.from("dds_links").insert({
        codigo, slug: randomAlnum(10), produto: "minisite", status: "PAUSADO", company_id: company.id,
      }).select("id").single();
      if (linkErr) { if (linkErr.code === "23505") continue; throw linkErr; }
      const { error: plateErr } = await admin.from("plates").insert({
        codigo, pin_hash: bcrypt.hashSync(pin), pin, pin_used: true, status: "ATIVA", apelido: "Só mini site",
        company_id: company.id, dynamic_link_id: link.id, ativada_em: new Date().toISOString(),
      });
      if (plateErr) {
        await admin.from("dds_links").delete().eq("id", link.id);
        if (plateErr.code === "23505") continue;
        throw plateErr;
      }
      await admin.from("audit_logs").insert({ actor_id: user.id, action: "CRIACAO_ACESSO_MINI_SITE", details: { codigo, empresa: nome } });
      return json({ codigo, pin, empresa: nome, telefone }, 200);
    }
    return json({ error: "Não consegui gerar um código livre. Tente de novo." }, 409);
  } catch (e) {
    console.error("admin-create-site-access", e);
    return json({ error: "Não foi possível criar o acesso." }, 500);
  }
});

function randomAlnum(length: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...corsHeaders } });
}
