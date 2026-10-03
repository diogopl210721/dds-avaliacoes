// URL real pra onde o QR Code e o NFC apontam (a Edge Function scan-redirect).
// Enquanto o domínio curto (go.ddsinovacao.com.br) não estiver configurado de
// verdade no DNS, esse é o link que efetivamente funciona — é o mesmo valor
// usado como padrão (SCAN_BASE_URL) dentro da função admin-create-plates.
const SCAN_BASE_URL = "https://kwadhzmdaakxkztggigm.supabase.co/functions/v1/scan-redirect";

export function scanLink(slug: string, origem: "qr" | "nfc"): string {
  return `${SCAN_BASE_URL}/${slug}?src=${origem}`;
}
