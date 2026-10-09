import { useState } from 'react';
import { MapPin, MessageCircle, Clock, Instagram, Star, ArrowUpRight, X, Globe, Facebook } from 'lucide-react';
import { MiniContent, safeUrl, imageUrl, whatsapp } from '../lib/miniPage';

export default function MiniLanding({ content: c, demo = false }: { content: MiniContent; demo?: boolean }) {
  const [photo, setPhoto] = useState('');
  const wa = whatsapp(c.phone);
  const maps = safeUrl(c.maps) || (c.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address)}` : '');
  const instagram = c.instagram.startsWith('@') ? `https://www.instagram.com/${encodeURIComponent(c.instagram.slice(1))}/` : safeUrl(c.instagram);
  return <article className={`mini-landing theme-${c.theme}`}>
    {demo && <div className="mini-demo-label">Empresa fictícia · Prévia de demonstração</div>}
    <div className="mini-hero" style={imageUrl(c.cover) ? { backgroundImage: `url("${imageUrl(c.cover)}")` } : undefined}>
      <div className="mini-hero-top"><div className="mini-logo">{imageUrl(c.logo) ? <img src={imageUrl(c.logo)} alt={`Logo ${c.name}`} /> : <span>{(c.name || 'S').slice(0, 1)}</span>}</div><span className="mini-eyebrow">CONHEÇA NOSSO ESPAÇO</span></div>
      <div className="mini-hero-title"><h1>{c.name || 'Sua empresa'}</h1><p>{c.tagline || 'Seu negócio merece ser visto.'}</p></div>
    </div>
    <div className="mini-body">
      {wa ? <a className="mini-wa" href={wa} target="_blank" rel="noreferrer"><MessageCircle size={19} /> Conversar no WhatsApp <ArrowUpRight size={17} /></a> : demo ? <div className="mini-wa"><MessageCircle size={19} /> Seu WhatsApp aparece aqui</div> : null}
      {maps && <a className="mini-location" href={maps} target="_blank" rel="noreferrer"><MapPin size={16} /> Como chegar</a>}
      {c.description && <section className="mini-about"><span className="mini-eyebrow">FEITO PARA VOCÊ</span><h2>Bem-vindo{c.name ? ` à ${c.name}` : ''}</h2><p>{c.description}</p></section>}
      {c.products.length > 0 && <section><div className="mini-section-heading"><h2>Nossos destaques</h2><span>Conheça e encante-se</span></div><div className="mini-products">{c.products.map(p => <div className="mini-product" key={p.id}>{imageUrl(p.image) && <button className="mini-photo-button" onClick={() => setPhoto(p.image)} aria-label={`Ampliar ${p.name}`}><img src={imageUrl(p.image)} alt={p.name} loading="lazy" /></button>}<div><h3>{p.name}</h3>{p.description && <p>{p.description}</p>}{p.price && <strong>R$ {p.price}</strong>}{wa && <a href={whatsapp(c.phone, `Olá! Gostaria de saber mais sobre ${p.name}.`)} target="_blank" rel="noreferrer">Tenho interesse <ArrowUpRight size={14} /></a>}</div></div>)}</div></section>}
      {c.gallery.length > 0 && <section><div className="mini-section-heading"><h2>Um pouco do nosso mundo</h2></div><div className="mini-gallery">{c.gallery.map((url, i) => imageUrl(url) && <button key={i} onClick={() => setPhoto(url)} aria-label={`Ampliar foto ${i + 1}`}><img src={imageUrl(url)} alt={`${c.name}, foto ${i + 1}`} loading="lazy" /></button>)}</div></section>}
      {(c.address || c.hours) && <section className="mini-info"><h2>Venha nos visitar</h2>{c.address && <p><MapPin size={17} />{c.address}</p>}{c.hours && <p><Clock size={17} />{c.hours}</p>}</section>}
      {safeUrl(c.review) && <a className="mini-review" href={safeUrl(c.review)} target="_blank" rel="noreferrer"><Star size={19} /> Avaliar no Google <ArrowUpRight size={16} /></a>}
      <div className="mini-socials">{instagram && <a href={instagram} target="_blank" rel="noreferrer"><Instagram size={18} />Instagram</a>}{safeUrl(c.facebook) && <a href={safeUrl(c.facebook)} target="_blank" rel="noreferrer"><Facebook size={18} />Facebook</a>}{safeUrl(c.website) && <a href={safeUrl(c.website)} target="_blank" rel="noreferrer"><Globe size={18} />Site</a>}</div>
      <footer className="mini-footer">{c.name || 'Sua empresa'} · Feito para conectar</footer>
    </div>
    {photo && <div className="mini-lightbox" role="dialog" aria-modal="true" aria-label="Foto ampliada" onClick={() => setPhoto('')}><button autoFocus onClick={() => setPhoto('')} aria-label="Fechar foto" onKeyDown={e => { if (e.key === 'Escape') setPhoto(''); }}><X /></button><img src={imageUrl(photo)} alt="Foto ampliada" /></div>}
  </article>;
}
