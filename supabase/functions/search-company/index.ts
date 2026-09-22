// supabase/functions/search-company/index.ts
//
// Recebe { query: "nome da empresa" }, chama o Google Places API (New) —
// Text Search — e devolve só os campos necessários para o cliente escolher
// a empresa certa. A chave da Google fica só aqui (env var), nunca no SPA.
//
// Deploy: supabase functions deploy search-company
// Requer o secret: supabase secrets set GOOGLE_PLACES_API_KEY=xxxxx

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY")!;

// Field mask: pedimos só o essencial para a busca inicial. Repare que
// "rating" e "userRatingCount" pertencem ao SKU mais caro (Enterprise) —
// então NÃO pedimos eles aqui na etapa de busca, só depois de o cliente
// confirmar qual é a empresa dele (ver seleção abaixo).
const SEARCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
].join(",");

const DETAILS_FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "rating",
  "userRatingCount",
  "googleMapsLinks",
].join(",");

Deno.serve(async (req) => {
  try {
    const { action, query, placeId } = await req.json();

    if (action === "search") {
      if (!query) return json({ error: "query é obrigatório" }, 400);

      const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_API_KEY,
          "X-Goog-FieldMask": SEARCH_FIELD_MASK,
        },
        body: JSON.stringify({ textQuery: query, languageCode: "pt-BR" }),
      });

      const data = await res.json();
      return json({ places: data.places ?? [] }, 200);
    }

    if (action === "select") {
      // Chamado quando o cliente clica em "ESTA É MINHA EMPRESA" — aqui sim
      // pagamos o SKU Enterprise, mas só 1x por ativação de placa.
      if (!placeId) return json({ error: "placeId é obrigatório" }, 400);

      const res = await fetch(
        `https://places.googleapis.com/v1/places/${placeId}`,
        {
          headers: {
            "X-Goog-Api-Key": GOOGLE_API_KEY,
            "X-Goog-FieldMask": DETAILS_FIELD_MASK,
          },
        }
      );
      const place = await res.json();

      return json(
        {
          google_place_id: place.id,
          nome: place.displayName?.text,
          endereco: place.formattedAddress,
          rating: place.rating ?? null,
          review_count: place.userRatingCount ?? null,
          google_maps_uri: place.googleMapsLinks?.placeUri ?? null,
          write_a_review_uri: place.googleMapsLinks?.writeAReviewUri ?? null,
        },
        200
      );
    }

    return json({ error: "action inválida" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: "Erro interno." }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
