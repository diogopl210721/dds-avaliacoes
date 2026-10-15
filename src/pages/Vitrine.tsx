import { CSSProperties, Fragment, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronDown, Globe, Image, KeyRound, MapPin, MessageCircle, Nfc, PenLine,
  Play, Plus, QrCode, Rocket, Share2, Smartphone, Sparkles, Star, UserPlus, X,
} from 'lucide-react';
import { Aurora, BrandMark, CountUp, useReveal } from '../components/ui/Fx';
import { NicheCard, NicheChips, NicheViewer, GroupFilter, nichesOf } from '../components/NicheShowcase';
import BuildDemo, { DEMO_STEPS } from '../components/BuildDemo';
import { NICHES, NicheId, nicheById } from '../lib/miniNicheCore';
import { MINI_THEMES } from '../lib/miniPage';
import { paletteVars } from '../lib/miniPalettes';
import { loadFonts } from '../lib/miniFonts';
import '../mini.css';

// Página de vendas dos mini sites (/exemplos, link curto www.ddsinovacao.com.br/minisites).
// Gancho: o site pronto em 5 minutos, por R$ 200 uma vez só. Um celular no topo monta um site sozinho
// (BuildDemo, com o nome que a pessoa digitar); os modelos aparecem logo abaixo (6 e "ver todos").
// Todo botão de compra chama no WhatsApp; o acesso ao estúdio sai pelo admin (código SITE101 + link).
// /exemplos/<ramo>?nome=... abre direto o exemplo (link para mandar depois).
// No meio e no fim, a propaganda da plaquinha de avaliações leva para www.ddsinovacao.com.br/plaquinhas/.

const WHATS = '5541991542931';
const wa = (msg: string) => `https://wa.me/${WHATS}?text=${encodeURIComponent(msg)}`;
const PLAQUINHA_URL = 'https://www.ddsinovacao.com.br/plaquinhas/';
const PLAQUINHA_IMG = 'https://www.ddsinovacao.com.br/plaquinhas/placa-google.png';
const PRECO = 200;
const DE_CARA = 6;
const vars = (o: Record<string, string | number>) => o as CSSProperties;

const STEPS: { icon: ReactNode; title: string; text: string }[] = [
  { icon: <MessageCircle size={20} />, title: 'Chame no WhatsApp', text: `Escolha o modelo e fale com a gente. São R$ ${PRECO}, pagos uma vez só.` },
  { icon: <KeyRound size={20} />, title: 'Receba o seu link', text: 'Você toca no link, cria a sua senha e entra no seu estúdio.' },
  { icon: <PenLine size={20} />, title: 'Monte em 5 minutos', text: 'Coloque nome, fotos, produtos e WhatsApp. Você vê como fica enquanto preenche.' },
  { icon: <Rocket size={20} />, title: 'Toque em Publicar', text: 'Seu site no ar em www.ddsinovacao.com.br/suaempresa. Mude quantas vezes quiser.' },
];

// Vídeo da janela "Como funciona": gravação real do estúdio preenchido do zero (public/video/estudio.mp4).
// VIDEO_CH: em que segundo do vídeo começa cada passo (gerado junto com o vídeo).
const VIDEO_URL = `${import.meta.env.BASE_URL}video/estudio`; // .mp4 (iPhone e a maioria) e .webm (reserva)
const VIDEO_POSTER = `${import.meta.env.BASE_URL}video/estudio.jpg`;
const VIDEO_CH = [0.4, 6.1, 14.7, 19.4, 29.1, 39.8, 50.6, 55.2, 61.1];

// Passos da janela: o primeiro acontece antes; os outros acendem junto com o vídeo (ch = passos do vídeo).
const HOW: { title: string; text: string; ch?: number[] }[] = [
  { title: `Chame no WhatsApp e pague R$ ${PRECO}`, text: 'Uma vez só. Sem mensalidade.' },
  { title: 'Receba o link e crie sua senha', text: 'O seu código de acesso vem junto (ex.: SITE101).', ch: [0] },
  { title: 'Escolha o ramo e as cores', text: `São ${NICHES.length} ramos, cada um com visual próprio.`, ch: [1, 2] },
  { title: 'Preencha nome, WhatsApp, fotos e preços', text: 'Você vê como fica na hora, enquanto preenche.', ch: [3, 4, 5, 6] },
  { title: 'Toque em Publicar', text: 'Pronto: seu site no ar. Mude quando quiser.', ch: [7, 8] },
];

