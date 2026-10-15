import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

// Acesso só de mini site, para quem não tem (ou não quer) plaquinha. Só o admin usa.
//
// Criar ({ nome, telefone }): cria, só com linhas novas, a empresa, um link interno pausado
// (exigido pela tabela de placas, nunca impresso em QR) e o acesso SITE101, SITE102…
// O acesso nasce esperando o cliente: ele recebe pelo WhatsApp um link de ativação
// (www.ddsinovacao.com.br/dds-avaliacoes/#/minisite?ativar=<chave>) e escolhe a própria senha de
// 4 números (função site-access). O mini site já nasce liberado: o admin só gera depois do pagamento.
//
// Novo link ({ acao: "novo-link", codigo }): para quem esqueceu a senha. A senha antiga para de
// valer na hora e um novo link de ativação é gerado. Só funciona para códigos SITE.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const LINK = "https://www.ddsinovacao.com.br/dds-avaliacoes/#/minisite?ativar=";
const SITE_RE = /^SITE-?(\d+)$/i;

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

    // ---------- Novo link de senha ----------
    if (body.acao === "novo-link") {
      const codigo = String(body.codigo ?? "").trim().toUpperCase();
      if (!SITE_RE.test(codigo)) return json({ error: "Só acessos de mini site (SITE) usam link de senha." }, 400);
      const { data: plate, error } = await admin.from("plates")
        .select("id, codigo, status, dynamic_link_id, companies(nome, telefone)").eq("codigo", codigo).maybeSingle();
      if (error) throw error;
      if (!plate) return json({ error: "Acesso não encontrado." }, 404);
      if (plate.status === "BLOQUEADA") return json({ error: "Este acesso está bloqueado. Desbloqueie antes de gerar um novo link." }, 400);

      const chave = await novaChave(admin, plate.dynamic_link_id);
      const { error: upErr } = await admin.from("plates").update({
        status: "AGUARDANDO_ATIVACAO", pin_used: false, pin: null, pin_hash: bcrypt.hashSync(randomAlnum(24)),
      }).eq("id", plate.id);
      if (upErr) throw upErr;
      await admin.from("audit_logs").insert({ actor_id: user.id, action: "NOVO_LINK_SENHA_MINI_SITE", target_type: "plate", target_id: plate.id, details: { codigo } });
      const company = (plate as any).companies ?? {};
      return json({ codigo, link: LINK + chave, empresa: company.nome ?? "", telefone: company.telefone ?? "" }, 200);
    }

    // ---------- Criar acesso ----------
    const nome = String(body.nome ?? "").trim().slice(0, 100);
    const telefone = String(body.telefone ?? "").replace(/\D/g, "").slice(0, 13);
    if (!nome) return json({ error: "Informe o nome da empresa." }, 400);

    // Próximo número da série SITE101, SITE102… (lê também o formato antigo SITE-0001, se houver).
    const { data: codigos, error: ultErr } = await admin.from("plates").select("codigo").ilike("codigo", "SITE%");
    if (ultErr) throw ultErr;
    let numero = Math.max(100, ...(codigos ?? []).map(r => Number(SITE_RE.exec(String(r.codigo))?.[1] ?? 0))) + 1;

    const { data: company, error: compErr } = await admin.from("companies")
      .insert({ nome, telefone: telefone || null }).select("id").single();
    if (compErr) throw compErr;

    for (let tentativa = 0; tentativa < 6; tentativa++, numero++) {
      const codigo = `SITE${numero}`;
      const chave = randomAlnum(12);
      const { data: link, error: linkErr } = await admin.from("dds_links").insert({
        codigo, slug: chave, produto: "minisite", status: "PAUSADO", company_id: company.id,
      }).select("id").single();
      if (linkErr) { if (linkErr.code === "23505") continue; throw linkErr; }
      const { data: plate, error: plateErr } = await admin.from("plates").insert({
        codigo, pin_hash: bcrypt.hashSync(randomAlnum(24)), pin: null, pin_used: false, status: "AGUARDANDO_ATIVACAO",
        apelido: "Só mini site", company_id: company.id, dynamic_link_id: link.id, mini_site_enabled: true,
      }).select("id").single();
      if (plateErr) {
        await admin.from("dds_links").delete().eq("id", link.id);
        if (plateErr.code === "23505") continue;
        throw plateErr;
      }
      await admin.from("audit_logs").insert({ actor_id: user.id, action: "CRIACAO_ACESSO_MINI_SITE", target_type: "plate", target_id: plate.id, details: { codigo, empresa: nome } });
      return json({ codigo, link: LINK + chave, empresa: nome, telefone }, 200);
    }
    return json({ error: "Não consegui gerar um código livre. Tente de novo." }, 409);
  } catch (e) {
    console.error("admin-create-site-access", e);
    return json({ error: "Não foi possível concluir. Tente de novo." }, 500);
  }
});

// Troca a chave (slug do link interno do acesso), invalidando o link antigo.
async function novaChave(admin: any, linkId: string): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const chave = randomAlnum(12);
    const { error } = await admin.from("dds_links").update({ slug: chave }).eq("id", linkId);
    if (!error) return chave;
    if (error.code !== "23505") throw error;
  }
  throw new Error("Sem chave livre.");
}

function randomAlnum(length: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
  return out;
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...corsHeaders } });
}
