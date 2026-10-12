export type MiniTheme = 'elegance' | 'viva' | 'essencial' | 'brasa' | 'aura' | 'navalha' | 'vital' | 'impulso' | 'refugio';
export type PaletteId = 'p1' | 'p2' | 'p3' | 'p4' | 'brand';
export type Product = { id: string; name: string; description: string; price: string; image: string };
export type Benefit = { id: string; icon: string; title: string; text: string };
export type Stat = { id: string; value: string; label: string };
export type Testimonial = { id: string; name: string; text: string; stars: number };
export type Faq = { id: string; q: string; a: string };
export type MiniContent = {
  theme: MiniTheme; palette: PaletteId; brandColor: string;
  // Primeira dobra
  name: string; headline: string; tagline: string; ctaText: string; ctaMessage: string; logo: string; cover: string;
  // Sobre
  description: string; mission: string; vision: string; values: string;
  // Listas
  benefits: Benefit[]; products: Product[]; stats: Stat[]; testimonials: Testimonial[]; brands: string[]; gallery: string[]; faq: Faq[];
  video: string; booking: string; delivery: string; menu: string;
  payments: string[]; pixKey: string; pixName: string;
  finalTitle: string; finalText: string;
  // Contato e redes
  phone: string; email: string; address: string; hours: string; maps: string; review: string;
  instagram: string; facebook: string; tiktok: string; youtube: string; website: string;
};
export type MiniRecord = { id: string; slug: string; published: boolean; content: MiniContent };

// Todos os IDs abaixo precisam estar na lista aceita pela função plate-mini
// (supabase/functions/plate-mini/index.ts), senão o tema volta para "elegance".
export const MINI_THEMES: MiniTheme[] = ['brasa', 'aura', 'navalha', 'vital', 'impulso', 'refugio', 'elegance', 'viva', 'essencial'];

export const LIMITS = { benefits: 6, products: 60, stats: 4, testimonials: 6, brands: 12, gallery: 12, faq: 8 };

export const blankContent: MiniContent = {
  theme: 'elegance', palette: 'p1', brandColor: '',
  name: '', headline: '', tagline: '', ctaText: '', ctaMessage: '', logo: '', cover: '',
  description: '', mission: '', vision: '', values: '',
  benefits: [], products: [], stats: [], testimonials: [], brands: [], gallery: [], faq: [],
  video: '', booking: '', delivery: '', menu: '', payments: [], pixKey: '', pixName: '', finalTitle: '', finalText: '',
  phone: '', email: '', address: '', hours: '', maps: '', review: '', instagram: '', facebook: '', tiktok: '', youtube: '', website: '',
};

// Páginas salvas antes das seções novas não têm esses campos: completa com vazio.
export function normalizeContent(raw: Partial<MiniContent> | null | undefined): MiniContent {
  const c = { ...blankContent, ...(raw ?? {}) } as MiniContent;
  for (const key of ['benefits', 'products', 'stats', 'testimonials', 'brands', 'gallery', 'faq', 'payments'] as const) if (!Array.isArray(c[key])) (c as any)[key] = [];
  if (!MINI_THEMES.includes(c.theme)) c.theme = 'elegance';
  if (!['p1', 'p2', 'p3', 'p4', 'brand'].includes(c.palette)) c.palette = 'p1';
  return c;
}

// Versão enxuta do conteúdo para as miniaturas animadas (evita renderizar listas longas nove vezes).
export function thumbContent(c: MiniContent, theme: MiniTheme): MiniContent {
  return { ...c, theme, products: c.products.slice(0, 4), gallery: c.gallery.slice(0, 6), testimonials: c.testimonials.slice(0, 2), faq: c.faq.slice(0, 2), brands: c.brands.slice(0, 4) };
}

export function safeUrl(value: string) { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } }
export function whatsapp(phone: string, message = '') { let digits = phone.replace(/\D/g, ''); if (digits.length === 10 || digits.length === 11) digits = '55' + digits; return digits.length >= 10 && digits.length <= 15 ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : ''; }
export function slugify(value: string) { return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60); }
export function imageUrl(value: string) { return /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value) ? value : safeUrl(value); }
export function validEmail(value: string) { return /^[^\s@<>()]+@[^\s@<>()]+\.[a-z]{2,}$/i.test(value.trim()); }
export function youtubeId(value: string) {
  const url = safeUrl(value);
  if (!url) return '';
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : '';
}

