// supabase/functions/scan-redirect/index.ts
//
// Este é o motor DDS LINKS em ação: o QR e o NFC apontam para esta
// função via slug. Ela NÃO sabe nada sobre "placa" nem "avaliação
// Google" — só resolve slug -> destino_atual e registra o acesso.
// Isso é o que permite trocar o destino sem reimprimir nada.
//
// Ex.: https://<project>.functions.supabase.co/scan-redirect/Q7K29P?src=qr
//
// Deploy: supabase functions deploy scan-redirect --no-verify-jwt

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const FALLBACK_URL = Deno.env.get("FALLBACK_URL") ?? "https://ddsinovacao.com.br";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const slug = url.pathname.split("/").filter(Boolean).pop();
  const srcParam = (url.searchParams.get("src") ?? "unknown").toUpperCase();
  const source = ["QR", "NFC"].includes(srcParam) ? srcParam : "UNKNOWN";

  if (!slug) return Response.redirect(FALLBACK_URL, 302);

  const { data: link } = await supabaseAdmin
    .from("dds_links")
    .select("id, status, destino_atual, company_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!link) return Response.redirect(FALLBACK_URL, 302);

  if (link.status === "AGUARDANDO_DESTINO" || !link.destino_atual) {
    // Placa ainda não ativada -> manda para a ativação. O código+PIN
    // impressos na própria placa são o que o consumidor digita lá; não dá
    // (nem precisa) prefill-ar pelo slug do link.
    return Response.redirect("https://avaliacao.ddsinovacao.com.br/ativar", 302);
  }

  if (link.status === "PAUSADO") {
    return Response.redirect(`${FALLBACK_URL}/placa-pausada`, 302);
  }

  const target = link.destino_atual;

  const ua = req.headers.get("user-agent") ?? "";
  const geo = await geolocate(req);
  const insertPromise = supabaseAdmin.from("link_scan_events").insert({
    link_id: link.id,
    company_id: link.company_id,
    source,
    device_type: detectDevice(ua),
    browser: detectBrowser(ua),
    operating_system: detectOS(ua),
    referrer: req.headers.get("referer") ?? null,
    country: geo.country,
    region: geo.region,
    city: geo.city,
  }).then(({ error }) => {
    if (error) console.error("scan insert failed:", error);
  });

  // @ts-ignore - EdgeRuntime existe no runtime do Supabase Edge Functions
  if (typeof EdgeRuntime !== "undefined") {
    // @ts-ignore
    EdgeRuntime.waitUntil(insertPromise);
  } else {
    await insertPromise;
  }

  return Response.redirect(target, 302);
});

async function geolocate(req: Request): Promise<{ country: string | null; region: string | null; city: string | null }> {
  const cfCountry = req.headers.get("cf-ipcountry");
  if (cfCountry && cfCountry !== "XX") {
    return { country: cfCountry, region: null, city: null };
  }
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip");
  if (!ip) return { country: null, region: null, city: null };
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,regionName,city`);
    const data = await res.json();
    return { country: data.country ?? null, region: data.regionName ?? null, city: data.city ?? null };
  } catch {
    return { country: null, region: null, city: null };
  }
}

function detectDevice(ua: string) {
  if (/mobile/i.test(ua)) return "mobile";
  if (/tablet/i.test(ua)) return "tablet";
  return "desktop";
}
function detectBrowser(ua: string) {
  if (/chrome/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return "Safari";
  if (/firefox/i.test(ua)) return "Firefox";
  return "Outro";
}
function detectOS(ua: string) {
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ios/i.test(ua)) return "iOS";
  if (/windows/i.test(ua)) return "Windows";
  if (/mac os/i.test(ua)) return "macOS";
  return "Outro";
}
