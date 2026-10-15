import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowDown, ArrowRight, ArrowUpRight, Check, Globe, Image, LayoutGrid, MapPin, MessageCircle, Nfc, PenLine,
  Plus, QrCode, Send, Share2, Smartphone, Sparkles, Star, UserPlus, X,
} from 'lucide-react';
import { Aurora, BrandMark } from '../components/ui/Fx';
import { NicheCard, NicheChips, NicheViewer, GroupFilter, nichesOf, PhonePoster, withName } from '../components/NicheShowcase';
import { NICHES, NicheId, nicheById } from '../lib/miniNicheCore';
import { nicheDemo } from '../lib/miniNicheDemos';
import { MINI_THEMES } from '../lib/miniPage';
import { loadFonts } from '../lib/miniFonts';
import '../mini.css';

// Página de vendas dos mini sites (/exemplos, link curto www.ddsinovacao.com.br/minisites).
// A pessoa digita o nome da empresa dela e vê todos os modelos com esse nome; toca em um ramo e a
// página inteira abre. /exemplos/<ramo>?nome=... abre direto o exemplo (link para mandar depois).
// No meio e no fim, a propaganda da plaquinha de avaliações leva para www.ddsinovacao.com.br/plaquinhas/.

const WHATS = '5541991542931';
const wa = (msg: string) => `https://wa.me/${WHATS}?text=${encodeURIComponent(msg)}`;
const PLAQUINHA_URL = 'https://www.ddsinovacao.com.br/plaquinhas/';
const PLAQUINHA_IMG = 'https://www.ddsinovacao.com.br/plaquinhas/placa-google.png';
const HERO_NICHES: NicheId[] = ['moda', 'pizzaria', 'floricultura'];

const STEPS: { icon: ReactNode; title: string; text: string }[] = [
  { icon: <LayoutGrid size={20} />, title: 'Escolha o modelo', text: `São ${NICHES.length} ramos, cada um com visual próprio. Toque em "Quero um assim" no que combina com você.` },
  { icon: <Send size={20} />, title: 'Mande suas informações', text: 'Pelo WhatsApp: fotos, produtos ou cardápio, preços, horários, endereço e redes sociais.' },
  { icon: <Globe size={20} />, title: 'Seu site no ar', text: 'No endereço www.ddsinovacao.com.br/suaempresa, pronto para a bio do Instagram, o Google e o WhatsApp.' },
];

const FEATURES: { icon: ReactNode; title: string; text: string }[] = [
  { icon: <MessageCircle size={19} />, title: 'Botão de WhatsApp', text: 'O cliente toca e já cai na conversa, com a mensagem pronta.' },
  { icon: <Image size={19} />, title: 'Produtos com fotos', text: 'Cardápio, serviços, planos ou estoque, com preço e botão de pedido em cada item.' },
  { icon: <MapPin size={19} />, title: 'Endereço e horários', text: 'Com o botão "Como chegar" abrindo direto no mapa.' },
  { icon: <Star size={19} />, title: 'Avaliações', text: 'Depoimentos dos clientes e botão para avaliar no Google.' },
  { icon: <Smartphone size={19} />, title: 'Feito para o celular', text: 'Abre rápido no celular e também fica bonito no computador.' },
  { icon: <Sparkles size={19} />, title: 'Visual do seu ramo', text: 'Cores, letras e um efeito animado na capa que reage ao toque.' },
  { icon: <UserPlus size={19} />, title: 'Salvar contato', text: 'O cliente salva o seu número na agenda com um toque.' },
  { icon: <PenLine size={19} />, title: 'Você atualiza', text: 'Troque fotos, preços e textos quando quiser, no seu próprio sistema.' },
];

const FAQ: [string, string][] = [
  ['Preciso ter domínio ou hospedagem?', 'Não. O seu site fica em www.ddsinovacao.com.br/suaempresa, já no ar e pronto para compartilhar.'],
  ['Funciona no celular?', 'Sim. Os modelos foram feitos primeiro para o celular, que é onde seus clientes vão abrir, e também ficam bonitos no computador.'],
  ['Posso mudar fotos, preços e textos depois?', 'Sim. Você recebe um acesso ao seu sistema para atualizar quando quiser. Se preferir, é só pedir pelo WhatsApp.'],
  ['Quanto custa?', 'Chame no WhatsApp: a gente conta os valores e tira todas as suas dúvidas, sem compromisso.'],
  ['Preciso ter a plaquinha de avaliações?', 'Não. O mini site pode ser contratado sozinho. Se tiver loja física, dá para ter os dois no mesmo sistema.'],
  ['As empresas dos exemplos são reais?', 'Não. Empresas, depoimentos e números dos exemplos são fictícios e as fotos são ilustrativas. O seu terá as suas fotos e informações.'],
];

