import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Image as ImageIcon, MessageCircle, Rocket, Timer } from 'lucide-react';
import { NicheId, nicheById } from '../lib/miniNicheCore';
import { nicheDemo } from '../lib/miniNicheDemos';
import { imageUrl } from '../lib/miniPage';
import { paletteVars } from '../lib/miniPalettes';
import { THEME_FONTS } from '../lib/miniFonts';

// Demonstração da página de vendas: um celular que monta um mini site sozinho, em loop.
// Digita o nome, escolhe o modelo, coloca fotos e WhatsApp, toca em Publicar e mostra o site no ar,
// com um cronômetro chegando perto de 5 minutos. É só desenho: nada é salvo nem enviado.
// Com "reduzir movimento" no aparelho, fica parado na tela final.

export const DEMO_STEPS = ['Digite o nome', 'Escolha o modelo', 'Coloque fotos e WhatsApp', 'Toque em Publicar', 'Pronto, está no ar!'];

const DEMOS: NicheId[] = ['pizzaria', 'unhas', 'floricultura'];
const LOOP = 12600;
// Início de cada etapa (ms) dentro do loop.
const AT = { modelo: 2700, fotos: 4700, publicar: 7600, toque: 8300, pronto: 9200 };
const PHONE = '(41) 9 9999-0000';

const reduce = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const slugOf = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 22) || 'suaempresa';
const familyOf = (spec: string) => `'${spec.split(':')[0].replace(/\+/g, ' ')}'`;

export function stepOf(t: number) {
  if (t < AT.modelo) return 0;
  if (t < AT.fotos) return 1;
  if (t < AT.publicar) return 2;
  if (t < AT.pronto) return 3;
  return 4;
}

