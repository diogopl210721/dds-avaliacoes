// Validação do conteúdo do mini site (sem dependências: testável fora do Deno).
export const THEMES = ["elegance", "viva", "essencial", "brasa", "aura", "navalha", "vital", "impulso", "refugio", "pace", "atelier", "forno", "planta", "garagem", "raiz", "lente", "flora", "obra", "oficio", "mesa", "tigela", "safra", "esmalte", "serena", "fluxo", "cuidar", "patas", "motor", "brilho", "presente"];
const PALETTES = ["p1", "p2", "p3", "p4", "brand"];
// Ramos (src/lib/miniNicheCore.ts): ligam o efeito animado da capa.
export const NICHES = ["pizzaria", "restaurante", "cafeteria", "acai", "adega", "salao", "unhas", "estetica", "barbearia", "dentista", "terapias", "veterinaria", "petshop", "academia", "pilates", "oficina", "lavacar", "jardinagem", "loja", "assistencia", "corrida", "moda", "panificadora", "imobiliaria", "carros", "naturais", "otica", "floricultura", "construcao", "escritorio"];
const ICONS = ["shield", "clock", "star", "heart", "truck", "award", "leaf", "sparkles", "thumbs", "wrench", "smile", "zap", "calendar", "users", "wallet", "pin"];

export function text(value: unknown, max = 1000) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
export function url(value: unknown) {
  const s = text(value, 2000);
  if (!s) return "";
  try { const u = new URL(s); if (["https:", "http:"].includes(u.protocol)) return u.href; } catch { /* Invalid URL */ }
  throw new Error("Confira os links: use endereços completos começando com https://.");
}
const handle = (value: unknown) => text(value, 200).startsWith("@") ? text(value, 200) : url(value);
function list(raw: any, key: string, max: number, label: string) {
  const v = raw[key];
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v) || v.length > max) throw new Error(`Use até ${max} ${label}.`);
  return v.filter((x: unknown) => x && typeof x === "object");
}

export function cleanContent(raw: any) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Dados da página inválidos.");
  const c: any = {};
  for (const key of ["name", "tagline", "phone", "address", "hours"]) c[key] = text(raw[key], 1000);
  c.description = text(raw.description, 1800);
  c.name = text(raw.name, 100);
  if (!c.name) throw new Error("Preencha o nome da empresa.");
  c.headline = text(raw.headline, 140);
  c.ctaText = text(raw.ctaText, 40);
  c.ctaMessage = text(raw.ctaMessage, 300);
  for (const key of ["mission", "vision", "values"]) c[key] = text(raw[key], 500);
  c.finalTitle = text(raw.finalTitle, 120);
  c.finalText = text(raw.finalText, 300);
  c.email = text(raw.email, 120);
  if (c.email && !/^[^\s@<>()]+@[^\s@<>()]+\.[a-z]{2,}$/i.test(c.email)) throw new Error("Confira o e-mail da empresa.");
  for (const key of ["facebook", "website", "maps", "review", "logo", "cover", "youtube", "video", "booking", "delivery", "menu"]) c[key] = url(raw[key]);
  c.instagram = handle(raw.instagram);
  c.tiktok = handle(raw.tiktok);
  c.theme = THEMES.includes(raw.theme) ? raw.theme : "elegance";
  c.brandColor = typeof raw.brandColor === "string" && /^#[0-9a-f]{6}$/i.test(raw.brandColor) ? raw.brandColor.toLowerCase() : "";
  c.palette = PALETTES.includes(raw.palette) ? raw.palette : "p1";
  c.niche = NICHES.includes(raw.niche) ? raw.niche : "";
  if (c.palette === "brand" && !c.brandColor) c.palette = "p1";
  if (!Array.isArray(raw.gallery) || raw.gallery.length > 12 || !Array.isArray(raw.products) || raw.products.length > 60) throw new Error("Use até 12 fotos e 60 produtos.");
  c.gallery = raw.gallery.map(url);
  c.products = raw.products.map((p: any) => ({ id: text(p?.id, 100), name: text(p?.name), description: text(p?.description), price: text(p?.price, 100), image: url(p?.image) }));
  c.benefits = list(raw, "benefits", 6, "benefícios").map((b: any) => ({ id: text(b.id, 100), icon: ICONS.includes(b.icon) ? b.icon : "star", title: text(b.title, 60), text: text(b.text, 160) }));
  c.stats = list(raw, "stats", 4, "números").map((s: any) => ({ id: text(s.id, 100), value: text(s.value, 20), label: text(s.label, 60) }));
  c.testimonials = list(raw, "testimonials", 6, "depoimentos").map((t: any) => ({ id: text(t.id, 100), name: text(t.name, 60), text: text(t.text, 400), stars: Math.max(1, Math.min(5, Math.round(Number(t.stars) || 5))), ...(t.source === "google" ? { source: "google" } : {}) }));
  c.faq = list(raw, "faq", 8, "perguntas").map((f: any) => ({ id: text(f.id, 100), q: text(f.q, 160), a: text(f.a, 600) }));
  if (raw.brands != null && (!Array.isArray(raw.brands) || raw.brands.length > 12)) throw new Error("Use até 12 marcas.");
  c.brands = Array.isArray(raw.brands) ? raw.brands.map(url) : [];
  // Pagamento e Pix saíram do mini site: nada disso é guardado.
  c.payments = [];
  c.pixKey = "";
  c.pixName = "";
  c.listTitle = text(raw.listTitle, 40);
  return c;
}

// Endereços que não podem virar mini site: pastas do site e outros sistemas publicados no domínio.
export const RESERVED = new Set([
  "404", "adm", "admin", "api", "app", "assets", "cname", "crl", "dds", "dds-avaliacoes", "ddsinovacao", "favicon", "index", "link-avaliacao", "loja", "login",
  "mini", "minisite", "plaquinhas", "exemplos", "vitrine", "demo", "privacidade-zap", "robots", "sistema", "sitemap", "static", "vendor", "www",
  "sitemelhoropcao", "app-igreja-vila-real", "controle-clientes", "diarioclientes", "telemetria-glp", "leitura-de-medidor", "controleposvendas",
  "controle-pos-vendas", "ieq3pinheiros", "conta-sim-digital", "bora-estudar", "sistema-financeiro-fam-lia", "chacara-ormelez", "crm-clientes",
  "planilhafinanceira", "logisitica", "ieq-3-pinheiros", "chacaraormelez", "diogopl210721-github-io",
]);
export const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/;