// Endereço público. A página real fica na raiz do domínio; o link antigo (#/loja) continua funcionando.
export const SITE_ORIGIN = 'https://www.ddsinovacao.com.br';
export function siteLink(slug: string) { return `${SITE_ORIGIN}/${slug}`; }
export function publicLink(slug: string) { return `${location.origin}${location.pathname}#/loja/${slug}`; }

export const PAYMENT_OPTIONS: { id: string; label: string }[] = [
  { id: 'pix', label: 'Pix' }, { id: 'credito', label: 'Cartão de crédito' }, { id: 'debito', label: 'Cartão de débito' },
  { id: 'dinheiro', label: 'Dinheiro' }, { id: 'boleto', label: 'Boleto' }, { id: 'vale', label: 'Vale-refeição' }, { id: 'transferencia', label: 'Transferência' },
];
export const BENEFIT_ICONS = ['shield', 'clock', 'star', 'heart', 'truck', 'award', 'leaf', 'sparkles', 'thumbs', 'wrench', 'smile', 'zap', 'calendar', 'users', 'wallet', 'pin'] as const;

let seq = 0;
export const uid = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `id-${Date.now()}-${++seq}`);

const asset = (name: string) => new URL(`demo/${name}.jpg`, new URL(import.meta.env.BASE_URL, location.href)).href;
const item = (id: string, name: string, description: string, price = '') => ({ id, name, description, price, image: '' });
const b = (id: string, icon: string, title: string, text: string): Benefit => ({ id, icon, title, text });
const s = (id: string, value: string, label: string): Stat => ({ id, value, label });
const t = (id: string, name: string, text: string): Testimonial => ({ id, name, text, stars: 5 });
const f = (id: string, q: string, a: string): Faq => ({ id, q, a });
const demo = (c: Partial<MiniContent>): MiniContent => ({ ...blankContent, ...c });

export const demoContent: MiniContent = demo({
  name: 'Aurora Café', headline: 'Café especial e confeitaria artesanal no centro de Campo Largo', tagline: 'Uma pausa especial no seu dia.',
  ctaText: 'Reservar uma mesa', description: 'Café preparado com carinho, sabores artesanais e um ambiente acolhedor para seus melhores encontros.',
  address: 'Rua das Flores, 123 · Campo Largo, PR', hours: 'Segunda a sábado · 8h às 19h',
  cover: asset('cafe'), gallery: [asset('cafe'), asset('cappuccino'), asset('croissant')],
  products: [{ id: '1', name: 'Cappuccino', description: 'Café, leite cremoso e um toque de cacau.', price: '14,00', image: asset('cappuccino') }, { id: '2', name: 'Croissant artesanal', description: 'Massa leve, amanteigada e sempre fresquinha.', price: '12,00', image: asset('croissant') }],
  benefits: [b('cb1', 'leaf', 'Grãos selecionados', 'Torra própria toda semana.'), b('cb2', 'heart', 'Feito na hora', 'Nada fica esperando na vitrine.'), b('cb3', 'zap', 'Wi-Fi e tomadas', 'Para trabalhar com calma.')],
  payments: ['pix', 'credito', 'debito'], finalTitle: 'Seu próximo café já está esperando', finalText: 'Reserve sua mesa pelo WhatsApp e chegue sem fila.',
});

