import { CSSProperties, Fragment, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  MapPin, MessageCircle, Clock, Instagram, Star, ArrowUpRight, X, Globe, Facebook, Youtube, Mail, Phone, ShieldCheck, Heart, Truck, Award, Leaf,
  Sparkles, ThumbsUp, Wrench, Smile, Zap, CalendarCheck, Users, Wallet, Plus, UtensilsCrossed,
  Bike, FileText, Play, UserPlus, Target, Eye, Gem, ChevronRight,
} from 'lucide-react';
import { MiniContent, MiniTheme, normalizeContent, safeUrl, imageUrl, whatsapp, youtubeId, listTitleFor } from '../lib/miniPage';
import { paletteVars, shaderColors } from '../lib/miniPalettes';
import { useMiniMotion } from '../lib/miniMotion';
import { useThemeFonts } from '../lib/miniFonts';
import MiniShader, { ShaderKind } from './MiniShader';
import '../mini-site.css';

type Vars = CSSProperties & Record<`--${string}`, string | number>;

const CLASSIC: MiniTheme[] = ['elegance', 'viva', 'essencial'];
const SHADERS: Partial<Record<MiniTheme, ShaderKind>> = { brasa: 'brasa', aura: 'aura', navalha: 'navalha', vital: 'vital', impulso: 'impulso' };
export const ICONS: Record<string, typeof Star> = { shield: ShieldCheck, clock: Clock, star: Star, heart: Heart, truck: Truck, award: Award, leaf: Leaf, sparkles: Sparkles, thumbs: ThumbsUp, wrench: Wrench, smile: Smile, zap: Zap, calendar: CalendarCheck, users: Users, wallet: Wallet, pin: MapPin };