export default function BuildDemo({ name = '', big = false, onStep }: { name?: string; big?: boolean; onStep?: (step: number) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const still = useMemo(reduce, []);
  // Tempo corrido desde o início; cada volta do loop troca o ramo do exemplo.
  const [total, setTotal] = useState(still ? LOOP - 1 : 0);
  const t = total % LOOP, round = Math.floor(total / LOOP);
  const stepCb = useRef(onStep); stepCb.current = onStep;

  // Relógio do loop: só anda com a demonstração visível na tela.
  useEffect(() => {
    if (still) return;
    const el = box.current;
    let visible = true, timer: ReturnType<typeof setInterval> | undefined, last = 0;
    const tick = () => {
      const now = performance.now(); const dt = Math.min(200, now - last); last = now;
      setTotal(prev => prev + dt);
    };
    const run = () => { if (!timer && visible && !document.hidden) { last = performance.now(); timer = setInterval(tick, 70); } };
    const stop = () => { clearInterval(timer); timer = undefined; };
    const io = el && 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) run(); else stop(); }) : null;
    if (el) io?.observe(el);
    const onVis = () => (document.hidden ? stop() : run());
    document.addEventListener('visibilitychange', onVis);
    run();
    return () => { stop(); io?.disconnect(); document.removeEventListener('visibilitychange', onVis); };
  }, [still]);

  const step = stepOf(t);
  useEffect(() => { stepCb.current?.(step); }, [step]);

  const id = DEMOS[round % DEMOS.length];
  const n = nicheById(id)!;
  const demo = useMemo(() => nicheDemo(id, 'thumb'), [id]);
  const title = name.trim() || demo.name;
  const vars = { ...paletteVars(n.theme, n.palette), '--demo-font': `${familyOf(THEME_FONTS[n.theme][0])},system-ui,sans-serif` } as CSSProperties;
  const photos = demo.products.map(p => imageUrl(p.image)).filter(Boolean).slice(0, 3);
  if (photos.length < 3 && imageUrl(demo.cover)) photos.unshift(imageUrl(demo.cover));
  const models = [DEMOS[(round + 1) % 3], id, DEMOS[(round + 2) % 3]].map(m => nicheById(m)!);

  // Texto digitado aos poucos.
  const typed = title.slice(0, Math.max(0, Math.floor((t - 450) / 80)));
  const phoneTyped = PHONE.slice(0, Math.max(0, Math.floor((t - (AT.fotos + 1500)) / 60)));
  // Cronômetro: chega a 4:52 quando publica (cada segundo da animação vale ~38 s).
  const secs = Math.round(Math.min(t, AT.pronto) / AT.pronto * 292);
  const clock = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  const shown = (from: number) => t >= from;

  return <div ref={box} className={`vt-demo${big ? ' is-big' : ''}${step === 4 ? ' is-live' : ''}`} aria-hidden="true">
    <div className="vt-demo-phone"><div className="vt-demo-screen">
      <i className="vt-demo-island" />
      <div className="vt-demo-top">
        <span className="vt-demo-clock"><Timer size={13} />{clock}</span>
        <span className="vt-demo-tag">{step === 4 ? <><Check size={12} /> No ar</> : 'Seu sistema'}</span>
      </div>

      {step < 4 ? <div className="vt-demo-form" key={`f${round}`}>
        <div className={`vt-demo-field${step === 0 ? ' is-on' : ''}`}>
          <small>Nome da empresa</small>
          <b>{typed}{step === 0 && <i className="vt-demo-caret" />}</b>
        </div>

        <div className={`vt-demo-block${shown(AT.modelo) ? ' is-in' : ''}`}>
          <small>Modelo</small>
          <div className="vt-demo-models">
            {models.map((m, i) => <span key={m.id} className={`vt-demo-model${i === 1 && shown(AT.modelo + 900) ? ' is-picked' : ''}`} style={paletteVars(m.theme, m.palette) as CSSProperties}>
              <i /><em /><em className="short" />
              {i === 1 && shown(AT.modelo + 900) && <Check size={12} className="vt-demo-pick" />}
            </span>)}
          </div>
        </div>

        <div className={`vt-demo-block${shown(AT.fotos) ? ' is-in' : ''}`}>
          <small>Fotos</small>
          <div className="vt-demo-photos">
            {[0, 1, 2].map(i => <span key={i} className={shown(AT.fotos + 250 + i * 330) ? 'is-in' : ''}>
              {photos[i] && shown(AT.fotos + 250 + i * 330) ? <img src={photos[i]} alt="" /> : <ImageIcon size={16} />}
            </span>)}
          </div>
        </div>

        <div className={`vt-demo-field vt-demo-late${shown(AT.fotos + 1400) ? ' is-in' : ''}${step === 2 && shown(AT.fotos + 1400) ? ' is-on' : ''}`}>
          <small><MessageCircle size={11} /> WhatsApp</small>
          <b>{phoneTyped}{step === 2 && shown(AT.fotos + 1400) && <i className="vt-demo-caret" />}</b>
        </div>

        <div className={`vt-demo-publish${shown(AT.publicar) ? ' is-in' : ''}${shown(AT.toque) ? ' is-pressed' : ''}`}>
          {shown(AT.toque + 250) ? <span className="vt-demo-spin" /> : <Rocket size={15} />}
          {shown(AT.toque + 250) ? 'Publicando…' : 'Publicar'}
          {shown(AT.toque - 300) && !shown(AT.toque + 500) && <i className="vt-demo-finger" />}
        </div>
      </div>

      : <div className="vt-demo-site" style={vars} key={`s${round}`}>
        <div className="vt-demo-cover">
          {imageUrl(demo.cover) && <img src={imageUrl(demo.cover)} alt="" />}
          <strong>{title}</strong>
          <span className="vt-demo-wa"><MessageCircle size={12} /> {demo.ctaText || 'Chamar no WhatsApp'}</span>
        </div>
        <div className="vt-demo-items">
          {demo.products.slice(0, 2).map((p, i) => <span key={p.id} style={{ '--i': i } as CSSProperties}>
            {imageUrl(p.image) && <img src={imageUrl(p.image)} alt="" />}
            <b>{p.name}</b>{p.price && <em>R$ {p.price}</em>}
          </span>)}
        </div>
        <div className="vt-demo-toast"><Check size={13} /><span><b>Publicado!</b> ddsinovacao.com.br/{slugOf(title)}</span></div>
        <div className="vt-demo-confetti">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ '--k': i } as CSSProperties} />)}</div>
      </div>}
    </div></div>
  </div>;
}
