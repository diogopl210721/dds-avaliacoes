import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import QRCode from "npm:qrcode@1.5.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SCAN_BASE_URL =
  Deno.env.get("SCAN_BASE_URL") ??
  "https://kwadhzmdaakxkztggigm.supabase.co/functions/v1/scan-redirect";
const BUCKET = "qr-codes";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
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

  const { data: profile } = await supabaseUser
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    return json({ error: "Apenas administradores podem criar placas." }, 403);
  }

  const { quantidade } = await req.json();
  const qtd = Math.min(Math.max(Number(quantidade) || 1, 1), 500);

  const criadas = [];
  for (let i = 0; i < qtd; i++) {
    try {
      const { data: codigoData, error: codigoErr } = await supabaseAdmin.rpc("next_dds_codigo");
      if (codigoErr) throw codigoErr;
      const codigo = codigoData as string; // ex: DDS215 — único código usado tanto na placa quanto no link

      const slug = randomAlnum(8);
      const pin = String(Math.floor(1000 + Math.random() * 9000)); // PIN de 4 dígitos
      const pinHash = bcrypt.hashSync(pin);

      const urlQr = `${SCAN_BASE_URL}/${slug}?src=qr`;
      const urlNfc = `${SCAN_BASE_URL}/${slug}?src=nfc`;

      const qrPngBuffer = await QRCode.toBuffer(urlQr, { width: 512, margin: 1, type: "png" });
      const qrSvgString = await QRCode.toString(urlQr, { type: "svg", margin: 1 });

      const pngPath = `${slug}.png`;
      const svgPath = `${slug}.svg`;
      await supabaseAdmin.storage.from(BUCKET).upload(pngPath, qrPngBuffer, {
        contentType: "image/png",
        upsert: true,
      });
      await supabaseAdmin.storage.from(BUCKET).upload(svgPath, new TextEncoder().encode(qrSvgString), {
        contentType: "image/svg+xml",
        upsert: true,
      });

      const { data: link, error: linkError } = await supabaseAdmin
        .from("dds_links")
        .insert({
          codigo,
          slug,
          produto: "avaliacoes",
          status: "AGUARDANDO_DESTINO",
          qr_png_path: pngPath,
          qr_svg_path: svgPath,
        })
        .select()
        .single();
      if (linkError) throw linkError;

      // Guarda o PIN também em texto puro (coluna `pin`) para o admin poder
      // consultar depois e passar ao cliente — o hash continua sendo o que
      // de fato valida o login do cliente.
      const { error: plateError } = await supabaseAdmin.from("plates").insert({
        codigo,
        pin_hash: pinHash,
        pin,
        status: "AGUARDANDO_ATIVACAO",
        dynamic_link_id: link.id,
      });
      if (plateError) throw plateError;

      const qrPngDataUrl = `data:image/png;base64,${bufferToBase64(qrPngBuffer)}`;

      criadas.push({
        codigo,
        slug,
        pin,
        urlQr,
        urlNfc,
        qrPngDataUrl,
      });
    } catch (e) {
      console.error("falha ao criar placa/link:", e);
    }
  }

  await supabaseAdmin.from("audit_logs").insert({
    actor_id: user.id,
    action: "CRIACAO_LOTE_PLACAS",
    details: { quantidade: criadas.length },
  });

  return json({ criadas }, 200);
});

function randomAlnum(length: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function bufferToBase64(buf: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
  return btoa(binary);
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