const FEATURES: { icon: ReactNode; title: string; text: string }[] = [
  { icon: <MessageCircle size={19} />, title: 'Botão de WhatsApp', text: 'O cliente toca e já cai na conversa, com a mensagem pronta.' },
  { icon: <Image size={19} />, title: 'Produtos com fotos', text: 'Cardápio, serviços, planos ou estoque, com preço e botão de pedido em cada item.' },
  { icon: <MapPin size={19} />, title: 'Endereço e horários', text: 'Com o botão "Como chegar" abrindo direto no mapa.' },
  { icon: <Star size={19} />, title: 'Avaliações', text: 'Depoimentos dos clientes e botão para avaliar no Google.' },
  { icon: <Smartphone size={19} />, title: 'Feito para o celular', text: 'Abre rápido no celular e também fica bonito no computador.' },
  { icon: <Sparkles size={19} />, title: 'Visual do seu ramo', text: 'Cores, letras e um efeito animado na capa que reage ao toque.' },
  { icon: <UserPlus size={19} />, title: 'Salvar contato', text: 'O cliente salva o seu número na agenda com um toque.' },
  { icon: <PenLine size={19} />, title: 'Mude quando quiser', text: 'Troque fotos, preços e textos quantas vezes quiser, sem pagar nada a mais.' },
];

const FAQ: [string, string][] = [
  ['Quanto custa?', `R$ ${PRECO}, pagamento único. Sem mensalidade, sem pegadinha e sem surpresas.`],
  ['Quanto tempo leva?', 'Depois de receber o seu link de acesso, você monta em uns 5 minutos: coloca as informações, vê como ficou e toca em Publicar.'],
  ['Posso mudar o site depois?', 'Quantas vezes quiser, sem pagar nada a mais. Você entra no seu estúdio, muda e publica de novo. Se preferir, é só pedir pelo WhatsApp.'],
  ['Preciso ter domínio ou hospedagem?', 'Não. O seu site fica em www.ddsinovacao.com.br/suaempresa, já no ar e sem custo de hospedagem.'],
  ['Posso usar um domínio só meu?', 'Pode. Registre o domínio (ex.: suaempresa.com.br) no registro.br e chame a gente no WhatsApp que conectamos ao seu site.'],
  ['Preciso ter a plaquinha de avaliações?', 'Não. O mini site pode ser contratado sozinho. Se tiver loja física, dá para ter os dois no mesmo sistema.'],
  ['As empresas dos exemplos são reais?', 'Não. Empresas, depoimentos e números dos exemplos são fictícios e as fotos são ilustrativas. O seu terá as suas fotos e informações.'],
];

const H1_A = 'O site do seu negócio'.split(' ');
const H1_B = 'pronto em 5 minutos.'.split(' ');