// thumb: miniatura dos cartões (sem interação, sem WebGL).
// floating: página inteira (pública ou prévia em tela cheia), com o botão flutuante do WhatsApp.
export default function MiniLanding({ content, demo = false, thumb = false, floating = false }: { content: MiniContent; demo?: boolean; thumb?: boolean; floating?: boolean }) {
  const c = useMemo(() => normalizeContent(content), [content]);
  const [photo, setPhoto] = useState('');
  const [privacy, setPrivacy] = useState(false);
  const [toast, setToast] = useState('');
  const [video, setVideo] = useState(false);
  const [showFloat, setShowFloat] = useState(false);
  const root = useRef<HTMLElement>(null);
  const heroCta = useRef<HTMLDivElement>(null);
  const vars = paletteVars(c.theme, c.palette, c.brandColor) as Vars;
  useThemeFonts(thumb ? [] : [c.theme]);
  const counts = [c.products.length, c.gallery.length, c.benefits.length, c.stats.length, c.testimonials.length, c.brands.length, c.faq.length, +!!c.description, +!!c.video, +!!c.cover, +!!c.headline, +!!(c.address || c.hours)].join('.');
  useMiniMotion(root, !thumb, `${c.theme}|${counts}`);

  const name = c.name || 'Sua empresa';
  const initial = name.slice(0, 1);
  const message = c.ctaMessage || `Olá, ${name}! Vi sua página e gostaria de mais informações.`;
  const wa = whatsapp(c.phone, message);
  const ctaLabel = c.ctaText || 'Conversar no WhatsApp';
  const maps = safeUrl(c.maps) || (c.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address)}` : '');
  const instagram = c.instagram.startsWith('@') ? `https://www.instagram.com/${encodeURIComponent(c.instagram.slice(1))}/` : safeUrl(c.instagram);
  const tiktok = c.tiktok.startsWith('@') ? `https://www.tiktok.com/${encodeURIComponent(c.tiktok)}` : safeUrl(c.tiktok);
  const socials = [
    instagram && { href: instagram, label: 'Instagram', icon: <Instagram size={19} /> },
    safeUrl(c.facebook) && { href: safeUrl(c.facebook), label: 'Facebook', icon: <Facebook size={19} /> },
    tiktok && { href: tiktok, label: 'TikTok', icon: <TikTokIcon /> },
    safeUrl(c.youtube) && { href: safeUrl(c.youtube), label: 'YouTube', icon: <Youtube size={19} /> },
    safeUrl(c.website) && { href: safeUrl(c.website), label: 'Site', icon: <Globe size={19} /> },
  ].filter(Boolean) as { href: string; label: string; icon: ReactNode }[];
  const cover = imageUrl(c.cover);
  const logo = imageUrl(c.logo);
  const gallery = c.gallery.filter(url => imageUrl(url));
  const brands = c.brands.filter(url => imageUrl(url));
  const benefits = c.benefits.filter(x => x.title || x.text);
  const stats = c.stats.filter(x => x.value);
  const quotes = c.testimonials.filter(x => x.text);
  const faq = c.faq.filter(x => x.q && x.a);
  const withPhotos = c.products.some(p => imageUrl(p.image));
  const classic = CLASSIC.includes(c.theme);
  const shader = SHADERS[c.theme];
  const ytId = youtubeId(c.video);
  const videoUrl = safeUrl(c.video);
  const actions = [
    safeUrl(c.booking) && { href: safeUrl(c.booking), label: 'Agendar horário', icon: <CalendarCheck size={20} /> },
    safeUrl(c.delivery) && { href: safeUrl(c.delivery), label: 'Pedir pelo delivery', icon: <Bike size={20} /> },
    safeUrl(c.menu) && { href: safeUrl(c.menu), label: 'Ver cardápio completo', icon: <FileText size={20} /> },
  ].filter(Boolean) as { href: string; label: string; icon: ReactNode }[];
  const mvv = [
    c.mission && { title: 'Missão', text: c.mission, icon: <Target size={19} /> },
    c.vision && { title: 'Visão', text: c.vision, icon: <Eye size={19} /> },
    c.values && { title: 'Valores', text: c.values, icon: <Gem size={19} /> },
  ].filter(Boolean) as { title: string; text: string; icon: ReactNode }[];
  const ticker = c.products.map(p => p.name).filter(Boolean);
  const tickerItems = ticker.length ? ticker : [c.tagline || name];
  const finalTitle = c.finalTitle || (wa ? 'Vamos conversar?' : '');
  const finalText = c.finalText || (c.finalTitle ? '' : 'Fale com a gente pelo WhatsApp e tire suas dúvidas.');
  const vcard = useMemo(() => thumb ? null : buildVcard(c), [c, thumb]);
  useEffect(() => () => { if (vcard) URL.revokeObjectURL(vcard.url); }, [vcard]);
  const open = (url: string) => { if (!thumb) setPhoto(url); };
  const tab = thumb ? -1 : undefined;

  useEffect(() => {
    if (!floating || thumb || !wa) return;
    const el = heroCta.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setShowFloat(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [floating, thumb, wa]);
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(''), 2600); return () => clearTimeout(id); }, [toast]);

  const ctaButton = (extra = '') => wa
    ? <a className={`mini-wa ${extra}`} href={wa} target="_blank" rel="noreferrer" tabIndex={tab}><MessageCircle size={20} /><span>{ctaLabel}</span><ArrowUpRight size={18} /></a>
    : demo ? <div className={`mini-wa ${extra}`} title="Na página real, este botão abre o WhatsApp"><MessageCircle size={20} /><span>{ctaLabel}</span><ArrowUpRight size={18} /></div> : null;

  const card = (cover || classic) && <div className="mini-card3d">
    <div className="mini-card3d-float">
      <div className="mini-card3d-face" style={cover ? { backgroundImage: `url("${cover}")` } : undefined}>
        {!cover && <span className="mini-card3d-initial" aria-hidden="true">{initial}</span>}
        <i className="mini-sheen" aria-hidden="true" />
      </div>
    </div>
  </div>;
  const logoEl = <div className="mini-logo">{c.theme === 'vital' && <><i className="mini-pulse" aria-hidden="true" /><i className="mini-pulse p2" aria-hidden="true" /></>}{logo ? <img src={logo} alt={`Logo ${name}`} /> : <span aria-hidden="true">{initial}</span>}</div>;
  const classes = ['mini-landing', `theme-${c.theme}`, classic ? '' : 'is-niche', thumb ? 'is-thumb' : '', cover ? 'has-cover' : 'no-cover', c.headline ? 'has-headline' : '', c.theme === 'refugio' && c.palette === 'p4' ? 'is-night' : '', floating && wa ? 'has-float' : ''].filter(Boolean).join(' ');

  return <><article ref={root} className={classes} style={vars}>
    {demo && !thumb && <div className="mini-demo-label">Empresa fictícia · Prévia de demonstração</div>}
    <header className="mini-hero" data-hero>
      <div className="mini-scene" aria-hidden="true">
        {shader && !thumb && <MiniShader key={shader} kind={shader} colors={shaderColors(vars as any)} />}
        {classic && <><i className="mini-orb o1" /><i className="mini-orb o2" /><i className="mini-orb o3" /><i className="mini-ring" /></>}
        <SceneDecor theme={c.theme} />
      </div>
      {c.theme === 'refugio' ? <Landscape>{card}</Landscape> : card}
      {c.theme === 'navalha' && <BarberPole />}
      <div className="mini-hero-copy">
        {c.headline ? <div className="mini-brand">{logoEl}<span className="mini-brand-name">{name}</span></div> : logoEl}
        <SplitTitle text={c.headline || name} />
        {(c.tagline || !c.headline) && <p>{c.tagline || 'Seu negócio merece ser visto.'}</p>}
        <div className="mini-cta-wrap" ref={heroCta}>{ctaButton()}</div>
      </div>
      {c.theme === 'impulso' && <div className="mini-bands" aria-hidden="true"><Marquee items={tickerItems} /><Marquee items={[name, c.tagline || c.headline || '']} reverse /></div>}
    </header>
    {(c.theme === 'brasa' || c.theme === 'navalha') && <div className="mini-ticker" aria-hidden="true"><Marquee items={tickerItems} /></div>}

    <div className="mini-body">
      {benefits.length > 0 && <section className="mini-sec">
        <h2 data-reveal>Por que escolher a gente</h2>
        <ul className={`mini-benefits${benefits.length % 2 ? ' is-odd' : ''}`}>
          {benefits.map((x, i) => { const Icon = ICONS[x.icon] ?? Sparkles; return <li className="mini-benefit" key={x.id} data-reveal style={{ '--i': i } as Vars}><i><Icon size={21} /></i>{x.title && <h3>{x.title}</h3>}{x.text && <p>{x.text}</p>}</li>; })}
        </ul>
      </section>}

      {(c.description || mvv.length > 0) && <section className="mini-sec mini-about">
        <h2 data-reveal>Quem somos</h2>
        {c.description && <p className="mini-lead" data-reveal>{c.description}</p>}
        {mvv.length > 0 && <div className="mini-mvv">{mvv.map((x, i) => <div key={x.title} data-reveal style={{ '--i': i } as Vars}><i>{x.icon}</i><h3>{x.title}</h3><p>{x.text}</p></div>)}</div>}
      </section>}

      {c.products.length > 0 && (withPhotos ? <section className="mini-sec">
        <div className="mini-section-heading" data-reveal><h2>{listTitleFor(c)}</h2>{c.products.length > 1 && <span>Deslize para ver todos</span>}</div>
        <div className={`mini-coverflow${c.products.length === 1 ? ' is-single' : ''}`} data-coverflow>
          {c.products.map((p, i) => <div className="mini-product" key={p.id} style={{ '--off': i, '--abs': Math.min(i, 2), zIndex: 10 - Math.min(i, 2) * 3 } as Vars}>
            {imageUrl(p.image) && <button className="mini-photo-button" onClick={() => open(p.image)} aria-label={`Ampliar ${p.name}`} tabIndex={tab}><img src={imageUrl(p.image)} alt={p.name} loading="lazy" /></button>}
            <div className="mini-product-text">
              <h3>{p.name}</h3>
              {p.description && <p>{p.description}</p>}
              {p.price && <strong>R$ {p.price}</strong>}
              {wa && <a href={whatsapp(c.phone, `Olá! Gostaria de saber mais sobre ${p.name}.`)} target="_blank" rel="noreferrer" tabIndex={tab}>Tenho interesse <ArrowUpRight size={14} /></a>}
            </div>
          </div>)}
        </div>
      </section> : <section className="mini-sec">
        <div className="mini-section-heading" data-reveal><h2>{listTitleFor(c)}</h2></div>
        <ul className="mini-menu">
          {c.products.map((p, i) => <li key={p.id} data-reveal style={{ '--i': i % 8 } as Vars}>
            <div className="mini-menu-head"><h3>{p.name}</h3><i aria-hidden="true" />{p.price && <strong>R$ {p.price}</strong>}</div>
            {p.description && <p>{p.description}</p>}
            {wa && <a href={whatsapp(c.phone, `Olá! Gostaria de saber mais sobre ${p.name}.`)} target="_blank" rel="noreferrer" tabIndex={tab}>Tenho interesse <ArrowUpRight size={14} /></a>}
          </li>)}
        </ul>
      </section>)}

      {stats.length > 0 && <section className="mini-sec" aria-label="Números">
        <div className={`mini-stats n${stats.length}`}>{stats.map((x, i) => <div className="mini-stat" key={x.id} data-reveal style={{ '--i': i } as Vars}><CountUp value={x.value} still={thumb} />{x.label && <span>{x.label}</span>}</div>)}</div>
      </section>}

      {quotes.length > 0 && <section className="mini-sec">
        <h2 data-reveal>O que dizem nossos clientes</h2>
        {demo && <p className="mini-note">Depoimentos de exemplo</p>}
        <div className={`mini-quotes${quotes.length === 1 ? ' is-single' : ''}`}>
          {quotes.map((x, i) => <figure className="mini-quote" key={x.id} data-reveal style={{ '--i': i } as Vars}>
            <div className="mini-stars" aria-label={`${x.stars || 5} de 5 estrelas`}>{Array.from({ length: Math.max(1, Math.min(5, x.stars || 5)) }, (_, k) => <Star key={k} size={16} fill="currentColor" />)}</div>
            <blockquote>{x.text}</blockquote>
            {x.name && <figcaption><b aria-hidden="true">{x.name.slice(0, 1)}</b><span>{x.name}{x.source === 'google' && <small className="mini-via">via Google</small>}</span></figcaption>}
          </figure>)}
        </div>
      </section>}

      {brands.length > 0 && <section className="mini-sec">
        <h2 data-reveal>Quem confia no nosso trabalho</h2>
        <div className="mini-brands">{brands.map((url, i) => <figure key={i} data-reveal style={{ '--i': i % 6 } as Vars}><img src={imageUrl(url)} alt={`Cliente ${i + 1}`} loading="lazy" /></figure>)}</div>
      </section>}

      {gallery.length > 0 && <section className="mini-sec">
        <h2 data-reveal>Um pouco do nosso mundo</h2>
        <div className="mini-gallery">{gallery.map((url, i) => <button key={i} data-reveal style={{ '--i': i % 6 } as Vars} onClick={() => open(url)} aria-label={`Ampliar foto ${i + 1}`} tabIndex={tab}><img src={imageUrl(url)} alt={`${name}, foto ${i + 1}`} loading="lazy" /></button>)}</div>
      </section>}

      {videoUrl && <section className="mini-sec">
        <h2 data-reveal>Veja por dentro</h2>
        {ytId ? (video ? <div className="mini-video"><iframe src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`} title={`Vídeo de ${name}`} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen /></div>
          : <button className="mini-video" data-reveal onClick={() => !thumb && setVideo(true)} aria-label="Assistir ao vídeo" tabIndex={tab}><img src={`https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`} alt="" loading="lazy" /><span><Play size={28} fill="currentColor" /></span></button>)
          : <a className="mini-link" href={videoUrl} target="_blank" rel="noreferrer" tabIndex={tab}><Play size={20} /><span>Assistir ao vídeo</span><ChevronRight size={18} /></a>}
      </section>}

      {actions.length > 0 && <section className="mini-sec mini-links" aria-label="Agendamento e pedidos">
        {actions.map((x, i) => <a className="mini-link" key={x.label} href={x.href} target="_blank" rel="noreferrer" data-reveal style={{ '--i': i } as Vars} tabIndex={tab}>{x.icon}<span>{x.label}</span><ChevronRight size={18} /></a>)}
      </section>}

      {faq.length > 0 && <section className="mini-sec">
        <h2 data-reveal>Perguntas frequentes</h2>
        <div className="mini-faq" data-reveal>{faq.map(x => <details key={x.id}><summary tabIndex={tab}>{x.q}<Plus size={20} /></summary><p>{x.a}</p></details>)}</div>
      </section>}

      {(c.address || c.hours) && <section className="mini-sec mini-info" data-reveal>
        <h2>Venha nos visitar</h2>
        {c.address && <p><MapPin size={18} />{c.address}</p>}
        {c.hours && <p><Clock size={18} />{c.hours}</p>}
        {maps && <a className="mini-location" href={maps} target="_blank" rel="noreferrer" tabIndex={tab}><MapPin size={18} /> Como chegar</a>}
      </section>}

      {finalTitle && (wa || demo) && <section className="mini-final" data-reveal>
        <h2>{finalTitle}</h2>
        {finalText && <p>{finalText}</p>}
        {ctaButton()}
      </section>}

      <footer className="mini-foot">
        <div className="mini-foot-name">{name}</div>
        {(c.phone || c.email) && <div className="mini-contacts">
          {c.phone && <a href={`tel:${c.phone.replace(/[^\d+]/g, '')}`} tabIndex={tab}><Phone size={17} />{c.phone}</a>}
          {c.email && <a href={`mailto:${c.email}`} tabIndex={tab}><Mail size={17} />{c.email}</a>}
        </div>}
        {socials.length > 0 && <div className="mini-socials">{socials.map(x => <a key={x.label} href={x.href} target="_blank" rel="noreferrer" aria-label={x.label} tabIndex={tab}>{x.icon}</a>)}</div>}
        {(vcard || safeUrl(c.review)) && <div className="mini-foot-actions">
          {vcard && <a href={vcard.url} download={vcard.file} tabIndex={tab}><UserPlus size={18} />Salvar contato</a>}
          {safeUrl(c.review) && <a className="mini-review" href={safeUrl(c.review)} target="_blank" rel="noreferrer" tabIndex={tab}><Star size={18} />Avaliar no Google</a>}
        </div>}
        <div className="mini-legal"><span>© {new Date().getFullYear()} {name}</span><button onClick={() => !thumb && setPrivacy(true)} tabIndex={tab}>Privacidade</button><a href="https://www.ddsinovacao.com.br/" target="_blank" rel="noreferrer" tabIndex={tab}>Feito com DDS Inovação</a></div>
      </footer>
    </div>
  </article>
    {/* Fora do <article>: o container do mini site prenderia o position:fixed. */}
    {floating && wa && <a className={`mini-float${showFloat ? ' is-on' : ''}`} href={wa} target="_blank" rel="noreferrer" aria-label={ctaLabel}><MessageCircle size={28} /></a>}
    {photo && <div className="mini-lightbox" role="dialog" aria-modal="true" aria-label="Foto ampliada" onClick={() => setPhoto('')}><button autoFocus onClick={() => setPhoto('')} aria-label="Fechar foto" onKeyDown={e => { if (e.key === 'Escape') setPhoto(''); }}><X /></button><img src={imageUrl(photo)} alt="Foto ampliada" /></div>}
    {privacy && <div className="mini-sheet" role="dialog" aria-modal="true" aria-label="Privacidade" onClick={() => setPrivacy(false)}><div onClick={e => e.stopPropagation()}>
      <h2>Privacidade</h2>
      <p>Esta página apresenta as informações de {name}. Ela não pede, não guarda e não vende seus dados pessoais, e não usa cookies de rastreamento.</p>
      <p>Para exibir textos e imagens, a página carrega arquivos de serviços como Google Fonts e YouTube. Ao tocar em WhatsApp, redes sociais, mapas ou outros links, você vai para o serviço escolhido, que segue a política de privacidade dele.</p>
      <p>Para falar sobre seus dados com {name}, use os contatos desta página.</p>
      <button autoFocus onClick={() => setPrivacy(false)} onKeyDown={e => { if (e.key === 'Escape') setPrivacy(false); }}>Entendi</button>
    </div></div>}
    {toast && <div className="mini-toast" role="status">{toast}</div>}
  </>;
}

// Título animado: letra a letra em nomes curtos e palavra a palavra em frases longas
// (menos elementos animando ao mesmo tempo no celular). O leitor de tela lê o texto inteiro.
function SplitTitle({ text }: { text: string }) {
  let index = 0;
  const words = text.trim().split(/\s+/);
  const longest = Math.max(4, ...words.map(w => Array.from(w).length));
  const long = Array.from(text).length > 24;
  return <h1 aria-label={text} className={long ? 'is-long' : undefined} style={{ '--lw': longest, '--tl': Math.max(8, Array.from(text).length) } as Vars}>{words.map((word, w) => <Fragment key={w}>{w > 0 && ' '}<span className="mini-w" aria-hidden="true">{long
    ? <span className="mini-ch" style={{ '--ci': (index++) * 3 } as Vars}>{word}</span>
    : Array.from(word).map(ch => <span className="mini-ch" key={index} style={{ '--ci': index++ } as Vars}>{ch}</span>)}</span></Fragment>)}</h1>;
}

// "+1.200", "4,9", "10 anos": anima só a parte numérica quando aparece na tela.
function CountUp({ value, still }: { value: string; still: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const m = value.match(/^(\D*?)(\d[\d.,]*)(.*)$/);
  const [shown, setShown] = useState(value);
  useEffect(() => {
    setShown(value);
    const el = ref.current;
    if (!m || !el || still || matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const [, pre, num, post] = m;
    const decimal = /,\d{1,2}$/.test(num);
    const target = decimal ? parseFloat(num.replace(/\./g, '').replace(',', '.')) : parseInt(num.replace(/[.,]/g, ''), 10);
    if (!isFinite(target) || target === 0) return;
    const fmt = (n: number) => decimal ? n.toFixed(num.split(',')[1].length).replace('.', ',') : Math.round(n).toLocaleString('pt-BR');
    let raf = 0;
    setShown(pre + fmt(0) + post);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (now: number) => { const k = Math.min(1, (now - t0) / 1400); setShown(pre + fmt(target * (1 - Math.pow(1 - k, 3))) + post); if (k < 1) raf = requestAnimationFrame(step); else setShown(value); };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value, still]);
  return <strong ref={ref}>{shown}</strong>;
}

function buildVcard(c: MiniContent) {
  if (typeof Blob === 'undefined' || !c.name || !(c.phone || c.email)) return null;
  const esc = (v: string) => v.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const digits = c.phone.replace(/\D/g, '');
  const tel = digits.length === 10 || digits.length === 11 ? '+55' + digits : digits ? '+' + digits : '';
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${esc(c.name)}`, `ORG:${esc(c.name)}`, tel && `TEL;TYPE=CELL:${tel}`, c.email && `EMAIL:${esc(c.email)}`, c.address && `ADR;TYPE=WORK:;;${esc(c.address)};;;;`, safeUrl(c.website) && `URL:${safeUrl(c.website)}`, 'END:VCARD'].filter(Boolean);
  const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/vcard' }));
  return { url, file: `${c.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '-').toLowerCase() || 'contato'}.vcf` };
}

function TikTokIcon() {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.59c.27 0 .53.04.77.12V9.77a5.72 5.72 0 1 0 4.91 5.63V9.01a7.3 7.3 0 0 0 4.27 1.37V7.29a4.28 4.28 0 0 1-3.21-1.47Z" /></svg>;
}

function Marquee({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  const list = items.filter(Boolean);
  const run = <span className="mini-marquee-run">{list.map((t, i) => <Fragment key={i}><span>{t}</span><b>✦</b></Fragment>)}</span>;
  return <div className={`mini-marquee${reverse ? ' is-reverse' : ''}`}><div className="mini-marquee-track">{run}{run}{run}{run}</div></div>;
}

const ECG = 'M0 60 H46 L58 60 L66 38 L74 76 L86 8 L98 92 L108 52 L118 60 H286 L296 60 L302 48 L310 70 L318 60 H400';
function SceneDecor({ theme }: { theme: MiniTheme }) {
  if (theme === 'aura') return <><i className="mini-glass-orb" /><i className="mini-spark s1" /><i className="mini-spark s2" /><i className="mini-spark s3" /><i className="mini-spark s4" /></>;
  if (theme === 'vital') return <>
    <svg className="mini-ecg" viewBox="0 0 400 100" preserveAspectRatio="none"><path className="ecg-base" d={ECG} /><path className="ecg-run" pathLength={100} d={ECG} /></svg>
    <i className="mini-clay c1" /><i className="mini-clay c2" /><i className="mini-clay c3" />
  </>;
  if (theme === 'brasa') return <i className="mini-heat" />;
  if (theme === 'impulso') return <i className="mini-flare" />;
  return null;
}

function BarberPole() {
  return <div className="mini-pole" aria-hidden="true"><i className="mini-pole-cap" /><i className="mini-pole-tube" /><i className="mini-pole-cap is-bottom" /></div>;
}

// Pinheiros desenhados uma vez (caminhos SVG fixos).
const pines = (trees: number[][]) => {
  let d = '';
  for (const [x, base, hgt] of trees) {
    const w = hgt * 0.36;
    for (let k = 0; k < 3; k++) {
      const top = base - hgt + k * hgt * 0.24, bottom = base - hgt * 0.42 + k * hgt * 0.3, half = w * (0.55 + k * 0.28);
      d += `M${x} ${top.toFixed(1)}L${(x - half).toFixed(1)} ${bottom.toFixed(1)}H${(x + half).toFixed(1)}Z`;
    }
  }
  return d;
};
const PINES = pines([[8, 228, 34], [30, 238, 26], [52, 222, 44], [78, 236, 30], [300, 230, 38], [326, 240, 26], [350, 220, 48], [378, 234, 34], [398, 226, 40]]);
const FAR_PINES = pines([[118, 192, 14], [130, 196, 11], [142, 190, 16], [200, 186, 13], [214, 190, 10], [252, 182, 15], [266, 186, 12]]);

function Landscape({ children }: { children?: ReactNode }) {
  return <div className="mini-land">
    <div className="mini-land-back" aria-hidden="true">
      <i className="mini-sky-stars" />
      <i className="mini-sun" />
      <svg className="ml-far" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice"><path d="M0 170L42 128L78 150L128 92L168 134L212 104L258 150L302 100L348 138L400 112V300H0Z" /></svg>
      <i className="mini-fog f1" />
      <svg className="ml-mid" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice"><path d="M0 204Q60 160 124 188T246 176T400 172V300H0Z" /><path className="ml-pines" d={FAR_PINES} /></svg>
    </div>
    {children}
    <div className="mini-land-front" aria-hidden="true">
      <svg className="ml-near" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice"><path d="M0 238Q84 204 172 230T400 216V300H0Z" /><path className="ml-pines" d={PINES} /></svg>
      <i className="mini-fog f2" />
      <svg className="ml-meadow" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice"><path d="M0 272Q100 254 202 268T400 262V300H0Z" /></svg>
      {[1, 2, 3, 4, 5, 6, 7].map(i => <i key={i} className={`mini-firefly ff${i}`} />)}
    </div>
  </div>;
}
