import { CSSProperties, useRef, useState } from 'react';
import { MapPin, MessageCircle, Clock, Instagram, Star, ArrowUpRight, X, Globe, Facebook } from 'lucide-react';
import { MiniContent, safeUrl, imageUrl, whatsapp } from '../lib/miniPage';
import { useMiniMotion } from '../lib/miniMotion';

type Vars = CSSProperties & Record<`--${string}`, string | number>;

// thumb: versão em miniatura usada nos cartões dos modelos (sem interação, sem rolagem própria).
export default function MiniLanding({ content: c, demo = false, thumb = false }: { content: MiniContent; demo?: boolean; thumb?: boolean }) {
  const [photo, setPhoto] = useState('');
  const root = useRef<HTMLElement>(null);
  useMiniMotion(root, !thumb, `${c.theme}|${c.products.length}|${c.gallery.length}|${c.description ? 1 : 0}|${c.address || c.hours ? 1 : 0}`);
  const wa = whatsapp(c.phone);
  const maps = safeUrl(c.maps) || (c.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address)}` : '');
  const instagram = c.instagram.startsWith('@') ? `https://www.instagram.com/${encodeURIComponent(c.instagram.slice(1))}/` : safeUrl(c.instagram);
  const cover = imageUrl(c.cover);
  const logo = imageUrl(c.logo);
  const initial = (c.name || 'S').slice(0, 1);
  const gallery = c.gallery.filter(url => imageUrl(url));
  const open = (url: string) => { if (!thumb) setPhoto(url); };
  return <><article ref={root} className={`mini-landing theme-${c.theme}${thumb ? ' is-thumb' : ''}`}>
    {demo && !thumb && <div className="mini-demo-label">Empresa fictícia · Prévia de demonstração</div>}
    <header className="mini-hero" data-hero>
      <div className="mini-scene" aria-hidden="true"><i className="mini-orb o1" /><i className="mini-orb o2" /><i className="mini-orb o3" /><i className="mini-ring" /></div>
      <div className="mini-card3d">
        <div className="mini-card3d-float">
          <div className="mini-card3d-face" style={cover ? { backgroundImage: `url("${cover}")` } : undefined}>
            {!cover && <span className="mini-card3d-initial" aria-hidden="true">{initial}</span>}
            <i className="mini-sheen" aria-hidden="true" />
          </div>
        </div>
      </div>
      <div className="mini-hero-copy">
        <div className="mini-logo">{logo ? <img src={logo} alt={`Logo ${c.name}`} /> : <span aria-hidden="true">{initial}</span>}</div>
        <h1>{c.name || 'Sua empresa'}</h1>
        <p>{c.tagline || 'Seu negócio merece ser visto.'}</p>
      </div>
    </header>
    <div className="mini-body">
      {(wa || demo || maps) && <div className="mini-actions" data-reveal>
        {wa ? <a className="mini-wa" href={wa} target="_blank" rel="noreferrer"><MessageCircle size={19} /><span>Conversar no WhatsApp</span><ArrowUpRight size={17} /></a>
          : demo ? <div className="mini-wa is-placeholder"><MessageCircle size={19} /><span>Seu WhatsApp aparece aqui</span></div> : null}
        {maps && <a className="mini-location" href={maps} target="_blank" rel="noreferrer"><MapPin size={16} /> Como chegar</a>}
      </div>}
      {c.description && <section className="mini-about" data-reveal><h2>Quem somos</h2><p>{c.description}</p></section>}
      {c.products.length > 0 && <section className="mini-products-section">
        <div className="mini-section-heading" data-reveal><h2>Nossos destaques</h2>{c.products.length > 1 && <span>Deslize para ver todos</span>}</div>
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
      </section>}
      {gallery.length > 0 && <section className="mini-gallery-section">
        <div className="mini-section-heading" data-reveal><h2>Um pouco do nosso mundo</h2></div>
        <div className="mini-gallery">{gallery.map((url, i) => <button key={i} data-reveal style={{ '--i': i % 6 } as Vars} onClick={() => open(url)} aria-label={`Ampliar foto ${i + 1}`} tabIndex={thumb ? -1 : undefined}><img src={imageUrl(url)} alt={`${c.name}, foto ${i + 1}`} loading="lazy" /></button>)}</div>
      </section>}
      {(c.address || c.hours) && <section className="mini-info" data-reveal><h2>Venha nos visitar</h2>{c.address && <p><MapPin size={17} />{c.address}</p>}{c.hours && <p><Clock size={17} />{c.hours}</p>}</section>}
      {safeUrl(c.review) && <a className="mini-review" data-reveal href={safeUrl(c.review)} target="_blank" rel="noreferrer"><Star size={19} /> Avaliar no Google <ArrowUpRight size={16} /></a>}
      {(instagram || safeUrl(c.facebook) || safeUrl(c.website)) && <div className="mini-socials">{instagram && <a href={instagram} target="_blank" rel="noreferrer"><Instagram size={18} />Instagram</a>}{safeUrl(c.facebook) && <a href={safeUrl(c.facebook)} target="_blank" rel="noreferrer"><Facebook size={18} />Facebook</a>}{safeUrl(c.website) && <a href={safeUrl(c.website)} target="_blank" rel="noreferrer"><Globe size={18} />Site</a>}</div>}
      <footer className="mini-footer">{c.name || 'Sua empresa'} · Feito para conectar</footer>
    </div>
  </article>
    {/* Fora do <article>: o container do mini site prenderia o position:fixed. */}
    {photo && <div className="mini-lightbox" role="dialog" aria-modal="true" aria-label="Foto ampliada" onClick={() => setPhoto('')}><button autoFocus onClick={() => setPhoto('')} aria-label="Fechar foto" onKeyDown={e => { if (e.key === 'Escape') setPhoto(''); }}><X /></button><img src={imageUrl(photo)} alt="Foto ampliada" /></div>}
  </>;
}