export default function Vitrine() {
  const { niche } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const name = (params.get('nome') ?? '').slice(0, 60);
  const [draft, setDraft] = useState(name);
  const [group, setGroup] = useState<GroupFilter>('todos');
  const [all, setAll] = useState(false);
  const [how, setHow] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [howStep, setHowStep] = useState(0);
  const [seek, setSeek] = useState<{ t: number; n: number } | null>(null);
  const [dock, setDock] = useState(false);
  const [priceSeen, setPriceSeen] = useState(false);
  const [copied, setCopied] = useState(false);
  const open = nicheById(niche)?.id ?? null;
  const list = useMemo(() => nichesOf(group).map(n => n.id), [group]);
  const shown = group === 'todos' && !all ? list.slice(0, DE_CARA) : list;
  const viewerIds = open && !list.includes(open) ? nichesOf('todos').map(n => n.id) : list;
  const typing = useRef<ReturnType<typeof setTimeout>>();
  const gridRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const finalRef = useRef<HTMLElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const page = useReveal<HTMLElement>();
  // Duas voltas dos ramos na faixa que corre (a segunda é cópia, para o loop não ter emenda).
  const ribbon = useMemo(() => NICHES.map(n => ({ id: n.id, label: n.short, color: paletteVars(n.theme, n.palette)['--accent'] })), []);

  useEffect(() => { document.title = 'Seu site pronto em 5 minutos · DDS Inovação'; loadFonts(MINI_THEMES); }, []);
  useEffect(() => { setDraft(name); }, [name]);

  // Barra fixa do WhatsApp no celular: aparece depois do topo e some na chamada final.
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    let heroOut = false, finalIn = false;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.target === heroRef.current) heroOut = !e.isIntersecting; if (e.target === finalRef.current) finalIn = e.isIntersecting; });
      setDock(heroOut && !finalIn);
    });
    if (heroRef.current) io.observe(heroRef.current);
    if (finalRef.current) io.observe(finalRef.current);
    const pio = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setPriceSeen(true); pio.disconnect(); } }, { threshold: 0.4 });
    if (priceRef.current) pio.observe(priceRef.current);
    return () => { io.disconnect(); pio.disconnect(); };
  }, []);

  // Janela "Como funciona": Esc fecha e a página de trás não rola.
  useEffect(() => {
    if (!how) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setHow(false); };
    window.addEventListener('keydown', key);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', key); document.body.style.overflow = overflow; };
  }, [how]);

  const query = name ? `?nome=${encodeURIComponent(name)}` : '';
  function setName(value: string) {
    setDraft(value);
    clearTimeout(typing.current);
    typing.current = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (value.trim()) next.set('nome', value.trim()); else next.delete('nome');
      setParams(next, { replace: true });
    }, 350);
  }
  const show = (id: NicheId) => navigate(`/exemplos/${id}${query}`, { replace: !!open });
  const close = () => navigate(`/exemplos${query}`, { replace: true });
  const toModels = () => { setHow(false); gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const toPrice = () => priceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const quero = wa(`Olá! Vi a página dos mini sites da DDS (R$ ${PRECO}) e quero fazer o meu${name ? ` para a ${name}` : ''}.`);
  const whats = (label: string, extra = '') => <a className={`dds-btn dds-btn-whats dds-btn-lg ${extra}`} href={quero} target="_blank" rel="noopener noreferrer"><MessageCircle size={19} /> {label}</a>;

  async function share(id: NicheId) {
    const n = nicheById(id)!;
    const url = new URL(`#/exemplos/${id}${query}`, new URL(import.meta.env.BASE_URL, document.baseURI)).href;
    const text = `Veja como fica o mini site de ${n.short.toLowerCase()}${name ? ` da ${name}` : ''}:`;
    try {
      if (navigator.share) { await navigator.share({ title: 'Exemplo de mini site', text, url }); return; }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true); setTimeout(() => setCopied(false), 2200);
    } catch { /* compartilhamento cancelado */ }
  }

  return <div className="dds-dark min-h-[100dvh] overflow-x-clip vt">
    <Aurora calm />
    <header className="sticky top-0 z-30 border-b border-white/[.06] bg-navy-950/75 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <BrandMark />
        <nav className="flex items-center gap-2">
          <button type="button" onClick={() => setHow(true)} className="hidden md:inline-flex dds-btn dds-btn-ghost-dark dds-btn-sm"><Play size={14} /> Como funciona</button>
          <a className="hidden lg:inline-flex dds-btn dds-btn-ghost-dark dds-btn-sm" href={PLAQUINHA_URL}><QrCode size={15} /> Plaquinha de avaliações</a>
          <a className="dds-btn dds-btn-whats dds-btn-sm sm:px-4" href={quero} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /> Chamar no WhatsApp</a>
        </nav>
      </div>
    </header>

    <main ref={page} className="max-w-6xl mx-auto px-4 sm:px-6">
      {/* Topo: gancho + celular que monta o site sozinho */}
      <section ref={heroRef} className="vt-hero pt-9 sm:pt-14 pb-6 sm:pb-8">
        <div>
          <span className="dds-eyebrow dds-rise"><Sparkles size={14} className="text-[#66e0ff]" />Mini sites para negócios locais · {NICHES.length} ramos</span>
          <h1 className="vt-words mt-5 font-display font-extrabold text-[clamp(36px,6.4vw,66px)] leading-[1.02] tracking-[-.045em] text-white">
            {H1_A.map((w, i) => <Fragment key={w + i}><span style={vars({ '--k': i })}>{w}</span>{' '}</Fragment>)}
            {H1_B.map((w, i) => <Fragment key={w + i}><span className="dds-spectrum-text" style={vars({ '--k': H1_A.length + i })}>{w}</span>{i < H1_B.length - 1 ? ' ' : ''}</Fragment>)}
          </h1>
          <p className="mt-4 max-w-xl text-[16.5px] sm:text-lg leading-relaxed text-[#a7b7d1] dds-rise" style={vars({ '--d': '.7s' })}>Depois de colocar suas informações, <strong className="text-white font-semibold">é só tocar em Publicar</strong>. Sem programador e sem complicação: você vê como fica na hora.</p>
          <button type="button" onClick={toPrice} className="vt-price-pill dds-rise" style={vars({ '--d': '.85s' })}><b>R$ {PRECO}</b> pagamento único <span>sem mensalidade</span></button>
          <label className="vt-name mt-6 dds-rise" style={vars({ '--d': '.95s' })}>
            <PenLine size={18} aria-hidden="true" />
            <span className="sr-only">Nome da sua empresa</span>
            <input value={draft} onChange={e => setName(e.target.value)} maxLength={60} placeholder="Digite o nome da sua empresa" autoComplete="off" enterKeyHint="done" onKeyDown={e => { if (e.key === 'Enter') toModels(); }} />
            {draft && <button type="button" onClick={() => setName('')} aria-label="Apagar o nome"><X size={17} /></button>}
          </label>
          <p className="mt-2 text-[13px] text-[#7f93b5]">{name ? <>Os modelos e a demonstração estão mostrando <strong className="text-white font-semibold">{name}</strong>.</> : 'Veja os modelos e a demonstração com o nome da sua empresa.'}</p>
          <div className="mt-6 flex flex-wrap gap-3 max-[400px]:gap-2 dds-rise" style={vars({ '--d': '1.05s' })}>
            <button type="button" onClick={toModels} className="dds-btn dds-btn-glow dds-btn-lg flex-1 sm:flex-none !px-3 sm:!px-6 max-[400px]:!text-[14.5px] max-[400px]:!gap-1.5 max-[340px]:basis-full">Ver os modelos <ArrowDown size={18} /></button>
            <button type="button" onClick={() => setHow(true)} className="dds-btn dds-btn-ghost-dark dds-btn-lg flex-1 sm:flex-none !px-3 sm:!px-6 max-[400px]:!text-[14.5px] max-[400px]:!gap-1.5 max-[340px]:basis-full"><Play size={17} /> Como funciona</button>
          </div>
        </div>
        <div className="vt-hero-demo dds-rise" style={vars({ '--d': '.3s' })}>
          <span className="vt-float f1" aria-hidden="true"><Check size={14} /> Botão de WhatsApp</span>
          <span className="vt-float f2" aria-hidden="true"><Check size={14} /> Fotos e preços</span>
          <span className="vt-float f3" aria-hidden="true"><Check size={14} /> Mude quando quiser</span>
          <BuildDemo name={name} onStep={setDemoStep} />
          <p className="vt-demo-caption" aria-hidden="true"><b>{demoStep + 1}</b>{DEMO_STEPS[demoStep]}<span className="vt-demo-dots">{DEMO_STEPS.map((_, i) => <i key={i} className={i === demoStep ? 'on' : ''} />)}</span></p>
        </div>
      </section>

      {/* Faixa com os ramos */}
      <div className="vt-marquee" aria-label="Ramos com modelo pronto">
        {[0, 1].map(row => <div key={row} className={`vt-marquee-row${row ? ' rev' : ''}`}>
          {[0, 1].map(copy => (row ? [...ribbon].reverse() : ribbon).map(n => <button key={`${copy}${n.id}`} type="button" className="vt-mq" onClick={() => show(n.id)} tabIndex={copy || row ? -1 : 0} aria-hidden={copy || row ? true : undefined} style={vars({ color: n.color })}><i style={vars({ background: n.color })} /><span style={{ color: '#cfe0ff' }}>{n.label}</span></button>))}
        </div>)}
      </div>

      {/* Modelos */}
      <div ref={gridRef} className="scroll-mt-16 pt-8">
        <div className="pt-2 pb-1">
          <h2 className="font-display text-[clamp(24px,3.4vw,34px)] font-extrabold tracking-[-.035em] text-white">Escolha o modelo do seu ramo</h2>
          <p className="mt-1 text-[15px] text-[#a7b7d1]">Toque em um exemplo para abrir a página inteira. Na capa, o efeito reage ao toque.</p>
        </div>
        <div className="vt-filter sticky top-16 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3"><NicheChips value={group} onChange={g => { setGroup(g); setAll(false); }} /></div>
        <section className={`nc-grid pt-4 pb-14${all ? ' is-all' : ''}`} aria-label="Exemplos por ramo">
          {shown.map((id, i) => <NicheCard key={id} id={id} name={name} index={i} paused={!!open || how} onOpen={show} />)}
        </section>
        {group === 'todos' && <div className="vt-more">
          <button type="button" aria-expanded={all} onClick={() => { if (all) gridRef.current?.scrollIntoView({ block: 'start' }); setAll(!all); }}>
            {all ? 'Mostrar menos' : <>Ver todos os modelos <b>{NICHES.length}</b></>}<ChevronDown size={18} />
          </button>
        </div>}
      </div>

      {/* Preço */}
      <section id="preco" className="pb-16 scroll-mt-20" aria-labelledby="vt-preco">
        <div className="vt-price-sec">
          <div data-reveal>
            <h2 id="vt-preco" className="font-display text-[clamp(28px,4.2vw,44px)] font-extrabold leading-[1.05] tracking-[-.045em] text-white">Um preço só. <span className="font-serif italic font-normal dds-spectrum-text">O site é seu.</span></h2>
            <p className="mt-3 max-w-lg text-[16px] leading-relaxed text-[#a7b7d1]">Você paga uma vez e pode mudar fotos, preços e textos quantas vezes quiser.</p>
            <p className="mt-6 text-[12px] font-bold uppercase tracking-[.14em] text-[#7f93b5]">Aqui não tem</p>
            <div className="vt-nos">{['Mensalidade', 'Pegadinha', 'Surpresas'].map((t, i) => <span key={t} style={vars({ '--k': i })}><X size={14} />{t}</span>)}</div>
            <div className="vt-domain">
              <i><Globe size={20} /></i>
              <div>
                <h3>Quer um endereço só seu?</h3>
                <p>Registre o seu domínio (ex.: suaempresa.com.br) no <a href="https://registro.br" target="_blank" rel="noopener noreferrer">registro.br</a> e chame a gente no WhatsApp: conectamos ao seu site.</p>
              </div>
            </div>
          </div>
          <div ref={priceRef} className="vt-price dds-spectrum-border" data-reveal>
            <div className="vt-price-in">
              <span className="vt-price-tag"><Check size={13} /> Pagamento único</span>
              <div className="vt-price-num" aria-label={`R$ ${PRECO},00`}><small>R$</small>{priceSeen ? <CountUp value={PRECO} duration={1300} /> : PRECO}<small>,00</small></div>
              <p className="vt-price-sub">uma vez só · <strong>sem mensalidade</strong></p>
              <ul className="vt-price-list">
                {['Sem mensalidade, sem pegadinha, sem surpresas', 'Mude quantas vezes quiser', 'Pronto em uns 5 minutos', 'Endereço www.ddsinovacao.com.br/suaempresa', `Modelo do seu ramo (são ${NICHES.length})`].map(t => <li key={t}><Check size={18} />{t}</li>)}
              </ul>
              <span className="vt-ring block">{whats('Chamar no WhatsApp', 'w-full')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="pb-14" aria-labelledby="vt-como">
        <div className="vt-head">
          <h2 id="vt-como" className="font-display text-[clamp(26px,3.8vw,38px)] font-extrabold tracking-[-.04em] text-white">Como funciona</h2>
          <button type="button" onClick={() => setHow(true)} className="dds-btn dds-btn-ghost-dark"><Play size={16} /> Ver a demonstração</button>
        </div>
        <ol className="vt-steps is-4 mt-6">
          {STEPS.map((s, i) => <li key={s.title} data-reveal style={vars({ '--k': i })}><span className="vt-step-n">{i + 1}</span><i>{s.icon}</i><h3>{s.title}</h3><p>{s.text}</p></li>)}
        </ol>
      </section>

      {/* O que vem */}
      <section className="pb-14" aria-labelledby="vt-inclui">
        <h2 id="vt-inclui" className="font-display text-[clamp(26px,3.8vw,38px)] font-extrabold tracking-[-.04em] text-white">O que vem no seu mini site</h2>
        <ul className="vt-features mt-6">
          {FEATURES.map((f, i) => <li key={f.title} data-reveal style={vars({ '--k': i % 4 })}><i>{f.icon}</i><h3>{f.title}</h3><p>{f.text}</p></li>)}
        </ul>
      </section>

      {/* Faixa da plaquinha */}
      <section className="pb-14" aria-label="Plaquinha de avaliações do Google">
        <div className="vt-plaq" data-reveal>
          <div className="vt-plaq-copy">
            <span className="vt-plaq-eyebrow"><Nfc size={14} /> Tem loja física?</span>
            <h2>Plaquinha de avaliações do Google, com QR Code e NFC.</h2>
            <p>O cliente aproxima o celular ou escaneia o código e já cai na avaliação da sua empresa no Google. O mini site e a plaquinha ficam no mesmo sistema.</p>
            <a className="dds-btn dds-btn-lg vt-plaq-btn" href={PLAQUINHA_URL}>Conhecer a plaquinha <ArrowUpRight size={18} /></a>
          </div>
          <div className="vt-plaq-art" aria-hidden="true">
            <img src={PLAQUINHA_IMG} alt="" loading="lazy" onError={e => { e.currentTarget.style.display = 'none'; }} />
            <span className="vt-plaq-badge"><QrCode size={16} /> QR + NFC</span>
          </div>
        </div>
      </section>

      {/* Perguntas */}
      <section className="pb-14" aria-labelledby="vt-faq">
        <h2 id="vt-faq" className="font-display text-[clamp(26px,3.8vw,38px)] font-extrabold tracking-[-.04em] text-white">Perguntas frequentes</h2>
        <div className="vt-faq mt-5">
          {FAQ.map(([q, a]) => <details key={q}><summary>{q}<Plus size={20} aria-hidden="true" /></summary><p>{a}</p></details>)}
        </div>
      </section>

      {/* Chamada final + lembrete da plaquinha */}
      <section ref={finalRef} className="pb-28 md:pb-20">
        <div className="dds-spectrum-border rounded-[28px]" data-reveal>
          <div className="rounded-[28px] bg-gradient-to-br from-[#10244f] via-navy-900 to-navy-950 p-7 sm:p-10 flex flex-col sm:flex-row sm:items-center gap-6 justify-between">
            <div>
              <h2 className="font-display text-[clamp(24px,3.6vw,36px)] font-extrabold leading-[1.08] tracking-[-.04em] text-white">Pronto para ter o seu? <span className="font-serif italic font-normal text-brand-300">Em 5 minutos.</span></h2>
              <p className="mt-2 text-[15px] text-[#a7b7d1] max-w-xl">R$ {PRECO}, pagamento único. Chame no WhatsApp, receba o seu link e publique do seu jeito.</p>
            </div>
            <span className="vt-ring shrink-0">{whats('Falar no WhatsApp agora')}</span>
          </div>
        </div>
        <a href={PLAQUINHA_URL} className="vt-plaq-line mt-4"><QrCode size={18} /><span>Também tem loja física? <strong>Conheça a plaquinha de avaliações do Google</strong></span><ArrowRight size={16} /></a>
        <p className="mt-6 text-center text-[13px] text-[#7f93b5]">Empresas, depoimentos e números dos exemplos são fictícios. Fotos ilustrativas do Unsplash. <Link to="/minisite" className="underline underline-offset-4 hover:text-white">Já sou cliente: entrar</Link> · <Link to="/" className="underline underline-offset-4 hover:text-white">DDS Avaliações</Link></p>
      </section>
    </main>

    {/* Celular: WhatsApp sempre à mão depois do topo */}
    <div className={`vt-dock${dock && !open && !how ? ' is-on' : ''}`} aria-hidden={!dock}>
      <span><b>R$ {PRECO}</b><small>pagamento único</small></span>
      <a className="dds-btn dds-btn-whats" href={quero} target="_blank" rel="noopener noreferrer" tabIndex={dock ? 0 : -1}><MessageCircle size={17} /> Chamar no WhatsApp</a>
    </div>

    {how && <div className="vt-how" role="dialog" aria-modal="true" aria-labelledby="vt-how-t" onClick={() => setHow(false)}>
      <div className="vt-how-panel" onClick={e => e.stopPropagation()}>
        <button type="button" className="vt-how-close" onClick={() => setHow(false)} aria-label="Fechar"><X size={19} /></button>
        <HowVideo onChapter={setHowStep} seek={seek} />
        <div className="w-full">
          <h2 id="vt-how-t">Como funciona</h2>
          <p className="mt-1.5 text-[15px] text-[#a7b7d1]">Do WhatsApp ao seu site no ar. Toque em um passo para ver no vídeo.</p>
          <HowSteps step={howStep} onPick={ch => setSeek({ t: VIDEO_CH[ch], n: Date.now() })} />
          <div className="vt-how-actions">
            <span className="vt-ring">{whats('Chamar no WhatsApp')}</span>
            <button type="button" onClick={toModels} className="dds-btn dds-btn-ghost-dark dds-btn-lg">Ver os modelos <ArrowDown size={17} /></button>
          </div>
        </div>
      </div>
    </div>}

    {open && <NicheViewer id={open} ids={viewerIds} name={name} onClose={close} onNav={show}
      actions={<>
        <button type="button" className="nv-ghost" onClick={() => share(open)} aria-label="Compartilhar este exemplo">{copied ? <Check size={17} /> : <Share2 size={17} />}<span>{copied ? 'Link copiado' : 'Enviar'}</span></button>
        <a className="nv-cta is-whats" href={wa(`Olá! Vi o exemplo de mini site de ${nicheById(open)!.label} na página da DDS e quero um assim${name ? ` para a ${name}` : ''}.`)} target="_blank" rel="noopener noreferrer"><MessageCircle size={17} /> Chamar no WhatsApp <ArrowRight size={15} className="nv-cta-arrow" /></a>
      </>} />}
  </div>;
}

