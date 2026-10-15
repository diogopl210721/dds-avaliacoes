import { CSSProperties, Fragment, ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  MapPin, MessageCircle, Clock, Instagram, Star, ArrowUpRight, X, Globe, Facebook, Youtube, Mail, Phone, ShieldCheck, Heart, Truck, Award, Leaf,
  Sparkles, ThumbsUp, Wrench, Smile, Zap, CalendarCheck, Users, Wallet, Plus, UtensilsCrossed,
  Bike, FileText, Play, UserPlus, Target, Eye, Gem, ChevronRight, ChevronLeft,
} from 'lucide-react';
import { MiniContent, MiniTheme, normalizeContent, safeUrl, imageUrl, whatsapp, youtubeId, listTitleFor } from '../lib/miniPage';
import { paletteVars, shaderColors } from '../lib/miniPalettes';
import { useMiniMotion } from '../lib/miniMotion';
import { useMiniSwipe } from '../lib/miniSwipe';
import { useThemeFonts } from '../lib/miniFonts';
import MiniShader, { ShaderKind } from './MiniShader';
import NicheFx, { fxColors } from './NicheFx';
import { nicheById } from '../lib/miniNicheCore';
import { LOOKS, specParts } from '../lib/miniLooks';
import '../mini-site.css';
// Depois do mini-site.css: os modelos de cada ramo sobrescrevem a base.
import '../mini-looks.css';

type Vars = CSSProperties & Record<`--${string}`, string | number>;

const CLASSIC: MiniTheme[] = ['elegance', 'viva', 'essencial'];
const SHADERS: Partial<Record<MiniTheme, ShaderKind>> = { brasa: 'brasa', aura: 'aura', navalha: 'navalha', vital: 'vital', impulso: 'impulso' };
export const ICONS: Record<string, typeof Star> = { shield: ShieldCheck, clock: Clock, star: Star, heart: Heart, truck: Truck, award: Award, leaf: Leaf, sparkles: Sparkles, thumbs: ThumbsUp, wrench: Wrench, smile: Smile, zap: Zap, calendar: CalendarCheck, users: Users, wallet: Wallet, pin: MapPin };

