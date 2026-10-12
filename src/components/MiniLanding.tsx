import { CSSProperties, Fragment, ReactNode, useRef, useState } from 'react';
import { MapPin, MessageCircle, Clock, Instagram, Star, ArrowUpRight, X, Globe, Facebook } from 'lucide-react';
import { MiniContent, MiniTheme, safeUrl, imageUrl, whatsapp } from '../lib/miniPage';
import { useMiniMotion } from '../lib/miniMotion';
import MiniShader, { ShaderKind } from './MiniShader';

type Vars = CSSProperties & Record<`--${string}`, string | number>;

const CLASSIC: MiniTheme[] = ['elegance', 'viva', 'essencial'];
const SHADERS: Partial<Record<MiniTheme, ShaderKind>> = { brasa: 'brasa', aura: 'aura', navalha: 'navalha', vital: 'vital', impulso: 'impulso' };
const LIST_TITLE: Partial<Record<MiniTheme, string>> = { brasa: 'Cardápio', aura: 'Serviços', navalha: 'Serviços', vital: 'Especialidades', impulso: 'Planos e aulas', refugio: 'Hospedagem e lazer' };

// thumb: versão em miniatura usada nos cartões dos modelos (sem interação, sem WebGL, sem rolagem própria).
export default function MiniLanding({ content: c, demo = false, thumb = false }: { content: MiniContent; demo?: boolean; thumb?: boolean }) {
  const [photo, setPhoto] = useState('');
  const root = useRef<HTMLElement>(null);
  useMiniMotion(root, !thumb, `${c.theme}|${c.products.length}|${c.gallery.length}|${c.description ? 1 : 0}|${c.address || c.hours ? 1 : 0}|${c.cover ? 1 : 0}`);
  const wa = whatsapp(c.phone);
  const maps = safeUrl(c.maps) || (c.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address)}` : '');
  const instagram = c.instagram.startsWith('@') ? `https://www.instagram.com/${encodeURIComponent(c.instagram.slice(1))}/` : safeUrl(c.instagram);
  const cover = imageUrl(c.cover);
  const logo = imageUrl(c.logo);
  const name = c.name || 'Sua empresa';
  const initial = name.slice(0, 1);
  const gallery = c.gallery.filter(url => imageUrl(url));
  const withPhotos = c.products.some(p => imageUrl(p.image));
  const classic = CLASSIC.includes(c.theme);
  const shader = SHADERS[c.theme];
  const ticker = c.products.map(p => p.name).filter(Boolean);
  const tickerItems = ticker.length ? ticker : [c.tagline || name];
  const open = (url: string) => { if (!thumb) setPhoto(url); };
  const card = (cover || classic) && <div className="mini-card3d">
    <div className="mini-card3d-float">
      <div className="mini-card3d-face" style={cover ? { backgroundImage: `url("${cover}")` } : undefined}>
        {!cover && <span className="mini-card3d-initial" aria-hidden="true">{initial}</span>}
        <i className="mini-sheen" aria-hidden="true" />
      </div>
    </div>
  </div>;
  return <><article ref={root} className={`mini-landing theme-${c.theme}${classic ? '' : ' is-niche'}${thumb ? ' is-thumb' : ''}${cover ? ' has-cover' : ' no-cover'}`}>
    {demo && !thumb && <div className="mini-demo-label">Empresa fictícia · Prévia de demonstração</div>}
    <header className="mini-hero" data-hero>
      <div className="mini-scene" aria-hidden="true">
        {shader && !thumb && <MiniShader key={shader} kind={shader} />}
        {classic && <><i className="mini-orb o1" /><i className="mini-orb o2" /><i className="mini-orb o3" /><i className="mini-ring" /></>}
        <SceneDecor theme={c.theme} />
      </div>
      {c.theme === 'refugio' ? <Landscape>{card}</Landscape> : card}
      {c.theme === 'navalha' && <BarberPole />}
      <div className="mini-hero-copy">
        <div className="mini-logo">{c.theme === 'vital' && <><i className="mini-pulse" aria-hidden="true" /><i className="mini-pulse p2" aria-hidden="true" /></>}{logo ? <img src={logo} alt={`Logo ${name}`} /> : <span aria-hidden="true">{initial}</span>}</div>
        <SplitTitle text={name} />
        <p>{c.tagline || 'Seu negócio merece ser visto.'}</p>
      </div>
      {c.theme === 'impulso' && <div className="mini-bands" aria-hidden="true"><Marquee items={tickerItems} /><Marquee items={[name, c.tagline || '']} reverse /></div>}
    </header>
    {(c.theme === 'brasa' || c.theme === 'navalha') && <div className="mini-ticker" aria-hidden="true"><Marquee items={tickerItems} /></div>}
    <div className="mini-body">
      {(wa || demo || maps) && <div className="mini-actions" data-reveal>
        {wa ? <a className="mini-wa" href={wa} target="_blank" rel="noreferrer"><MessageCircle size={19} /><span>Conversar no WhatsApp</span><ArrowUpRight size={17} /></a>
          : demo ? <div className="mini-wa is-placeholder"><MessageCircle size={19} /><span>Seu WhatsApp aparece aqui</span></div> : null}
        {maps && <a className="mini-location" href={maps} target="_blank" rel="noreferrer"><MapPin size={16} /> Como chegar</a>}
      </div>}
      {c.description && <section className="mini-about" data-reveal><h2>Quem somos</h2><p>{c.description}</p></section>}
      {c.products.length > 0 && (withPhotos ? <section className="mini-products-section">
        <div className="mini-section-heading" data-reveal><h2>{LIST_TITLE[c.theme] ?? 'Nossos destaques'}</h2>{c.products.length > 1 && <span>Deslize para ver todos</span>}</div>
        <div className={`mini-coverflow${c.products.length === 1 ? ' is-single' : ''}`} data-coverflow>
          {c.products.map((p, i) => <div className="mini-product" key={p.id} style={{ '--off': i, '--abs': Math.min(i, 2), zIndex: 10 - Math.min(i, 2) * 3 } as Vars}>
            {imageUrl(p.image) && <button className="mini-photo-button" onClick={() => open(p.image)} aria-label={`Ampliar ${p.name}`} tabIndex={thumb ? -1 : undefined}><img src={imageUrl(p.image)} alt={p.name} loading="lazy" /></button>}
            <div className="mini-product-text">
              <h3>{p.name}</h3>
              {p.description && <p>{p.description}</p>}
              {p.price && <strong>R$ {p.price}</strong>}
              {wa && <a href={whatsapp(c.phone, `Olá! Gostaria de saber mais sobre ${p.name}.`)} target="_blank" rel="noreferrer">Tenho interesse <ArrowUpRight size={14} /></a>}
            </div>
          </div>)}
        </div>
      </section> : <section className="mini-menu-section">
        <div className="mini-section-heading" data-reveal><h2>{LIST_TITLE[c.theme] ?? 'Nossos destaques'}</h2></div>
        <ul className="mini-menu">
          {c.products.map((p, i) => <li key={p.id} data-reveal style={{ '--i': i % 8 } as Vars}>
            <div className="mini-menu-head"><h3>{p.name}</h3><i aria-hidden="true" />{p.price && <strong>R$ {p.price}</strong>}</div>
            {p.description && <p>{p.description}</p>}
            {wa && <a href={whatsapp(c.phone, `Olá! Gostaria de saber mais sobre ${p.name}.`)} target="_blank" rel="noreferrer">Tenho interesse <ArrowUpRight size={14} /></a>}
          </li>)}
        </ul>
      </section>)}
      {gallery.length > 0 && <section className="mini-gallery-section">
        <div className="mini-section-heading" data-reveal><h2>Um pouco do nosso mundo</h2></div>
        <div className="mini-gallery">{gallery.map((url, i) => <button key={i} data-reveal style={{ '--i': i % 6 } as Vars} onClick={() => open(url)} aria-label={`Ampliar foto ${i + 1}`} tabIndex={thumb ? -1 : undefined}><img src={imageUrl(url)} alt={`${name}, foto ${i + 1}`} loading="lazy" /></button>)}</div>
      </section>}
      {(c.address || c.hours) && <section className="mini-info" data-reveal><h2>Venha nos visitar</h2>{c.address && <p><MapPin size={17} />{c.address}</p>}{c.hours && <p><Clock size={17} />{c.hours}</p>}</section>}
      {safeUrl(c.review) && <a className="mini-review" data-reveal href={safeUrl(c.review)} target="_blank" rel="noreferrer"><Star size={19} /> Avaliar no Google <ArrowUpRight size={16} /></a>}
      {(instagram || safeUrl(c.facebook) || safeUrl(c.website)) && <div className="mini-socials">{instagram && <a href={instagram} target="_blank" rel="noreferrer"><Instagram size={18} />Instagram</a>}{safeUrl(c.facebook) && <a href={safeUrl(c.facebook)} target="_blank" rel="noreferrer"><Facebook size={18} />Facebook</a>}{safeUrl(c.website) && <a href={safeUrl(c.website)} target="_blank" rel="noreferrer"><Globe size={18} />Site</a>}</div>}
      <footer className="mini-footer">{name} · Feito para conectar</footer>
    </div>
  </article>
    {/* Fora do <article>: o container do mini site prenderia o position:fixed. */}
    {photo && <div className="mini-lightbox" role="dialog" aria-modal="true" aria-label="Foto ampliada" onClick={() => setPhoto('')}><button autoFocus onClick={() => setPhoto('')} aria-label="Fechar foto" onKeyDown={e => { if (e.key === 'Escape') setPhoto(''); }}><X /></button><img src={imageUrl(photo)} alt="Foto ampliada" /></div>}
  </>;
}