// Lista de passos da janela "Como funciona": o passo que está passando no vídeo acende; tocar pula para ele.
function HowSteps({ step, onPick }: { step: number; onPick: (chapter: number) => void }) {
  return <ol className="vt-how-steps">
    {HOW.map((h, i) => <li key={h.title} className={h.ch ? (h.ch.includes(step) ? 'is-on' : '') : 'is-pre'}>
      {h.ch ? <button type="button" onClick={() => onPick(h.ch![0])}><b>{i + 1}</b><div><h3>{h.title}</h3><p>{h.text}</p></div></button>
        : <><b><Check size={15} /></b><div><h3>{h.title}</h3><p>{h.text}</p></div></>}
    </li>)}
  </ol>;
}

// Gravação real do estúdio, dentro de um celular. Sem som; com "reduzir movimento", não começa sozinho.
function HowVideo({ onChapter, seek }: { onChapter: (chapter: number) => void; seek: { t: number; n: number } | null }) {
  const ref = useRef<HTMLVideoElement>(null);
  const still = useMemo(() => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  useEffect(() => {
    const v = ref.current;
    if (!seek || !v) return;
    v.currentTime = seek.t; v.play().catch(() => { /* o navegador pode pedir um toque */ });
  }, [seek]);
  const chapterAt = (t: number) => VIDEO_CH.reduce((acc, c, k) => (t >= c - 0.05 ? k : acc), 0);
  return <div className="vt-demo is-big is-video">
    <div className="vt-demo-phone"><div className="vt-demo-screen">
      <video ref={ref} poster={VIDEO_POSTER} muted playsInline autoPlay={!still} loop controls={still} preload="auto"
        aria-label="Vídeo: o estúdio do mini site sendo preenchido do zero até o site no ar"
        onTimeUpdate={e => onChapter(chapterAt(e.currentTarget.currentTime))}>
        <source src={`${VIDEO_URL}.mp4`} type="video/mp4" />
        <source src={`${VIDEO_URL}.webm`} type="video/webm" />
      </video>
      <i className="vt-demo-island" />
    </div></div>
  </div>;
}
