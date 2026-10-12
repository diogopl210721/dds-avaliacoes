import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { cleanContent, text, RESERVED, SLUG_RE } from "./content.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const SITE = "https://www.ddsinovacao.com.br";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
});

// O endereço www.ddsinovacao.com.br/<slug> está livre para esta página?
async function slugCheck(slug: string, pageId: string | null): Promise<{ available: boolean; message?: string }> {
  if (!SLUG_RE.test(slug)) return { available: false, message: "Use de 3 a 60 letras, números ou hífens." };
  if (RESERVED.has(slug)) return { available: false, message: "Esse endereço é reservado. Escolha outro." };
  const { data: other, error } = await db.from("mini_pages").select("id").eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (other && other.id !== pageId) return { available: false, message: "Esse endereço já está em uso. Escolha outro." };
  // Uma pasta ou outro sistema do site com esse nome também ocupa o endereço.
  try {
    const r = await fetch(`${SITE}/${slug}/`, { redirect: "manual", signal: AbortSignal.timeout(4000) });
    if (r.status === 200) {
      const page = await r.text();
      if (!page.includes('name="dds-mini-page"')) return { available: false, message: "Esse endereço já é usado por outra página do site. Escolha outro." };
    } else await r.body?.cancel();
  } catch { /* Sem resposta do site: a validação do banco continua valendo. */ }
  return { available: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);
  try {
    const body = await req.json();
    const codigo = text(body.codigo, 60).toUpperCase();
    const senha = text(body.senha, 4);
    if (!codigo || !/^\d{4}$/.test(senha) || String(body.senha).length !== 4) return json({ error: "Informe código e senha de quatro números." }, 400);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const key = "mini:" + codigo + ":" + ip;
    const { data: allowed, error: rateError } = await db.rpc("consume_plate_mini_attempt", { p_key: key, p_limit: 8 });
    if (rateError) throw rateError;
    if (!allowed) return json({ error: "Muitas tentativas. Aguarde 15 minutos." }, 429);
    const { data: plate, error: plateError } = await db.from("plates")
      .select("id, codigo, pin_hash, status, company_id, oculta, mini_site_enabled")
      .eq("codigo", codigo).maybeSingle();
    if (plateError) throw plateError;
    if (!plate || !bcrypt.compareSync(senha, plate.pin_hash)) return json({ error: "Código ou senha inválidos." }, 401);
    await db.from("plate_mini_attempts").delete().eq("key", key);
    if (plate.oculta || plate.status !== "ATIVA" || !plate.company_id) return json({ error: "Esta placa precisa estar ativada para acessar o mini site." }, 403);
    if (body.action === "get") {
      const { data: page, error } = await db.from("mini_pages").select("id, slug, content, published").eq("plate_id", plate.id).eq("plate_company_id", plate.company_id).maybeSingle();
      if (error) throw error;
      const { data: company } = await db.from("companies").select("nome, write_a_review_uri").eq("id", plate.company_id).maybeSingle();
      return json({ enabled: plate.mini_site_enabled, page, company });
    }
    // Every write is checked on the server, including signed photo uploads.
    if (!plate.mini_site_enabled) return json({ error: "Seu mini site aguarda liberação do administrador após o pagamento." }, 403);
    const { data: existing, error: lookupError } = await db.from("mini_pages").select("id, slug").eq("plate_id", plate.id).eq("plate_company_id", plate.company_id).maybeSingle();
    if (lookupError) throw lookupError;
    if (body.action === "check-slug") return json(await slugCheck(text(body.slug, 60), existing?.id ?? null));
    if (body.action === "upload") {
      const mime = text(body.mime, 40);
      const ext = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as Record<string, string>)[mime];
      if (!ext || !Number.isFinite(body.size) || body.size <= 0 || body.size > 5 * 1024 * 1024) return json({ error: "Envie JPG, PNG ou WebP de até 5 MB." }, 400);
      const path = "plates/" + plate.id + "/" + crypto.randomUUID() + "." + ext;
      const { data, error } = await db.storage.from("mini-page-images").createSignedUploadUrl(path);
      if (error) throw error;
      return json({ path, token: data.token, url: db.storage.from("mini-page-images").getPublicUrl(path).data.publicUrl });
    }
    if (body.action === "save") {
      const slug = text(body.slug, 60);
      if (!SLUG_RE.test(slug)) return json({ error: "Escolha um endereço de 3 a 60 letras e números." }, 400);
      let content;
      try { content = cleanContent(body.content); } catch (e) { return json({ error: (e as Error).message }, 400); }
      if (!existing || existing.slug !== slug || body.published === true) {
        const check = await slugCheck(slug, existing?.id ?? null);
        if (!check.available) return json({ error: check.message }, 409);
      }
      const payload = { plate_id: plate.id, plate_company_id: plate.company_id, owner_id: null, slug, content, published: body.published === true, updated_at: new Date().toISOString() };
      const query = existing ? db.from("mini_pages").update(payload).eq("id", existing.id).eq("plate_id", plate.id) : db.from("mini_pages").insert(payload);
      const { data: page, error } = await query.select("id, slug, content, published").single();
      if (error?.code === "23505") return json({ error: "Esse endereço já está em uso. Escolha outro nome." }, 409);
      if (error) throw error;
      return json({ page, url: `${SITE}/${page.slug}` });
    }
    return json({ error: "Ação inválida." }, 400);
  } catch (e) {
    console.error("plate-mini", e);
    return json({ error: "Não foi possível concluir. Tente novamente." }, 500);
  }
});