// thumb: miniatura dos cartões (sem interação, sem WebGL).
// floating: página inteira (pública ou prévia em tela cheia), com o botão flutuante do WhatsApp.
// demoLabel: troca o aviso do topo nas prévias de demonstração.
export default function MiniLanding({ content, demo = false, thumb = false, floating = false, demoLabel }: { content: MiniContent; demo?: boolean; thumb?: boolean; floating?: boolean; demoLabel?: string }) {
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
  useMiniSwipe(root, !thumb, counts);

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
  const nicheInfo = nicheById(c.niche);
  const fx = nicheInfo?.fx;
  const look = LOOKS[c.theme];
  const sealId = useId();
  const listRef = useRef<HTMLElement>(null);
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

  // Setas dos carrosséis: só aparecem com mouse (CSS); a ação fica em useMiniSwipe.
  const swipeArrows = (what: string) => thumb ? null : <>
    <button type="button" className="mini-swipe-btn is-prev" data-swipe-prev aria-label={`${what === 'produto' ? 'Produto' : 'Depoimento'} anterior`}><ChevronLeft size={22} /></button>
    <button type="button" className="mini-swipe-btn is-next" data-swipe-next aria-label={`Próximo ${what}`}><ChevronRight size={22} /></button>
  </>;

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
  // ---- Modelos próprios de cada ramo (miniLooks.ts): capa e lista montadas de outro jeito ----
  const coverStyle = cover ? { backgroundImage: `url("${cover}")` } : undefined;
  const fxEl = fx ? <NicheFx key={fx} kind={fx} colors={fxColors(vars as Record<string, string>)} thumb={thumb} /> : null;
  const heroTitle = <SplitTitle text={c.headline || name} />;
  const heroTagline = (c.tagline || !c.headline) ? <p>{c.tagline || 'Seu negócio merece ser visto.'}</p> : null;
  const heroCtaEl = <div className="mini-cta-wrap" ref={heroCta}>{ctaButton()}</div>;
  const brandEl = c.headline ? <div className="mini-brand">{logoEl}<span className="mini-brand-name">{name}</span></div> : logoEl;
  // Nome em destaque (placa, logotipo da revista): vira o título principal quando não há chamada.
  const nameEl = (cls: string) => c.headline ? <p className={cls} style={{ '--tl': Math.max(8, Array.from(name).length) } as Vars}>{name}</p> : <SplitTitle text={name} className={cls} />;
  const year = new Date().getFullYear();
  const lookHero = () => {
    if (!look) return null;
    switch (look.hero) {
      case 'poster': {
        const num = 100 + Array.from(name).reduce((a, ch) => a + ch.charCodeAt(0), 0) % 900;
        return <>
          <div className="lk-photo" style={coverStyle} aria-hidden="true" />
          <div className="lk-shade" aria-hidden="true" />
          {fxEl}
          <div className="lk-top">{brandEl}<span className="lk-bib" aria-hidden="true"><small>{name.split(/\s+/)[0].slice(0, 12)}</small><b>{num}</b></span></div>
          <div className="mini-hero-copy">{heroTitle}{heroTagline}{heroCtaEl}</div>
          {look.heroStats && stats.length > 0 && <dl className="lk-hud">{stats.slice(0, 3).map(x => <div key={x.id}><dd>{x.value}</dd>{x.label && <dt>{x.label}</dt>}</div>)}</dl>}
        </>;
      }
      case 'magazine': {
        const month = new Date().toLocaleDateString('pt-BR', { month: 'long' });
        return <>
          <div className="lk-mast"><span className="lk-issue" aria-hidden="true"><span>{month} {year}</span><span>{nicheInfo?.short ?? 'Edição'}</span></span>{nameEl('lk-masthead')}</div>
          <figure className="lk-cover" style={coverStyle}>
            {fxEl}
            <figcaption><span className="lk-kicker">{listTitleFor(c) === 'Coleção' ? 'Nova coleção' : listTitleFor(c)}</span>{c.headline ? heroTitle : c.tagline ? <p className="lk-cap">{c.tagline}</p> : null}</figcaption>
            <span className="lk-vert" aria-hidden="true">{name} · {year}</span>
          </figure>
          <div className="mini-hero-copy">{c.headline && c.tagline ? <p>{c.tagline}</p> : null}{heroCtaEl}</div>
        </>;
      }
      case 'arch':
        return <>
          <div className="lk-awning" aria-hidden="true" />
          {fxEl}
          <div className="lk-sign">{logoEl}{nameEl('lk-sign-name')}</div>
          <div className="lk-window"><div className="lk-window-photo" style={coverStyle} aria-hidden="true" /><span className="lk-stamp" aria-hidden="true">Feito<br />aqui</span></div>
          <div className="mini-hero-copy">{c.headline ? heroTitle : null}{c.tagline ? <p>{c.tagline}</p> : null}{heroCtaEl}</div>
          {c.hours && <div className="lk-chalk"><small>Horários</small><p>{c.hours}</p></div>}
        </>;
      case 'split': {
        const region = c.address.split('·').pop()?.trim() || 'Casas, apartamentos e terrenos';
        return <>
          <div className="lk-photo" style={coverStyle} aria-hidden="true" />
          {fxEl}
          <div className="lk-panel">
            {brandEl}{heroTitle}{heroTagline}
            {c.products.length > 0 && <button type="button" className="lk-search" tabIndex={tab} onClick={() => !thumb && listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
              <span><small>Encontre seu imóvel</small><b>{region}</b></span><i>Ver imóveis <ChevronRight size={16} /></i>
            </button>}
            {heroCtaEl}
          </div>
        </>;
      }
      case 'showroom':
        return <>
          <div className="lk-stage" aria-hidden="true"><i className="lk-spot" /><div className="lk-car" style={coverStyle} /><div className="lk-floor" style={coverStyle} /></div>
          {fxEl}
          <div className="mini-hero-copy">
            <div className="lk-plate"><span className="lk-plate-top">Brasil</span>{nameEl('lk-plate-name')}</div>
            {c.headline ? heroTitle : null}{heroTagline}{heroCtaEl}
          </div>
        </>;
      case 'seal': {
        const unit = `${name} · ${nicheInfo?.short ?? ''} · `.toUpperCase();
        const ring = unit.repeat(Math.max(1, Math.ceil(64 / unit.length)));
        return <>
          {fxEl}
          <div className="lk-medal">
            <svg className="lk-medal-ring" viewBox="0 0 200 200" aria-hidden="true">
              <defs><path id={sealId} d="M100,100 m-84,0 a84,84 0 1,1 168,0 a84,84 0 1,1 -168,0" /></defs>
              <text><textPath href={`#${sealId}`} textLength="524" lengthAdjust="spacing">{ring}</textPath></text>
            </svg>
            <div className="lk-medal-photo" style={coverStyle} aria-hidden="true">{!cover && <span>{initial}</span>}</div>
          </div>
          <div className="mini-hero-copy">{brandEl}{heroTitle}{heroTagline}{heroCtaEl}</div>
        </>;
      }
      case 'optician': {
        // Tabela de exame de vista montada com as letras do nome (1, 2, 3, 4 e 5 letras por linha).
        const letters = Array.from(name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]/g, '').toUpperCase());
        const src = letters.length ? letters : ['E'];
        let k = 0;
        const rows = [1, 2, 3, 4, 5].map(n => Array.from({ length: n }, () => src[k++ % src.length]).join(''));
        const acuity = ['20/200', '20/100', '20/70', '20/50', '20/40'];
        const clip = `${sealId}-lens`;
        return <>
          {fxEl}
          <div className="lk-optic-top">{brandEl}</div>
          <div className="lk-chart" aria-hidden="true">
            {rows.map((row, i) => <div key={i} className="lk-chart-row" style={{ '--r': i } as Vars}><small>{i + 1}</small><b>{row}</b><small>{acuity[i]}</small></div>)}
          </div>
          <div className="lk-frames" aria-hidden="true">
            <svg viewBox="0 0 320 136">
              <defs><clipPath id={clip}><ellipse cx="84" cy="72" rx="68" ry="56" /><ellipse cx="236" cy="72" rx="68" ry="56" /></clipPath></defs>
              <g clipPath={`url(#${clip})`}>
                <rect width="320" height="136" className="lk-lens-tint" />
                {cover && <image href={cover} x="0" y="-18" width="320" height="172" preserveAspectRatio="xMidYMid slice" />}
                <path className="lk-glare" d="M34 46 Q56 22 96 22 M190 40 Q206 22 242 20" />
              </g>
              <ellipse className="lk-rim" cx="84" cy="72" rx="68" ry="56" />
              <ellipse className="lk-rim" cx="236" cy="72" rx="68" ry="56" />
              <path className="lk-rim" d="M150 60 Q160 46 170 60 M17 58 L3 48 M303 58 L317 48" />
            </svg>
          </div>
          <div className="mini-hero-copy">{heroTitle}{heroTagline}{heroCtaEl}</div>
        </>;
      }
      case 'bouquet':
        return <>
          {fxEl}
          <div className="lk-posy">
            <Sprig className="lk-sprig is-left" />
            <Sprig className="lk-sprig is-right" />
            <div className="lk-oval" style={coverStyle} aria-hidden="true">{!cover && <span>{initial}</span>}</div>
            <span className="lk-ribbon" aria-hidden="true">{nicheInfo?.short ?? listTitleFor(c)}</span>
          </div>
          <div className="mini-hero-copy">{brandEl}{heroTitle}{heroTagline}{heroCtaEl}</div>
        </>;
      case 'worksite':
        return <>
          <div className="lk-zebra" aria-hidden="true" />
          {fxEl}
          <div className="lk-site" aria-hidden="true">
            <div className="lk-site-photo" style={coverStyle} />
            <div className="lk-tape">{[10, 20, 30, 40, 50, 60, 70, 80, 90].map(n => <span key={n}>{n}</span>)}</div>
          </div>
          <div className="mini-hero-copy">{brandEl}{heroTitle}{heroTagline}{heroCtaEl}</div>
        </>;
      case 'letterhead': {
        const skip = /^(de|da|do|das|dos|e|&|and|the|of)$/i;
        const initials = name.split(/\s+/).filter(w => w && !skip.test(w)).slice(0, 2).map(w => Array.from(w)[0].toUpperCase());
        const city = c.address.includes('·') ? c.address.split('·').pop()!.trim() : '';
        // A assinatura a tinta é escrita no próprio papel (atrás do texto).
        return <>
          <div className="lk-letter">
            {fxEl}
            <span className="lk-monogram" aria-hidden="true"><span>{initials.join('') || initial}</span></span>
            {nameEl('lk-letter-name')}
            <span className="lk-rule" aria-hidden="true"><i /><b /><i /></span>
            {c.headline ? heroTitle : null}
            {heroTagline}
            {heroCtaEl}
            {fx === 'tinta' && <span className="lk-signline" aria-hidden="true" />}
          </div>
          {cover && <figure className="lk-portrait"><div className="lk-portrait-photo" style={coverStyle} aria-hidden="true" />{city && <figcaption>{city}</figcaption>}</figure>}
        </>;
      }
      case 'table': {
        const pick = c.products.find(p => p.name);
        return <>
          <div className="lk-cloth" aria-hidden="true" />
          {fxEl}
          <div className="lk-diner">{brandEl}</div>
          <div className="lk-setting" aria-hidden="true">
            <svg className="lk-cutlery" viewBox="0 0 24 140"><path d="M1 0H4V36H7.5V0H10.5V36H13.5V0H16.5V36H20V0H23V42C23 50 18 55 15 56V134A3 3 0 0 1 9 134V56C6 55 1 50 1 42Z" /></svg>
            <div className="lk-dish"><div className="lk-dish-food" style={coverStyle} /></div>
            <svg className="lk-cutlery" viewBox="0 0 24 140"><path d="M9 2C9 .8 10 0 11 0 19 6 21 28 20 64H9ZM7.5 67H19V134A5.75 5.75 0 0 1 7.5 134Z" /></svg>
          </div>
          {pick && <div className="lk-today"><small>Destaque</small><b>{pick.name}</b>{pick.price && <span>R$ {pick.price}</span>}</div>}
          <div className="mini-hero-copy">{heroTitle}{heroTagline}{heroCtaEl}</div>
        </>;
      }
      case 'bowl': {
        const first = c.products.find(p => p.name);
        return <>
          <svg className="lk-drip" viewBox="0 0 400 96" preserveAspectRatio="none" aria-hidden="true"><path d={DRIP} /></svg>
          {fxEl}
          <div className="mini-hero-copy">{brandEl}{heroTitle}{heroTagline}{heroCtaEl}</div>
          <div className="lk-cup" aria-hidden="true">
            <i className="lk-cup-lid" />
            <div className="lk-cup-body"><div className="lk-cup-photo" style={coverStyle} /></div>
            {first && <span className="lk-sticker is-a">{first.name}</span>}
            {first?.price && <span className="lk-sticker is-b">R$ {first.price}</span>}
          </div>
        </>;
      }
      case 'label': {
        const city = c.address.includes('·') ? c.address.split('·').pop()!.trim() : '';
        return <>
          <div className="lk-photo lk-cellar" style={coverStyle} aria-hidden="true" />
          <div className="lk-cellar-shade" aria-hidden="true" />
          {fxEl}
          <div className="lk-winelabel">
            <span className="lk-wl-top">{nicheInfo?.short ?? 'Adega'}{city ? ` · ${city}` : ''}</span>
            {logo && <img className="lk-wl-logo" src={logo} alt="" />}
            {nameEl('lk-wl-name')}
            <span className="lk-wl-rule" aria-hidden="true"><i /><b>✦</b><i /></span>
            {c.headline ? heroTitle : null}
            <span className="lk-wl-year" aria-hidden="true">{year}</span>
          </div>
          <div className="mini-hero-copy">{heroTagline}{heroCtaEl}</div>
        </>;
      }
      case 'swatches':
        return <>
          {fxEl}
          <div className="lk-fan" aria-hidden="true">{[0, 1, 2, 3, 4].map(i => <i key={i} className={`lk-nail n${i}`} style={i === 2 ? coverStyle : undefined} />)}</div>
          <div className="mini-hero-copy">{brandEl}{heroTitle}{heroTagline}{heroCtaEl}</div>
        </>;
      case 'frosted':
        return <>
          <div className="lk-photo lk-spa" style={coverStyle} aria-hidden="true" />
          {fxEl}
          <div className="lk-glass">{brandEl}{heroTitle}{heroTagline}{heroCtaEl}</div>
        </>;
      case 'breath':
        return <>
          {fxEl}
          <div className="lk-breathe" aria-hidden="true">
            <i className="lk-ring" /><i className="lk-ring r2" /><i className="lk-ring r3" />
            <div className="lk-breathe-photo" style={coverStyle} />
            <span className="lk-breathe-word"><b>inspire</b><b>expire</b></span>
          </div>
          <div className="mini-hero-copy">{brandEl}{heroTitle}{heroTagline}{heroCtaEl}</div>
        </>;
      case 'blob':
        return <>
          {fxEl}
          <div className="lk-blobs" aria-hidden="true"><i className="lk-blob-a" /><i className="lk-blob-b" /><div className="lk-blob-photo" style={coverStyle} /></div>
          <div className="mini-hero-copy">{brandEl}{heroTitle}{heroTagline}{heroCtaEl}</div>
        </>;
      case 'bone':
        return <>
          {fxEl}
          <div className="lk-pet" aria-hidden="true">
            <div className="lk-pet-photo" style={coverStyle}>{!cover && <span>{initial}</span>}</div>
            <i className="lk-pet-tag">{logo ? <img src={logo} alt="" /> : '♥'}</i>
          </div>
          <div className="lk-bonetag">{nameEl('lk-bone-name')}</div>
          <div className="mini-hero-copy">{c.headline ? heroTitle : null}{heroTagline}{heroCtaEl}</div>
        </>;
      case 'gauge': {
        // Conta-giros: meia-volta de 0 a 8 (x1000 rpm), faixa vermelha a partir de 6,5.
        const P = (deg: number, r: number) => `${(100 + r * Math.cos(deg * Math.PI / 180)).toFixed(1)} ${(100 - r * Math.sin(deg * Math.PI / 180)).toFixed(1)}`;
        return <>
          <div className="lk-photo lk-shop" style={coverStyle} aria-hidden="true" />
          <div className="lk-shop-shade" aria-hidden="true" />
          {fxEl}
          <div className="lk-dial" aria-hidden="true">
            <svg viewBox="0 0 200 112">
              <path className="lk-dial-arc" d={`M${P(180, 80)}A80 80 0 0 1 ${P(0, 80)}`} />
              <path className="lk-dial-red" d={`M${P(33.75, 80)}A80 80 0 0 1 ${P(0, 80)}`} />
              {Array.from({ length: 41 }, (_, i) => <path key={i} className={i % 5 ? 'lk-tick' : 'lk-tick is-major'} d={`M${P(180 - i * 4.5, i % 5 ? 73 : 67)}L${P(180 - i * 4.5, 80)}`} />)}
              {Array.from({ length: 9 }, (_, k) => { const [x, y] = P(180 - k * 22.5, 55).split(' '); return <text key={k} x={x} y={y}>{k}</text>; })}
              <text className="lk-dial-unit" x="100" y="82">x1000 rpm</text>
              <g className="lk-needle"><path d="M97.6 100L100 30L102.4 100Z" /><circle cx="100" cy="100" r="7" /></g>
            </svg>
          </div>
          <div className="mini-hero-copy">{brandEl}{heroTitle}{heroTagline}{heroCtaEl}</div>
        </>;
      }
      case 'neon':
        return <>
          {fxEl}
          <div className="lk-neonsign">
            {logo && <img className="lk-neon-logo" src={logo} alt="" />}
            {nameEl('lk-neon-name')}
            {nicheInfo && !plain(name).includes(plain(nicheInfo.short)) && <span className="lk-neon-sub" aria-hidden="true">{nicheInfo.short}</span>}
          </div>
          <div className="lk-shine" style={coverStyle} aria-hidden="true"><i /></div>
          <div className="mini-hero-copy">{c.headline ? heroTitle : null}{heroTagline}{heroCtaEl}</div>
        </>;
      case 'giftbox':
        return <>
          {fxEl}
          <div className="lk-gift" aria-hidden="true">
            <svg className="lk-bow" viewBox="0 0 120 64"><path d="M60 40C44 16 12 2 8 22C5 38 34 44 60 40ZM60 40C76 16 108 2 112 22C115 38 86 44 60 40Z" /><path d="M56 42L40 62L50 60L58 46ZM64 42L80 62L70 60L62 46Z" /><circle cx="60" cy="40" r="8" /></svg>
            <i className="lk-gift-lid" />
            <div className="lk-gift-box" style={coverStyle} />
          </div>
          <div className="mini-hero-copy">{brandEl}{heroTitle}{heroTagline}{heroCtaEl}</div>
        </>;
    }
  };

  const itemCta = (p: { name: string }) => !look ? null : wa
    ? <a className="lk-item-cta" href={whatsapp(c.phone, look.itemMessage.replace('{item}', p.name))} target="_blank" rel="noreferrer" tabIndex={tab}>{look.itemCta} <ArrowUpRight size={15} /></a>
    : demo ? <span className="lk-item-cta" title="Na página real, abre o WhatsApp">{look.itemCta} <ArrowUpRight size={15} /></span> : null;
  const itemImg = (p: { name: string; image: string }, cls: string) => imageUrl(p.image)
    ? <button className={cls} onClick={() => open(p.image)} aria-label={`Ampliar ${p.name}`} tabIndex={tab}><img src={imageUrl(p.image)} alt={p.name} loading="lazy" /></button>
    : <span className={`${cls} is-empty`} aria-hidden="true">{p.name.slice(0, 1)}</span>;
  const itemDesc = (text: string) => { const parts = specParts(text); return parts ? <ul className="lk-specs">{parts.map((x, i) => <li key={i}>{x}</li>)}</ul> : text ? <p>{text}</p> : null; };
  const itemPrice = (price: string) => price ? <strong className="lk-price">R$ {price}</strong> : null;
  const lookList = () => {
    if (!look) return null;
    const list = c.products;
    switch (look.list) {
      case 'lanes':
        return <ol className="lk-lanes">{list.map((p, i) => <li key={p.id} data-reveal style={{ '--i': i % 8 } as Vars}>
          <span className="lk-lane-n" aria-hidden="true">{i + 1}</span>
          <div className="lk-lane-body"><div className="lk-lane-head"><h3>{p.name}</h3>{itemPrice(p.price)}</div>{itemDesc(p.description)}{itemCta(p)}</div>
        </li>)}</ol>;
      case 'lookbook':
        return <div className="lk-look">{list.map((p, i) => <figure key={p.id} data-reveal style={{ '--i': i % 6 } as Vars}>
          {itemImg(p, 'lk-look-img')}
          <figcaption><small>Nº {String(i + 1).padStart(2, '0')}</small><h3>{p.name}</h3>{p.description && <p>{p.description}</p>}{itemPrice(p.price)}{itemCta(p)}</figcaption>
        </figure>)}</div>;
      case 'shelf':
        return <ul className="lk-shelf">{list.map((p, i) => <li key={p.id} data-reveal style={{ '--i': i % 6 } as Vars}>
          {itemImg(p, 'lk-shelf-img')}
          <div className="lk-tag"><h3>{p.name}</h3>{itemPrice(p.price)}</div>
          {p.description && <p>{p.description}</p>}
          {itemCta(p)}
        </li>)}</ul>;
      case 'fichas':
        return <div className="lk-fichas">{list.map((p, i) => <article key={p.id} data-reveal style={{ '--i': i % 6 } as Vars}>
          <div className="lk-ficha-img">{itemImg(p, 'lk-ficha-photo')}{itemPrice(p.price)}</div>
          <div className="lk-ficha-body"><h3>{p.name}</h3>{itemDesc(p.description)}{itemCta(p)}</div>
        </article>)}</div>;
      case 'garage':
        return <div className="mini-swipe is-garage">
          <div className="lk-garage" data-swipe-track>{list.map(p => {
            const parts = specParts(p.description) ?? [];
            const yearTag = parts.find(x => /^(19|20)\d{2}(\/\d{2,4})?$/.test(x));
            return <article key={p.id}>
              <div className="lk-car-img">{itemImg(p, 'lk-car-photo')}{yearTag && <span className="lk-year">{yearTag}</span>}</div>
              <div className="lk-car-body"><h3>{p.name}</h3>{parts.length ? <ul className="lk-specs">{parts.filter(x => x !== yearTag).map((x, i) => <li key={i}>{x}</li>)}</ul> : p.description && <p>{p.description}</p>}{itemPrice(p.price)}{itemCta(p)}</div>
            </article>;
          })}</div>
          {list.length > 1 && swipeArrows('produto')}
        </div>;
      case 'tags':
        return <ul className="lk-tags">{list.map((p, i) => <li key={p.id} data-reveal style={{ '--i': i % 6 } as Vars}>
          <i className="lk-hole" aria-hidden="true" />
          {itemImg(p, 'lk-tag-img')}
          <h3>{p.name}</h3>
          {p.description && <p>{p.description}</p>}
          {itemPrice(p.price)}
          {itemCta(p)}
        </li>)}</ul>;
      case 'display':
        return <ul className="lk-display">{list.map((p, i) => <li key={p.id} data-reveal style={{ '--i': i % 6 } as Vars}>
          <div className="lk-acrylic">{itemImg(p, 'lk-acrylic-img')}</div>
          <small>Modelo {String(i + 1).padStart(2, '0')}</small>
          <h3>{p.name}</h3>
          {itemDesc(p.description)}
          {itemPrice(p.price)}
          {itemCta(p)}
        </li>)}</ul>;
      case 'cards':
        return <ul className="lk-cards">{list.map((p, i) => <li key={p.id} data-reveal style={{ '--i': i % 6 } as Vars}>
          {itemImg(p, 'lk-card-img')}
          <div className="lk-giftcard">
            <i className="lk-string" aria-hidden="true" />
            <span className="lk-for" aria-hidden="true">com carinho</span>
            <h3>{p.name}</h3>
            {p.description && <p>{p.description}</p>}
            {itemPrice(p.price)}
            {itemCta(p)}
          </div>
        </li>)}</ul>;
      case 'quote':
        return <div className="lk-receipt">
          <div className="lk-receipt-head"><b>Orçamento</b><span>{name}</span></div>
          <ul>{list.map((p, i) => <li key={p.id} data-reveal style={{ '--i': i % 8 } as Vars}>
            {imageUrl(p.image) ? itemImg(p, 'lk-q-img') : null}
            <div className="lk-q-body">
              <div className="lk-q-head"><h3>{p.name}</h3>{p.price && <strong className="lk-price">R$ {p.price}</strong>}</div>
              {itemDesc(p.description)}
              {itemCta(p)}
            </div>
          </li>)}</ul>
          <i className="lk-barcode" aria-hidden="true" />
        </div>;
      case 'index':
        return <ol className="lk-index">{list.map((p, i) => <li key={p.id} data-reveal style={{ '--i': i % 8 } as Vars}>
          <span className="lk-roman" aria-hidden="true">{roman(i + 1)}</span>
          <div className="lk-index-body"><h3>{p.name}</h3>{p.description && <p>{p.description}</p>}{itemPrice(p.price)}{itemCta(p)}</div>
          {imageUrl(p.image) ? itemImg(p, 'lk-index-img') : null}
        </li>)}</ol>;
      case 'menu':
        return <ul className="lk-carte">{list.map((p, i) => <li key={p.id} data-reveal style={{ '--i': i % 8 } as Vars}>
          {imageUrl(p.image) ? itemImg(p, 'lk-carte-img') : null}
          <div className="lk-carte-body">
            <div className="lk-carte-head"><h3>{p.name}</h3><i aria-hidden="true" />{p.price && <strong className="lk-price">R$ {p.price}</strong>}</div>
            {p.description && <p>{p.description}</p>}
            {itemCta(p)}
          </div>
        </li>)}</ul>;
      case 'cups':
        return <ul className="lk-cups">{list.map((p, i) => <li key={p.id} data-reveal style={{ '--i': i % 6 } as Vars}>
          <div className="lk-cupcard">{itemImg(p, 'lk-cupcard-img')}{p.price && <span className="lk-cup-price">R$ {p.price}</span>}</div>
          <h3>{p.name}</h3>
          {p.description && <p>{p.description}</p>}
          {itemCta(p)}
        </li>)}</ul>;
      case 'winelist':
        return <ul className="lk-wines">{list.map((p, i) => <li key={p.id} data-reveal style={{ '--i': i % 8 } as Vars}>
          {itemImg(p, 'lk-wine-img')}
          <div className="lk-wine-body">
            <small>Nº {String(i + 1).padStart(2, '0')}</small>
            <h3>{p.name}</h3>
            {itemDesc(p.description)}
            <div className="lk-wine-foot">{itemPrice(p.price)}{itemCta(p)}</div>
          </div>
        </li>)}</ul>;
      case 'bottles':
        return <ul className="lk-polish">{list.map((p, i) => <li key={p.id} data-reveal style={{ '--i': i % 6, '--c': `var(--pc${i % 5})` } as Vars}>
          <div className="lk-polish-photo">{itemImg(p, 'lk-polish-img')}<i className="lk-bottle" aria-hidden="true" /></div>
          <h3>{p.name}</h3>
          {p.description && <p>{p.description}</p>}
          {itemPrice(p.price)}
          {itemCta(p)}
        </li>)}</ul>;
      case 'ritual':
        return <ol className="lk-ritual">{list.map((p, i) => <li key={p.id} data-reveal style={{ '--i': i % 8 } as Vars}>
          <span className="lk-step" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
          <div className="lk-step-body">{imageUrl(p.image) ? itemImg(p, 'lk-step-img') : null}<h3>{p.name}</h3>{itemDesc(p.description)}{itemPrice(p.price)}{itemCta(p)}</div>
        </li>)}</ol>;
      case 'mats':
        return <ul className="lk-mats">{list.map((p, i) => <li key={p.id} data-reveal style={{ '--i': i % 6, '--m': `var(--fx${(i % 3) + 1})` } as Vars}>
          {imageUrl(p.image) ? itemImg(p, 'lk-mat-img') : null}
          <div className="lk-mat-body"><h3>{p.name}</h3>{itemDesc(p.description)}<div className="lk-mat-foot">{itemPrice(p.price)}{itemCta(p)}</div></div>
          <i className="lk-roll" aria-hidden="true" />
        </li>)}</ul>;
      case 'planner':
        return <div className="lk-planner">
          <i className="lk-spiral" aria-hidden="true" />
          <ul>{list.map((p, i) => <li key={p.id} data-reveal style={{ '--i': i % 8 } as Vars}>
            <i className="lk-check" aria-hidden="true" />
            <div className="lk-plan-body"><h3>{p.name}</h3>{p.description && <p>{p.description}</p>}<div className="lk-plan-foot">{p.price && <span className="lk-note">R$ {p.price}</span>}{itemCta(p)}</div></div>
            {imageUrl(p.image) ? itemImg(p, 'lk-plan-img') : null}
          </li>)}</ul>
        </div>;
      case 'vaccine':
        return <div className="lk-vcard">
          <div className="lk-vcard-head"><span>Carteirinha</span><b>{name}</b></div>
          <ul>{list.map((p, i) => <li key={p.id} data-reveal style={{ '--i': i % 8 } as Vars}>
            {imageUrl(p.image) ? itemImg(p, 'lk-v-img') : null}
            <div className="lk-v-body"><h3>{p.name}</h3>{p.description && <p>{p.description}</p>}{itemCta(p)}</div>
            {p.price ? <span className="lk-stamp-price"><small>R$</small>{p.price}</span> : <span className="lk-stamp-price is-ask">consulte</span>}
          </li>)}</ul>
        </div>;
      case 'checklist':
        return <div className="lk-os">
          <div className="lk-os-head"><b>Ordem de serviço</b><span>{name}</span></div>
          <ul>{list.map((p, i) => <li key={p.id} data-reveal style={{ '--i': i % 8 } as Vars}>
            <i className="lk-tickbox" aria-hidden="true" />
            <div className="lk-os-body"><div className="lk-os-row"><h3>{p.name}</h3>{p.price && <strong className="lk-price">R$ {p.price}</strong>}</div>{itemDesc(p.description)}{itemCta(p)}</div>
            {imageUrl(p.image) ? itemImg(p, 'lk-os-img') : null}
          </li>)}</ul>
        </div>;
      case 'tiers':
        return <div className="lk-tiers">{list.map((p, i) => <article key={p.id} data-reveal style={{ '--i': i % 6 } as Vars}>
          {imageUrl(p.image) ? itemImg(p, 'lk-tier-img') : null}
          <div className="lk-tier-body"><span className="lk-tier-n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span><h3>{p.name}</h3>{itemDesc(p.description)}<div className="lk-tier-foot">{itemPrice(p.price)}{itemCta(p)}</div></div>
        </article>)}</div>;
      case 'bags':
        return <ul className="lk-bags">{list.map((p, i) => <li key={p.id} data-reveal style={{ '--i': i % 6 } as Vars}>
          <div className="lk-bag"><i className="lk-handle" aria-hidden="true" />{itemImg(p, 'lk-bag-img')}</div>
          <h3>{p.name}</h3>
          {p.description && <p>{p.description}</p>}
          {itemPrice(p.price)}
          {itemCta(p)}
        </li>)}</ul>;
    }
  };

  const classes = ['mini-landing', `theme-${c.theme}`, look ? `has-look lk-${look.hero}` : '', classic ? '' : 'is-niche', thumb ? 'is-thumb' : '', cover ? 'has-cover' : 'no-cover', c.headline ? 'has-headline' : '', c.theme === 'refugio' && c.palette === 'p4' ? 'is-night' : '', floating && wa ? 'has-float' : '', fx && !thumb ? 'has-nichefx' : ''].filter(Boolean).join(' ');

  return <><article ref={root} className={classes} style={vars}>
    {demo && !thumb && <div className="mini-demo-label">{demoLabel || 'Empresa fictícia · Prévia de demonstração'}</div>}
    <header className="mini-hero" data-hero>
      {look ? lookHero() : <>
      <div className="mini-scene" aria-hidden="true">
        {shader && !thumb && <MiniShader key={shader} kind={shader} colors={shaderColors(vars as any)} />}
        {classic && <><i className="mini-orb o1" /><i className="mini-orb o2" /><i className="mini-orb o3" /><i className="mini-ring" /></>}
        <SceneDecor theme={c.theme} />
      </div>
      {c.theme === 'refugio' ? <Landscape>{card}</Landscape> : card}
      {fx && <NicheFx key={fx} kind={fx} colors={fxColors(vars as Record<string, string>)} thumb={thumb} />}
      {c.theme === 'navalha' && <BarberPole />}
      <div className="mini-hero-copy">
        {c.headline ? <div className="mini-brand">{logoEl}<span className="mini-brand-name">{name}</span></div> : logoEl}
        <SplitTitle text={c.headline || name} />
        {(c.tagline || !c.headline) && <p>{c.tagline || 'Seu negócio merece ser visto.'}</p>}
        <div className="mini-cta-wrap" ref={heroCta}>{ctaButton()}</div>
      </div>
      {c.theme === 'impulso' && <div className="mini-bands" aria-hidden="true"><Marquee items={tickerItems} /><Marquee items={[name, c.tagline || c.headline || '']} reverse /></div>}
      </>}
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

      {c.products.length > 0 && look && <section className={`mini-sec lk-list lk-list-${look.list}`} ref={listRef}>
        <div className="mini-section-heading" data-reveal><h2>{listTitleFor(c)}</h2>{look.list === 'garage' && c.products.length > 1 && <span>Deslize para ver todos</span>}</div>
        {lookList()}
      </section>}

      {c.products.length > 0 && !look && (withPhotos ? <section className="mini-sec">
        <div className="mini-section-heading" data-reveal><h2>{listTitleFor(c)}</h2>{c.products.length > 1 && <span>Deslize para ver todos</span>}</div>
        <div className="mini-swipe is-cover">
        <div className={`mini-coverflow${c.products.length === 1 ? ' is-single' : ''}`} data-coverflow data-swipe-track>
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
        {c.products.length > 1 && swipeArrows('produto')}
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

      {stats.length > 0 && !look?.heroStats && <section className="mini-sec" aria-label="Números">
        <div className={`mini-stats n${stats.length}`}>{stats.map((x, i) => <div className="mini-stat" key={x.id} data-reveal style={{ '--i': i } as Vars}><CountUp value={x.value} still={thumb} />{x.label && <span>{x.label}</span>}</div>)}</div>
      </section>}

      {quotes.length > 0 && <section className="mini-sec">
        <h2 data-reveal>O que dizem nossos clientes</h2>
        {demo && <p className="mini-note">Depoimentos de exemplo</p>}
        <div className="mini-swipe is-quotes">
        <div className={`mini-quotes${quotes.length === 1 ? ' is-single' : ''}`} data-swipe-track>
          {quotes.map((x, i) => <figure className="mini-quote" key={x.id} data-reveal style={{ '--i': i } as Vars}>
            <div className="mini-stars" aria-label={`${x.stars || 5} de 5 estrelas`}>{Array.from({ length: Math.max(1, Math.min(5, x.stars || 5)) }, (_, k) => <Star key={k} size={16} fill="currentColor" />)}</div>
            <blockquote>{x.text}</blockquote>
            {x.name && <figcaption><b aria-hidden="true">{x.name.slice(0, 1)}</b><span>{x.name}{x.source === 'google' && <small className="mini-via">via Google</small>}</span></figcaption>}
          </figure>)}
        </div>
        {quotes.length > 1 && swipeArrows('depoimento')}
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
function SplitTitle({ text, className }: { text: string; className?: string }) {
  let index = 0;
  const words = text.trim().split(/\s+/);
  const longest = Math.max(4, ...words.map(w => Array.from(w).length));
  const long = Array.from(text).length > 24;
  return <h1 aria-label={text} className={[long ? 'is-long' : '', className ?? ''].filter(Boolean).join(' ') || undefined} style={{ '--lw': longest, '--tl': Math.max(8, Array.from(text).length) } as Vars}>{words.map((word, w) => <Fragment key={w}>{w > 0 && ' '}<span className="mini-w" aria-hidden="true">{long
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

// Sem acento, minúsculo e só letras: compara "Lava-car" com "Brilho Lavacar".
const plain = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

// I, II, III... para o sumário de áreas de atuação.
function roman(n: number) {
  const map: [string, number][] = [['M', 1000], ['CM', 900], ['D', 500], ['CD', 400], ['C', 100], ['XC', 90], ['L', 50], ['XL', 40], ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]];
  let out = '';
  for (const [r, v] of map) while (n >= v) { out += r; n -= v; }
  return out;
}

// Calda escorrendo do topo da capa (açaí): faixa com gotas de tamanhos diferentes.
const DRIP = (() => {
  const band = 34;
  const drops: [number, number][] = [[372, 30], [318, 58], [262, 24], [214, 46], [156, 22], [104, 62], [52, 28]];
  let d = `M0 0H400V${band}`;
  for (const [x, len] of drops) {
    const y = band + len;
    d += `L${x + 10} ${band}C${x + 6} ${band} ${x + 6.5} ${y - 10} ${x + 6.5} ${y - 5}A6.5 6.5 0 0 1 ${x - 6.5} ${y - 5}C${x - 6.5} ${y - 10} ${x - 6} ${band} ${x - 10} ${band}`;
  }
  return d + `L0 ${band}Z`;
})();

// Raminho desenhado à mão (floricultura): caule, folhas e três flores.
function Sprig({ className }: { className: string }) {
  // O <g> de fora posiciona; o de dentro anima (transform do CSS sobrescreveria o atributo).
  const bloom = (x: number, y: number, s: number, d: number) => <g transform={`translate(${x} ${y}) scale(${s})`}><g className="lk-bloom" style={{ '--d': d } as Vars}>
    {[0, 72, 144, 216, 288].map(a => <ellipse key={a} cx="0" cy="-8" rx="5.2" ry="8" transform={`rotate(${a})`} />)}
    <circle r="3.6" />
  </g></g>;
  return <svg className={className} viewBox="0 0 120 240" aria-hidden="true">
    <path className="lk-stem" pathLength={1} d="M64 238C60 196 50 160 58 122C64 92 76 70 70 40C67 26 62 16 56 10" />
    <path className="lk-stem" pathLength={1} d="M57 150C44 136 34 118 30 98" />
    <path className="lk-stem" pathLength={1} d="M66 96C78 86 90 72 94 54" />
    <path className="lk-leaf" d="M60 204C42 200 30 188 26 172C44 174 56 186 60 204Z" />
    <path className="lk-leaf" d="M61 180C79 174 91 160 93 144C75 148 63 162 61 180Z" />
    <path className="lk-leaf" d="M44 132C30 130 20 120 18 108C32 110 42 120 44 132Z" />
    <path className="lk-leaf" d="M72 86C86 82 96 72 100 60C86 62 76 72 72 86Z" />
    {bloom(56, 12, 1, 0)}{bloom(30, 96, 0.8, 1)}{bloom(94, 52, 0.72, 2)}
  </svg>;
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
