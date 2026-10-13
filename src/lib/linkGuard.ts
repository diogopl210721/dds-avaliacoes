// Link de destino que aponta para a própria plaquinha (o link do QR/NFC) ou para a tela de
// avaliação da DDS: quem escaneia voltaria para a mesma tela sem fim, e cada volta contaria
// como um acesso a mais. Aconteceu com uma placa real; por isso os formulários barram.
export function linkDaPropriaPlaca(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    if (/\/functions\/v1\/scan-redirect/i.test(u.pathname)) return true;
    if (/(^|\.)ddsinovacao\.com\.br$/i.test(u.hostname) && /^#\/avaliar/i.test(u.hash)) return true;
    return false;
  } catch {
    return false;
  }
}

export const MSG_LINK_DA_PLACA =
  "Esse é o link da própria plaquinha. Cole o link de avaliação do Google da empresa (ou o link do mini site).";