// Título com cada letra num <span>, para as entradas animadas. O leitor de tela lê o nome inteiro.
function SplitTitle({ text }: { text: string }) {
  let index = 0;
  const longest = Math.max(4, ...text.split(' ').map(w => Array.from(w).length));
  return <h1 aria-label={text} style={{ '--lw': longest } as Vars}>{text.split(' ').map((word, w) => <Fragment key={w}>{w > 0 && ' '}<span className="mini-w" aria-hidden="true">{Array.from(word).map(ch => <span className="mini-ch" key={index} style={{ '--ci': index++ } as Vars}>{ch}</span>)}</span></Fragment>)}</h1>;
}

function Marquee({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  const list = items.filter(Boolean);
  const run = <span className="mini-marquee-run">{list.map((t, i) => <Fragment key={i}><span>{t}</span><b>✦</b></Fragment>)}</span>;
  return <div className={`mini-marquee${reverse ? ' is-reverse' : ''}`}><div className="mini-marquee-track">{run}{run}{run}{run}</div></div>;
}

function SceneDecor({ theme }: { theme: MiniTheme }) {
  if (theme === 'aura') return <><i className="mini-glass-orb" /><i className="mini-spark s1" /><i className="mini-spark s2" /><i className="mini-spark s3" /><i className="mini-spark s4" /></>;
  if (theme === 'vital') return <>
    <svg className="mini-ecg" viewBox="0 0 400 100" preserveAspectRatio="none"><path className="ecg-base" d="M0 60 H46 L58 60 L66 38 L74 76 L86 8 L98 92 L108 52 L118 60 H286 L296 60 L302 48 L310 70 L318 60 H400" /><path className="ecg-run" pathLength={100} d="M0 60 H46 L58 60 L66 38 L74 76 L86 8 L98 92 L108 52 L118 60 H286 L296 60 L302 48 L310 70 L318 60 H400" /></svg>
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