// Empresas fictícias de cada segmento, só para as prévias.
export const nicheDemos: Partial<Record<MiniTheme, MiniContent>> = {
  brasa: demo({ theme: 'brasa', name: 'Brasa & Lenha', headline: 'Pizza no forno a lenha, do jeito que tem que ser', tagline: 'Massa de 48 horas, borda crocante e entrega quentinha em toda a região.', ctaText: 'Pedir agora pelo WhatsApp', ctaMessage: 'Olá! Quero fazer um pedido.',
    description: 'Massa de fermentação lenta, molho de tomate da casa e forno aceso a 400 °C. Venha comer aqui ou peça para levar.', address: 'Rua das Brasas, 450 · Curitiba, PR', hours: 'Terça a domingo · 18h às 23h30',
    benefits: [b('bb1', 'clock', 'Entrega em 40 min', 'Ou sua próxima pizza sai por nossa conta.'), b('bb2', 'leaf', 'Ingredientes frescos', 'Tomate italiano e muçarela de búfala.'), b('bb3', 'award', 'Forno a lenha', 'Assada a 400 °C em 90 segundos.'), b('bb4', 'truck', 'Entrega própria', 'Motoboys da casa, embalagem térmica.')],
    products: [item('b1', 'Margherita', 'Molho de tomate, muçarela de búfala e manjericão.', '59,90'), item('b2', 'Calabresa artesanal', 'Calabresa defumada, cebola roxa e azeitonas.', '56,90'), item('b3', 'Burger na brasa', 'Blend de 180 g, cheddar e cebola caramelizada.', '36,90'), item('b4', 'Petit gâteau', 'Com sorvete de creme.', '24,00')],
    stats: [s('bs1', '+12 mil', 'pizzas por ano'), s('bs2', '4,9', 'nota no Google'), s('bs3', '8 anos', 'de forno aceso')],
    testimonials: [t('bt1', 'Rafaela M.', 'A melhor margherita de Curitiba. Chegou quente e a borda continuava crocante.'), t('bt2', 'Thiago L.', 'Atendimento rápido pelo WhatsApp e a pizza chegou antes do previsto.')],
    delivery: 'https://www.ifood.com.br/', payments: ['pix', 'credito', 'debito', 'dinheiro', 'vale'],
    faq: [f('bf1', 'Qual é a área de entrega?', 'Entregamos em até 8 km da pizzaria. Fora disso, combine a retirada pelo WhatsApp.'), f('bf2', 'Tem opção sem glúten?', 'Sim, a massa sem glúten sai em todos os sabores.')],
    finalTitle: 'Bateu a fome? O forno já está quente.', finalText: 'Peça agora pelo WhatsApp e receba em até 40 minutos.' }),
  aura: demo({ theme: 'aura', name: 'Studio Lumière', headline: 'Cabelo, pele e unhas com cuidado de verdade', tagline: 'Atendimento com hora marcada, sem pressa e com produtos profissionais.', ctaText: 'Agendar meu horário', ctaMessage: 'Olá! Gostaria de agendar um horário.',
    description: 'Um espaço tranquilo para você se cuidar, com profissionais especializadas e produtos de alta qualidade.', mission: 'Fazer cada cliente sair mais confiante do que entrou.', vision: 'Ser o salão de referência em atendimento humanizado no bairro.', values: 'Cuidado, pontualidade e transparência nos preços.',
    address: 'Rua das Pérolas, 210 · Curitiba, PR', hours: 'Segunda a sábado · 9h às 20h',
    benefits: [b('ab1', 'sparkles', 'Produtos profissionais', 'Marcas que respeitam seu cabelo.'), b('ab2', 'calendar', 'Hora marcada', 'Sem espera na recepção.'), b('ab3', 'shield', 'Materiais esterilizados', 'Protocolos de biossegurança.')],
    products: [item('a1', 'Corte e escova', 'Corte personalizado com finalização.', '120,00'), item('a2', 'Coloração', 'Mechas, tonalização ou cor global.', '190,00'), item('a3', 'Design de sobrancelhas', 'Com henna ou linha.', '45,00'), item('a4', 'Manicure e pedicure', 'Esmaltação tradicional ou em gel.', '65,00')],
    testimonials: [t('at1', 'Juliana P.', 'Saí com o cabelo exatamente como pedi. Ambiente lindo e atendimento atencioso.'), t('at2', 'Camila R.', 'Minhas unhas duram três semanas perfeitas. Não troco mais de salão.')],
    booking: 'https://calendar.google.com/', payments: ['pix', 'credito', 'debito'], pixKey: 'contato@studiolumiere.com.br', pixName: 'Studio Lumière',
    finalTitle: 'Reserve seu momento de cuidado', finalText: 'As agendas de sexta e sábado esgotam rápido. Garanta o seu horário agora.' }),
  navalha: demo({ theme: 'navalha', name: 'Fio de Navalha', headline: 'Corte, barba e uma boa conversa', tagline: 'Barbearia com hora marcada, toalha quente e café passado na hora.', ctaText: 'Marcar meu horário', ctaMessage: 'Fala! Quero marcar um horário.',
    description: 'Atendimento com hora marcada, toalha quente e acabamento na navalha. Café passado na hora enquanto você espera.', address: 'Rua da Navalha, 88 · Curitiba, PR', hours: 'Segunda a sábado · 9h às 21h',
    benefits: [b('nb1', 'clock', 'Sem fila', 'Horário marcado de verdade.'), b('nb2', 'award', 'Barbeiros experientes', 'Mais de 10 anos de navalha.'), b('nb3', 'smile', 'Ambiente raiz', 'Café, sinuca e boa música.')],
    products: [item('n1', 'Corte masculino', 'Máquina e tesoura, com lavagem.', '45,00'), item('n2', 'Barba completa', 'Toalha quente e navalha.', '35,00'), item('n3', 'Corte e barba', 'O combo completo.', '70,00'), item('n4', 'Pigmentação', 'Barba ou cabelo.', '30,00')],
    stats: [s('ns1', '+3 mil', 'clientes atendidos'), s('ns2', '10 anos', 'de barbearia')],
    testimonials: [t('nt1', 'Bruno C.', 'Melhor degradê da região e sempre no horário marcado.')],
    payments: ['pix', 'credito', 'debito', 'dinheiro'], finalTitle: 'Bora dar um tapa no visual?', finalText: 'Chama no WhatsApp e escolha o melhor horário pra você.' }),
  vital: demo({ theme: 'vital', name: 'Clínica Bem Viver', headline: 'Saúde perto de você, com atendimento humano', tagline: 'Consultas, fisioterapia e odontologia no mesmo lugar, com horários flexíveis.', ctaText: 'Agendar consulta', ctaMessage: 'Olá! Gostaria de agendar uma consulta.',
    description: 'Equipe multidisciplinar para cuidar de você e da sua família, com consultas, fisioterapia e acompanhamento contínuo.', mission: 'Cuidar da saúde de cada paciente com escuta e acolhimento.', vision: 'Ser a clínica de confiança das famílias da região.', values: 'Ética, empatia e responsabilidade.',
    address: 'Rua do Bem-Estar, 1500 · Curitiba, PR', hours: 'Segunda a sexta · 7h às 19h\nSábado · 8h às 12h',
    benefits: [b('vb1', 'calendar', 'Agenda rápida', 'Consultas na mesma semana.'), b('vb2', 'users', 'Equipe completa', 'Médicos, fisioterapeutas e dentistas.'), b('vb3', 'pin', 'Fácil acesso', 'Estacionamento e acessibilidade.'), b('vb4', 'shield', 'Atendimento seguro', 'Protocolos e ambiente higienizado.')],
    products: [item('v1', 'Clínica geral', 'Consultas e check-up anual.'), item('v2', 'Fisioterapia', 'Reabilitação e dores crônicas.'), item('v3', 'Odontologia', 'Limpeza, clareamento e implantes.'), item('v4', 'Nutrição', 'Planos alimentares personalizados.')],
    stats: [s('vs1', '+8 mil', 'pacientes atendidos'), s('vs2', '15', 'profissionais'), s('vs3', '12 anos', 'cuidando de você')],
    payments: ['pix', 'credito', 'debito', 'boleto'],
    faq: [f('vf1', 'Vocês atendem convênio?', 'Atendemos particular e emitimos recibo para reembolso do seu plano.'), f('vf2', 'Preciso de encaminhamento para a fisioterapia?', 'Não. Você pode agendar a avaliação direto pelo WhatsApp.')],
    finalTitle: 'Cuide da sua saúde sem esperar', finalText: 'Fale com a recepção e agende sua consulta para esta semana.' }),
  impulso: demo({ theme: 'impulso', name: 'Arena Impulso', headline: 'Treine forte. Evolua todo dia.', tagline: 'Musculação, cross training e aulas coletivas das 5h às 23h.', ctaText: 'Quero uma aula grátis', ctaMessage: 'Fala! Quero agendar minha aula experimental.',
    description: 'Musculação, cross training e aulas coletivas com professores em todos os horários. Aberto cedo e até tarde.', address: 'Av. do Movimento, 3000 · Curitiba, PR', hours: 'Segunda a sexta · 5h às 23h\nSábado e domingo · 8h às 14h',
    benefits: [b('ib1', 'zap', 'Equipamentos novos', 'Linha completa renovada em 2026.'), b('ib2', 'users', 'Professores no salão', 'Em todos os horários.'), b('ib3', 'clock', 'Aberto das 5h às 23h', 'Treine quando der.')],
    products: [item('i1', 'Plano mensal', 'Musculação livre, todos os horários.', '109,90'), item('i2', 'Cross training', 'Aulas em grupo de 60 minutos.', '149,90'), item('i3', 'Plano anual', 'Valor mensal no plano de 12 meses.', '89,90'), item('i4', 'Personal trainer', 'Treino individual com avaliação física.')],
    stats: [s('is1', '+1.200', 'alunos ativos'), s('is2', '18h', 'abertos por dia'), s('is3', '40', 'aulas por semana')],
    testimonials: [t('it1', 'Larissa F.', 'Perdi 9 kg em 5 meses com o acompanhamento dos professores.')],
    payments: ['pix', 'credito', 'debito'],
    finalTitle: 'Sua primeira aula é por nossa conta', finalText: 'Agende hoje e treine amanhã. Vagas limitadas por horário.' }),
  refugio: demo({ theme: 'refugio', name: 'Recanto Vale Verde', headline: 'Chalés no meio da mata, a 40 minutos da cidade', tagline: 'Piscina, trilhas, café colonial e silêncio para recarregar as energias.', ctaText: 'Consultar datas disponíveis', ctaMessage: 'Olá! Gostaria de consultar datas para hospedagem.',
    description: 'Piscina, trilhas, café colonial e silêncio. Ideal para descansar, celebrar e reunir a família.', address: 'Estrada do Vale Verde, km 8 · Campo Largo, PR', hours: 'Check-in a partir das 14h\nCheck-out até 12h',
    benefits: [b('rb1', 'leaf', 'Natureza preservada', '20 hectares de mata nativa.'), b('rb2', 'heart', 'Café colonial incluso', 'Feito na casa, todas as manhãs.'), b('rb3', 'users', 'Ideal para famílias', 'Chalés de 2 a 5 pessoas.')],
    products: [item('r1', 'Chalé casal', 'Diária com café colonial.', '390,00'), item('r2', 'Chalé família', 'Até 5 pessoas, com cozinha.', '520,00'), item('r3', 'Day use', 'Piscina, trilhas e almoço.', '95,00'), item('r4', 'Eventos', 'Casamentos e confraternizações ao ar livre.')],
    testimonials: [t('rt1', 'Família Souza', 'Lugar mágico. As crianças não queriam ir embora.'), t('rt2', 'Ana e Pedro', 'Chalé impecável e o café colonial é um capítulo à parte.')],
    payments: ['pix', 'credito', 'transferencia'], pixKey: '41999990000', pixName: 'Recanto Vale Verde',
    faq: [f('rf1', 'Aceitam pets?', 'Sim, nos chalés térreos, com aviso na reserva.'), f('rf2', 'Como funciona o pagamento?', '50% no Pix para garantir a data e o restante no check-in.')],
    finalTitle: 'Os fins de semana lotam rápido', finalText: 'Consulte as datas livres agora mesmo pelo WhatsApp.' }),
};

