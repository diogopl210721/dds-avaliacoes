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

// Dois jeitos de provar que a pessoa tem a placa na mão:
//  1) `chave`: o slug secreto que vem no link da própria placa (QR/NFC). É o
//     caminho novo — o cliente não precisa digitar nada além do que quer.
//     Só vale enquanto a placa ainda não foi ativada.
//  2) `codigo` + `pin`: o PIN impresso/enviado pelo admin (caminho antigo,
//     serve de plano B quando a pessoa digita o código na mão).
// Em ambos, `senha` (4 números escolhidos pelo cliente) vira a senha da placa.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const { codigo, pin, chave, senha, nomeEmpresa, reviewLink, cidade, estado } =
      await req.json();

    const usandoChave = !!chave;
    if (!usandoChave && (!codigo || !pin)) {
      return json({ error: "Informe o código e o PIN da placa." }, 400);
    }

    const rateLimitKey = usandoChave
      ? `k:${String(chave).trim()}`
      : String(codigo).trim().toUpperCase();
    if (tooManyAttempts(rateLimitKey)) {
      return json(
        { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
        429
      );
    }

    const genericError = usandoChave
      ? { error: "Link de ativação inválido." }
      : { error: "Código ou PIN inválido." };

    let plate: any = null;

    if (usandoChave) {
      const { data: link } = await supabaseAdmin
        .from("dds_links")
        .select("id")
        .eq("slug", String(chave).trim())
        .maybeSingle();
      if (!link) return json(genericError, 400);
      const { data } = await supabaseAdmin
        .from("plates")
        .select("id, codigo, pin_hash, status, company_id, dynamic_link_id")
        .eq("dynamic_link_id", link.id)
        .maybeSingle();
      plate = data;
      if (!plate) return json(genericError, 400);
      // Com a chave, só deixa ativar uma placa ainda não ativada. Depois
      // disso, qualquer mudança exige a senha (tela "Trocar link").
      if (plate.company_id || plate.status === "ATIVA") {
        return json(
          { error: "Esta placa já foi ativada. Para mudar o link, use \"Trocar link\"." },
          400
        );
      }
    } else {
      const codigoNorm = String(codigo).trim().toUpperCase();
      const { data, error } = await supabaseAdmin
        .from("plates")
        .select("id, codigo, pin_hash, status, company_id, dynamic_link_id")
        .eq("codigo", codigoNorm)
        .maybeSingle();
      plate = data;
      if (error || !plate) return json(genericError, 400);
      if (!bcrypt.compareSync(String(pin), plate.pin_hash)) return json(genericError, 400);
    }

    if (plate.status === "BLOQUEADA" || plate.status === "DESATIVADA") {
      return json({ error: "Esta placa não está disponível." }, 400);
    }

    // Só código+PIN, sem dados de cadastro: validação simples.
    if (!nomeEmpresa && !reviewLink) {
      return json({ ok: true, jaCadastrada: !!plate.company_id, codigo: plate.codigo }, 200);
    }

    if (!nomeEmpresa || !reviewLink) {
      return json({ error: "Nome da empresa e link de avaliação são obrigatórios." }, 400);
    }
    if (!String(reviewLink).startsWith("http")) {
      return json({ error: "O link de avaliação parece inválido." }, 400);
    }

    const senhaStr = senha == null ? "" : String(senha).trim();
    if (usandoChave && !/^\d{4}$/.test(senhaStr)) {
      return json({ error: "Crie uma senha de 4 números." }, 400);
    }
    if (senhaStr && !/^\d{4}$/.test(senhaStr)) {
      return json({ error: "A senha deve ter exatamente 4 números." }, 400);
    }

    let companyId = plate.company_id as string | null;

    if (companyId) {
      await supabaseAdmin
        .from("companies")
        .update({
          nome: nomeEmpresa,
          write_a_review_uri: reviewLink,
          cidade: cidade ?? null,
          estado: estado ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", companyId);
    } else {
      const { data: company, error: companyErr } = await supabaseAdmin
        .from("companies")
        .insert({
          nome: nomeEmpresa,
          write_a_review_uri: reviewLink,
          cidade: cidade ?? null,
          estado: estado ?? null,
        })
        .select()
        .single();
      if (companyErr) throw companyErr;
      companyId = company.id;

      await supabaseAdmin.from("plates").update({ company_id: companyId }).eq("id", plate.id);
    }

    if (plate.dynamic_link_id) {
      const { data: link } = await supabaseAdmin
        .from("dds_links")
        .select("destino_atual")
        .eq("id", plate.dynamic_link_id)
        .maybeSingle();

      await supabaseAdmin
        .from("dds_links")
        .update({
          destino_atual: reviewLink,
          company_id: companyId,
          status: "ATIVO",
          updated_at: new Date().toISOString(),
        })
        .eq("id", plate.dynamic_link_id);

      await supabaseAdmin.from("link_destination_history").insert({
        link_id: plate.dynamic_link_id,
        destino_anterior: link?.destino_atual ?? null,
        destino_novo: reviewLink,
        alterado_por: null,
      });
    }

    const update: Record<string, unknown> = {
      status: "ATIVA",
      ativada_em: new Date().toISOString(),
      pin_used: true,
    };
    if (senhaStr) {
      // A senha escolhida pelo cliente passa a ser o PIN da placa (hash pra
      // validar, texto puro na coluna `pin` pro suporte/admin conseguir ver).
      update.pin_hash = bcrypt.hashSync(senhaStr);
      update.pin = senhaStr;
    }
    await supabaseAdmin.from("plates").update(update).eq("id", plate.id);

    return json({ ok: true, empresa: nomeEmpresa, codigo: plate.codigo }, 200);
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