export default function Vitrine() {
  const { niche } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const name = (params.get('nome') ?? '').slice(0, 60);
  const [draft, setDraft] = useState(name);
  const [group, setGroup] = useState<GroupFilter>('todos');
  const [copied, setCopied] = useState(false);
  const open = nicheById(niche)?.id ?? null;
  const list = useMemo(() => nichesOf(group).map(n => n.id), [group]);
  const viewerIds = open && !list.includes(open) ? nichesOf('todos').map(n => n.id) : list;
  const typing = useRef<ReturnType<typeof setTimeout>>();
  const gridRef = useRef<HTMLDivElement>(null);
  const heroPhones = useMemo(() => HERO_NICHES.map(id => ({ id, theme: nicheById(id)!.theme, content: withName(nicheDemo(id, 'thumb'), name) })), [name]);

  useEffect(() => { document.title = 'Mini sites para o seu negócio · DDS Inovação'; loadFonts(MINI_THEMES); }, []);
  useEffect(() => { setDraft(name); }, [name]);

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
  const toModels = () => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const quero = wa(`Olá! Vi os mini sites da DDS e quero o meu${name ? ` para a ${name}` : ''}.`);

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
          <a className="hidden sm:inline-flex dds-btn dds-btn-ghost-dark dds-btn-sm" href={PLAQUINHA_URL}><QrCode size={15} /> Plaquinha de avaliações</a>
          <a className="dds-btn dds-btn-whats dds-btn-sm sm:px-4" href={quero} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /> Quero o meu</a>
        </nav>
      </div>
    </header>

    <main className="max-w-6xl mx-auto px-4 sm:px-6">
      {/* Topo de vendas */}
      <section className="vt-hero pt-10 sm:pt-14 pb-8 sm:pb-10">
        <div>
          <span className="dds-eyebrow"><Sparkles size={14} className="text-[#66e0ff]" />Mini sites para negócios locais · {NICHES.length} ramos</span>
          <h1 className="mt-5 font-display font-extrabold text-[clamp(34px,6.2vw,62px)] leading-[1.02] tracking-[-.045em] text-white">
            O site do <span className="font-serif italic font-normal dds-spectrum-text">seu negócio</span>, pronto para vender pelo WhatsApp.
          </h1>
          <p className="mt-4 max-w-xl text-[16px] sm:text-lg leading-relaxed text-[#a7b7d1]">Escolha um modelo do seu ramo, veja como fica com o nome da sua empresa e a gente monta com as suas fotos, produtos e contatos.</p>
          <label className="vt-name mt-7">
            <PenLine size={18} aria-hidden="true" />
            <span className="sr-only">Nome da sua empresa</span>
            <input value={draft} onChange={e => setName(e.target.value)} maxLength={60} placeholder="Digite o nome da sua empresa" autoComplete="off" enterKeyHint="done" onKeyDown={e => { if (e.key === 'Enter') toModels(); }} />
            {draft && <button type="button" onClick={() => setName('')} aria-label="Apagar o nome"><X size={17} /></button>}
          </label>
          <p className="mt-2 text-[13px] text-[#7f93b5]">{name ? <>Todos os modelos estão mostrando <strong className="text-white font-semibold">{name}</strong>.</> : 'Veja todos os modelos com o seu nome, na hora.'}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={toModels} className="dds-btn dds-btn-glow dds-btn-lg">Ver os modelos <ArrowDown size={18} /></button>
            <a className="dds-btn dds-btn-whats dds-btn-lg" href={quero} target="_blank" rel="noopener noreferrer"><MessageCircle size={19} /> Falar no WhatsApp</a>
          </div>
          <ul className="vt-checks mt-6">
            {['Botão de WhatsApp', 'Link para a bio do Instagram', 'Sem precisar de domínio'].map(t => <li key={t}><Check size={15} />{t}</li>)}
          </ul>
        </div>
        <div className="vt-hero-phones" aria-hidden="true">
          {heroPhones.map((p, i) => <button key={p.id} type="button" tabIndex={-1} className={`vt-hero-phone p${i}`} onClick={() => show(p.id)}><PhonePoster content={p.content} theme={p.theme} /></button>)}
        </div>
      </section>

      {/* Modelos */}
      <div ref={gridRef} className="scroll-mt-16">
        <div className="pt-2 pb-1">
          <h2 className="font-display text-[clamp(24px,3.4vw,34px)] font-extrabold tracking-[-.035em] text-white">Escolha o modelo do seu ramo</h2>
          <p className="mt-1 text-[15px] text-[#a7b7d1]">Toque em um exemplo para abrir a página inteira. Na capa, o efeito reage ao toque.</p>
        </div>
        <div className="vt-filter sticky top-16 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3"><NicheChips value={group} onChange={setGroup} /></div>
        <section className="nc-grid pt-4 pb-14" aria-label="Exemplos por ramo">
          {list.map((id, i) => <NicheCard key={id} id={id} name={name} index={i} paused={!!open} onOpen={show} />)}
        </section>
      </div>

      {/* Como funciona */}
      <section className="pb-14" aria-labelledby="vt-como">
        <h2 id="vt-como" className="font-display text-[clamp(26px,3.8vw,38px)] font-extrabold tracking-[-.04em] text-white">Como funciona</h2>
        <ol className="vt-steps mt-6">
          {STEPS.map((s, i) => <li key={s.title}><span className="vt-step-n">{i + 1}</span><i>{s.icon}</i><h3>{s.title}</h3><p>{s.text}</p></li>)}
        </ol>
      </section>

      {/* O que vem */}
      <section className="pb-14" aria-labelledby="vt-inclui">
        <h2 id="vt-inclui" className="font-display text-[clamp(26px,3.8vw,38px)] font-extrabold tracking-[-.04em] text-white">O que vem no seu mini site</h2>
        <ul className="vt-features mt-6">
          {FEATURES.map(f => <li key={f.title}><i>{f.icon}</i><h3>{f.title}</h3><p>{f.text}</p></li>)}
        </ul>
      </section>

      {/* Faixa da plaquinha */}
      <section className="pb-14" aria-label="Plaquinha de avaliações do Google">
        <div className="vt-plaq">
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
      <section className="pb-20">
        <div className="dds-spectrum-border rounded-[28px]">
          <div className="rounded-[28px] bg-gradient-to-br from-[#10244f] via-navy-900 to-navy-950 p-7 sm:p-10 flex flex-col sm:flex-row sm:items-center gap-6 justify-between">
            <div>
              <h2 className="font-display text-[clamp(24px,3.6vw,36px)] font-extrabold leading-[1.08] tracking-[-.04em] text-white">Gostou de algum? <span className="font-serif italic font-normal text-brand-300">A gente monta o seu.</span></h2>
              <p className="mt-2 text-[15px] text-[#a7b7d1] max-w-xl">Com as suas fotos, os seus produtos e o seu WhatsApp. Pronto para a bio do Instagram e para mandar aos clientes.</p>
            </div>
            <a className="dds-btn dds-btn-whats dds-btn-lg shrink-0" href={quero} target="_blank" rel="noopener noreferrer"><MessageCircle size={19} /> Quero o meu mini site</a>
          </div>
        </div>
        <a href={PLAQUINHA_URL} className="vt-plaq-line mt-4"><QrCode size={18} /><span>Também tem loja física? <strong>Conheça a plaquinha de avaliações do Google</strong></span><ArrowRight size={16} /></a>
        <p className="mt-6 text-center text-[13px] text-[#7f93b5]">Empresas, depoimentos e números dos exemplos são fictícios. Fotos ilustrativas do Unsplash. <Link to="/" className="underline underline-offset-4 hover:text-white">DDS Avaliações</Link></p>
      </section>
    </main>

    {open && <NicheViewer id={open} ids={viewerIds} name={name} onClose={close} onNav={show}
      actions={<>
        <button type="button" className="nv-ghost" onClick={() => share(open)} aria-label="Compartilhar este exemplo">{copied ? <Check size={17} /> : <Share2 size={17} />}<span>{copied ? 'Link copiado' : 'Enviar'}</span></button>
        <a className="nv-cta is-whats" href={wa(`Olá! Vi o exemplo de mini site de ${nicheById(open)!.label} na vitrine da DDS e quero um assim${name ? ` para a ${name}` : ''}.`)} target="_blank" rel="noopener noreferrer"><MessageCircle size={17} /> Quero um assim <ArrowRight size={15} className="nv-cta-arrow" /></a>
      </>} />}
  </div>;
}
