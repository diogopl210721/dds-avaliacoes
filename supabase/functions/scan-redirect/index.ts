import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Site real (confirmado funcionando) — o dominio curto
// avaliacao.ddsinovacao.com.br nunca foi configurado no DNS, por isso NAO
// pode ser usado aqui (link morto = "nao e possivel acessar o site" pro
// cliente que acabou de escanear a placa).
const BASE_URL = Deno.env.get("BASE_URL") ?? "https://www.ddsinovacao.com.br/dds-avaliacoes";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const slug = url.pathname.split("/").filter(Boolean).pop();
  const srcParam = (url.searchParams.get("src") ?? "unknown").toUpperCase();
  const source = ["QR", "NFC"].includes(srcParam) ? srcParam : "UNKNOWN";

  if (!slug) return Response.redirect(`${BASE_URL}/#/`, 302);

  // Traz o link, a placa dona dele (pra gravar o acesso) e o nome da
  // empresa (pra mostrar na telinha de "deixe seu telefone").
  const { data: link } = await supabaseAdmin
    .from("dds_links")
    .select("id, codigo, status, destino_atual, company_id, plates(id), companies(nome)")
    .eq("slug", slug)
    .maybeSingle();

  if (!link) return Response.redirect(`${BASE_URL}/#/`, 302);

  const plateId: string | null = Array.isArray((link as any).plates)
    ? (link as any).plates[0]?.id ?? null
    : (link as any).plates?.id ?? null;

  if (link.status === "AGUARDANDO_DESTINO" || !link.destino_atual) {
    // Placa ainda nao ativada -> manda para a ativacao ja com o codigo e com
    // a chave secreta da placa (o proprio slug), que prova que a pessoa esta
    // com a placa na mao. Assim ela nao digita codigo nem PIN: so escolhe a
    // senha dela.
    const destino =
      `${BASE_URL}/#/ativar?codigo=${encodeURIComponent(link.codigo)}` +
      `&k=${encodeURIComponent(slug)}`;
    return Response.redirect(destino, 302);
  }

  if (link.status === "PAUSADO") {
    return Response.redirect(`${BASE_URL}/#/`, 302);
  }

  const target = link.destino_atual;

  const ua = req.headers.get("user-agent") ?? "";
  const geo = await geolocate(req);

  async function registrarAcesso() {
    if (!plateId) {
      console.error("scan sem plate_id (link sem placa associada?) slug=", slug);
      return;
    }
    const { error } = await supabaseAdmin.from("link_scan_events").insert({
      link_id: link.id,
      plate_id: plateId,
      company_id: link.company_id,
      source,
      device_type: detectDevice(ua),
      browser: detectBrowser(ua),
      operating_system: detectOS(ua),
      referrer: req.headers.get("referer") ?? null,
      country: geo.country,
      region: geo.region,
      city: geo.city,
    });
    if (error) console.error("scan insert failed:", error);

    const { error: updError } = await supabaseAdmin
      .from("plates")
      .update({ ultimo_acesso_em: new Date().toISOString() })
      .eq("id", plateId);
    if (updError) console.error("ultimo_acesso_em update failed:", updError);
  }

  const registroPromise = registrarAcesso();

  // @ts-ignore - EdgeRuntime existe no runtime do Supabase Edge Functions
  if (typeof EdgeRuntime !== "undefined") {
    // @ts-ignore
    EdgeRuntime.waitUntil(registroPromise);
  } else {
    await registroPromise;
  }

  // Em vez de ir direto pro Google, manda pra telinha intermediaria do
  // app (pede o telefone, opcional, com "Pular" bem visivel) que so entao
  // redireciona pro link real do Google. O acesso ja foi contabilizado
  // acima, independente do que a pessoa fizer nessa tela.
  const nomeEmpresa = (link as any).companies?.nome ?? "";
  const interstitial =
    `${BASE_URL}/#/avaliar?slug=${encodeURIComponent(slug)}` +
    `&dest=${encodeURIComponent(target)}` +
    `&empresa=${encodeURIComponent(nomeEmpresa)}`;

  return Response.redirect(interstitial, 302);
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
