export type Product = { id: string; name: string; description: string; price: string; image: string };
export type MiniContent = { name: string; tagline: string; description: string; phone: string; address: string; hours: string; instagram: string; facebook: string; website: string; maps: string; review: string; logo: string; cover: string; gallery: string[]; products: Product[]; theme: 'elegance' | 'viva' | 'essencial' };
export type MiniRecord = { id: string; slug: string; published: boolean; content: MiniContent };
export type MiniTheme = MiniContent['theme'];
// Os IDs (elegance, viva, essencial) ficam iguais: são os valores aceitos pela
// função plate-mini e gravados em mini_pages.content.theme. Só o visual mudou.
export const themeOptions: { id: MiniTheme; name: string; description: string; tag: string }[] = [
  { id: 'elegance', name: 'Noir', description: 'Tons de café e dourado, com a foto da capa flutuando em 3D.', tag: 'SOFISTICADO' },
  { id: 'viva', name: 'Vibe', description: 'Cores vivas, formas em movimento e botões que saltam da tela.', tag: 'CHEIO DE ENERGIA' },
  { id: 'essencial', name: 'Cristal', description: 'Claro e leve, com vidro, profundidade e luz em movimento.', tag: 'MODERNO' },
];
// Versão enxuta do conteúdo para as miniaturas animadas (evita renderizar 60 produtos três vezes).
export function thumbContent(c: MiniContent, theme: MiniTheme): MiniContent { return { ...c, theme, products: c.products.slice(0, 4), gallery: c.gallery.slice(0, 6) }; }
export const blankContent: MiniContent = { name: '', tagline: '', description: '', phone: '', address: '', hours: '', instagram: '', facebook: '', website: '', maps: '', review: '', logo: '', cover: '', gallery: [], products: [], theme: 'elegance' };
const asset = (name: string) => new URL(`demo/${name}.jpg`, new URL(import.meta.env.BASE_URL, location.href)).href;
export const demoContent: MiniContent = { ...blankContent, name: 'Aurora Café', tagline: 'Uma pausa especial no seu dia.', description: 'Café preparado com carinho, sabores artesanais e um ambiente acolhedor para seus melhores encontros.', address: 'Rua das Flores, 123 · Campo Largo, PR', hours: 'Segunda a sábado · 8h às 19h', cover: asset('cafe'), gallery: [asset('cafe'), asset('cappuccino'), asset('croissant')], products: [{ id: '1', name: 'Cappuccino', description: 'Café, leite cremoso e um toque de cacau.', price: '14,00', image: asset('cappuccino') }, { id: '2', name: 'Croissant artesanal', description: 'Massa leve, amanteigada e sempre fresquinha.', price: '12,00', image: asset('croissant') }] };
export function safeUrl(value: string) { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } }
export function whatsapp(phone: string, message = '') { let digits = phone.replace(/\D/g, ''); if (digits.length === 10 || digits.length === 11) digits = '55' + digits; return digits.length >= 10 && digits.length <= 15 ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : ''; }
export function slugify(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60); }
export function publicLink(slug: string) { return `${location.origin}${location.pathname}#/loja/${slug}`; }

export function imageUrl(value: string) { return /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value) ? value : safeUrl(value); }