export const themeOptions: { id: MiniTheme; name: string; niche: string; description: string }[] = [
  { id: 'brasa', name: 'Brasa', niche: 'Gastronomia', description: 'Restaurantes, pizzarias e hamburguerias. Brasas subindo pela tela e cardápio com preços.' },
  { id: 'aura', name: 'Aura', niche: 'Beleza e estética', description: 'Salões, estética e spas. Fundo líquido furta-cor e brilho delicado.' },
  { id: 'navalha', name: 'Navalha', niche: 'Barbearias', description: 'Barbearias e estúdios masculinos. Poste de barbeiro em 3D, cromado e fumaça.' },
  { id: 'vital', name: 'Vital', niche: 'Saúde', description: 'Clínicas, consultórios e terapias. Linha de batimento ao vivo e visual calmo.' },
  { id: 'impulso', name: 'Impulso', niche: 'Fitness', description: 'Academias, crossfit e estúdios. Túnel de velocidade e faixas em movimento.' },
  { id: 'refugio', name: 'Refúgio', niche: 'Hospedagem', description: 'Pousadas, chácaras e hotéis fazenda. Paisagem em camadas que se move com você.' },
  { id: 'elegance', name: 'Noir', niche: 'Cafés e marcas premium', description: 'Tons de café e dourado, com a foto da capa flutuando em 3D.' },
  { id: 'viva', name: 'Vibe', niche: 'Lojas e negócios jovens', description: 'Cores vivas, formas em movimento e botões que saltam da tela.' },
  { id: 'essencial', name: 'Cristal', niche: 'Serviços em geral', description: 'Claro e leve, com vidro, profundidade e luz em movimento.' },
];
// Conteúdo de exemplo para mostrar um modelo: a empresa fictícia do segmento, ou o café.
export function demoFor(theme: MiniTheme): MiniContent { return nicheDemos[theme] ?? { ...demoContent, theme }; }
