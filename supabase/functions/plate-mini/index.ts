import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
});
function text(value: unknown, max = 1000) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function url(value: unknown) {
  const s = text(value, 2000);
  if (!s) return "";
  try { const u = new URL(s); if (["https:", "http:"].includes(u.protocol)) return u.href; } catch { /* Invalid URL */ }
  throw new Error("Confira os links: use endereços completos começando com https://.");
}
function cleanContent(raw: any) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Dados da página inválidos.");
  const c: any = {};
  for (const key of ["name", "tagline", "description", "phone", "address", "hours"]) c[key] = text(raw[key], key === "description" ? 1800 : 1000);
  if (!c.name) throw new Error("Preencha o nome da empresa.");
  for (const key of ["facebook", "website", "maps", "review", "logo", "cover"]) c[key] = url(raw[key]);
  c.instagram = text(raw.instagram).startsWith("@") ? text(raw.instagram) : url(raw.instagram);
  c.theme = ["elegance", "viva", "essencial"].includes(raw.theme) ? raw.theme : "elegance";
  if (!Array.isArray(raw.gallery) || raw.gallery.length > 12 || !Array.isArray(raw.products) || raw.products.length > 60) throw new Error("Use até 12 fotos e 60 produtos.");
  c.gallery = raw.gallery.map(url);
  c.products = raw.products.map((p: any) => ({ id: text(p?.id, 100), name: text(p?.name), description: text(p?.description), price: text(p?.price, 100), image: url(p?.image) }));
  return c;
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
      if (!/^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/.test(slug)) return json({ error: "Escolha um endereço de 3 a 60 letras e números." }, 400);
      let content;
      try { content = cleanContent(body.content); } catch (e) { return json({ error: (e as Error).message }, 400); }
      const { data: existing, error: lookupError } = await db.from("mini_pages").select("id").eq("plate_id", plate.id).eq("plate_company_id", plate.company_id).maybeSingle();
      if (lookupError) throw lookupError;
      const payload = { plate_id: plate.id, plate_company_id: plate.company_id, owner_id: null, slug, content, published: body.published === true, updated_at: new Date().toISOString() };
      const query = existing ? db.from("mini_pages").update(payload).eq("id", existing.id).eq("plate_id", plate.id) : db.from("mini_pages").insert(payload);
      const { data: page, error } = await query.select("id, slug, content, published").single();
      if (error?.code === "23505") return json({ error: "Esse endereço já está em uso. Escolha outro nome." }, 409);
      if (error) throw error;
      return json({ page });
    }
    return json({ error: "Ação inválida." }, 400);
  } catch (e) {
    console.error("plate-mini", e);
    return json({ error: "Não foi possível concluir. Tente novamente." }, 500);
  }
});
