// Busca a empresa no Google (Places API New) a partir de um link do Google Maps ou de "nome e cidade".
// Só segue links de domínios do Google, para não virar um proxy aberto.
const KEY = () => Deno.env.get("GOOGLE_PLACES_API_KEY") ?? "";
const API = "https://places.googleapis.com/v1";
const GOOGLE_HOST = /(^|\.)(google\.[a-z.]{2,8}|goo\.gl|g\.page|g\.co|share\.google)$/i;
const DETAILS_MASK = [
  "id", "displayName", "formattedAddress", "nationalPhoneNumber", "websiteUri", "regularOpeningHours",
  "primaryType", "primaryTypeDisplayName", "types", "rating", "userRatingCount", "reviews", "editorialSummary", "googleMapsLinks", "googleMapsUri",
].join(",");

export type Candidate = { id: string; name: string; address: string };
type Hint = { placeId?: string; name?: string; lat?: number; lng?: number };

export function hintFromUrl(raw: string): Hint {
  let url: URL;
  try { url = new URL(raw); } catch { return {}; }
  const cont = url.searchParams.get("continue");
  if (cont) { const inner = hintFromUrl(cont); if (inner.placeId || inner.name) return inner; }
  const pid = url.searchParams.get("placeid") || url.searchParams.get("place_id") || raw.match(/place_id[:=]([A-Za-z0-9_-]{20,})/)?.[1];
  if (pid) return { placeId: pid };
  const hint: Hint = {};
  const place = url.pathname.match(/\/maps\/place\/([^/]+)/);
  if (place) hint.name = decodeURIComponent(place[1].replace(/\+/g, " "));
  const q = url.searchParams.get("q") || url.searchParams.get("query");
  if (!hint.name && q && !/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(q)) hint.name = q;
  const d = raw.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) || raw.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (d) { hint.lat = Number(d[1]); hint.lng = Number(d[2]); }
  return hint;
}

// Segue redirecionamentos (links curtos maps.app.goo.gl, g.page…) conferindo o domínio a cada passo.
async function resolveLink(raw: string): Promise<Hint> {
  let current = raw;
  for (let i = 0; i < 6; i++) {
    let url: URL;
    try { url = new URL(current); } catch { return {}; }
    if (url.protocol !== "https:" && url.protocol !== "http:") return {};
    if (!GOOGLE_HOST.test(url.hostname)) return {};
    const hint = hintFromUrl(current);
    if (hint.placeId || (hint.name && url.pathname.includes("/maps/place/"))) return hint;
    const r = await fetch(current, { redirect: "manual", headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36", "Accept-Language": "pt-BR,pt;q=0.9" }, signal: AbortSignal.timeout(5000) });
    const next = r.headers.get("location");
    if (r.status >= 300 && r.status < 400 && next) { await r.body?.cancel(); current = new URL(next, current).href; continue; }
    if (hint.name) { await r.body?.cancel(); return hint; }
    // Página final sem nome no endereço (ex.: ?cid=…): tenta o título da página.
    const html = (await r.text()).slice(0, 400_000);
    const title = html.match(/<meta[^>]+(?:property|itemprop)="(?:og:title|name)"[^>]+content="([^"]+)"/i)?.[1] ?? html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? "";
    const name = title.replace(/\s*[-·]\s*Google Maps.*$/i, "").split(" · ")[0].trim();
    return name && !/^google maps$/i.test(name) ? { name } : {};
  }
  return {};
}

async function searchText(textQuery: string, lat?: number, lng?: number): Promise<Candidate[]> {
  const body: Record<string, unknown> = { textQuery, languageCode: "pt-BR", regionCode: "BR", pageSize: 5 };
  if (lat != null && lng != null) body.locationBias = { circle: { center: { latitude: lat, longitude: lng }, radius: 800 } };
  const r = await fetch(`${API}/places:searchText`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": KEY(), "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress" },
    body: JSON.stringify(body), signal: AbortSignal.timeout(8000),
  });
  const data = await r.json();
  if (!r.ok) { console.error("places search", r.status, JSON.stringify(data)); throw new Error("google"); }
  return (data.places ?? []).slice(0, 5).map((p: any) => ({ id: p.id, name: p.displayName?.text ?? "", address: p.formattedAddress ?? "" }));
}

async function details(placeId: string) {
  if (!/^[A-Za-z0-9_-]{10,300}$/.test(placeId)) throw new Error("google");
  const r = await fetch(`${API}/places/${placeId}?languageCode=pt-BR&regionCode=BR`, { headers: { "X-Goog-Api-Key": KEY(), "X-Goog-FieldMask": DETAILS_MASK }, signal: AbortSignal.timeout(8000) });
  const p = await r.json();
  if (!r.ok) { console.error("places details", r.status, JSON.stringify(p)); throw new Error("google"); }
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  return {
    placeId: str(p.id, 300), name: str(p.displayName?.text, 100), address: str(p.formattedAddress, 300),
    phone: str(p.nationalPhoneNumber, 30), website: str(p.websiteUri, 300),
    hours: Array.isArray(p.regularOpeningHours?.weekdayDescriptions) ? p.regularOpeningHours.weekdayDescriptions.slice(0, 7).map((x: unknown) => str(x, 80)) : [],
    primaryType: str(p.primaryType, 60), types: Array.isArray(p.types) ? p.types.slice(0, 20).map((x: unknown) => str(x, 60)) : [],
    category: str(p.primaryTypeDisplayName?.text, 80),
    rating: typeof p.rating === "number" ? p.rating : null, ratingCount: typeof p.userRatingCount === "number" ? p.userRatingCount : null,
    reviews: Array.isArray(p.reviews) ? p.reviews.slice(0, 5).map((v: any) => ({ author: str(v.authorAttribution?.displayName, 60), rating: Number(v.rating) || 0, text: str(v.text?.text ?? v.originalText?.text, 600) })) : [],
    summary: str(p.editorialSummary?.text, 400), mapsUri: str(p.googleMapsLinks?.placeUri ?? p.googleMapsUri, 500), reviewUri: str(p.googleMapsLinks?.writeAReviewUri, 500),
  };
}

// placeId direto (pessoa escolheu da lista) ou consulta: link do Google ou "nome e cidade".
export async function googleLookup(query: string, placeId?: string) {
  if (!KEY()) throw new Error("google");
  if (placeId) return { place: await details(placeId) };
  const text = query.trim();
  const isLink = /^https?:\/\//i.test(text) || /^(maps\.app\.goo\.gl|goo\.gl|g\.page|www\.google|google\.)/i.test(text);
  if (isLink) {
    const hint = await resolveLink(/^https?:\/\//i.test(text) ? text : `https://${text}`);
    if (hint.placeId) return { place: await details(hint.placeId) };
    if (!hint.name) return { error: "Não consegui ler esse link. Digite o nome e a cidade da empresa." };
    const found = await searchText(hint.name, hint.lat, hint.lng);
    if (found.length === 0) return { error: "Não encontrei a empresa desse link. Digite o nome e a cidade." };
    return hint.lat != null || found.length === 1 ? { place: await details(found[0].id) } : { candidates: found };
  }
  const found = await searchText(text);
  if (found.length === 0) return { error: "Nenhuma empresa encontrada. Tente nome e cidade." };
  return found.length === 1 ? { place: await details(found[0].id) } : { candidates: found };
}
