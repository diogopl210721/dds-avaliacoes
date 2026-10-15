import { CSSProperties, ReactNode, RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';
import { NICHES, NICHE_GROUPS, NicheGroup, NicheId, nicheById } from '../lib/miniNicheCore';
import { nicheDemo } from '../lib/miniNicheDemos';
import { MiniContent, MiniTheme, PaletteId, imageUrl, themeName } from '../lib/miniPage';
import { PALETTES, paletteVars } from '../lib/miniPalettes';
import { PaletteDots, ThemePhone } from './MiniThemes';
import MiniLanding from './MiniLanding';

// Peças da vitrine de ramos, usadas na página /exemplos e no passo 1 do estúdio.

export type GroupFilter = NicheGroup | 'todos';
export const nichesOf = (group: GroupFilter) => (group === 'todos' ? NICHES : NICHES.filter(n => n.group === group));

export function NicheChips({ value, onChange }: { value: GroupFilter; onChange: (g: GroupFilter) => void }) {
  const items: { id: GroupFilter; label: string; count: number }[] = [{ id: 'todos', label: 'Todos', count: NICHES.length }, ...NICHE_GROUPS.map(g => ({ id: g.id, label: g.label, count: nichesOf(g.id).length }))];
  return <div className="nc-chips" role="group" aria-label="Filtrar por grupo de ramos">
    {items.map(it => <button key={it.id} type="button" aria-pressed={value === it.id} onClick={() => onChange(it.id)}>{it.label}<b>{it.count}</b></button>)}
  </div>;
}

// Com o nome do cliente digitado, o nome vira o título grande da capa (letra por letra).
export const withName = (c: MiniContent, name: string) => (name.trim() ? { ...c, name: name.trim(), headline: '' } : c);

export function modelLabel(id: NicheId) {
  const n = nicheById(id)!;
  return `Modelo ${themeName(n.theme)} · cores ${PALETTES[n.theme].find(p => p.id === n.palette)?.name ?? ''}`;
}

// Cada celular "ao vivo" é a página inteira em miniatura, com animações e efeito em canvas.
// Vinte de uma vez estouram a memória do Safari no iPhone ("A problem repeatedly occurred"),
// então só os que estão na tela ficam ao vivo, com limite de quantos ao mesmo tempo;
// os outros mostram um retrato leve (foto de capa + nome).
const LIVE_MAX = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches ? 4 : 8;
let liveCount = 0;
const waiting = new Set<() => void>();
const releaseLive = () => { liveCount = Math.max(0, liveCount - 1); waiting.forEach(fn => fn()); };

function useLive(ref: RefObject<HTMLElement>, enabled: boolean) {
  const [live, setLive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) { setLive(false); return; }
    if (!('IntersectionObserver' in window)) { setLive(true); return; }
    let visible = false, holding = false, timer: ReturnType<typeof setTimeout> | undefined;
    const tryAcquire = () => {
      if (!visible || holding || liveCount >= LIVE_MAX) return;
      liveCount++; holding = true; waiting.delete(tryAcquire); setLive(true);
    };
    const drop = () => { waiting.delete(tryAcquire); if (holding) { holding = false; setLive(false); releaseLive(); } };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      clearTimeout(timer);
      if (visible) { waiting.add(tryAcquire); timer = setTimeout(tryAcquire, 180); }
      else drop();
    }, { threshold: 0.45 });
    io.observe(el);
    return () => { clearTimeout(timer); io.disconnect(); visible = false; drop(); };
  }, [enabled]);
  return live;
}

// Retrato leve do exemplo, enquanto o celular não está ao vivo.
export function PhonePoster({ content, theme }: { content: MiniContent; theme: MiniTheme }) {
  const vars = paletteVars(theme, content.palette, content.brandColor) as CSSProperties;
  const cover = imageUrl(content.cover);
  return <div className={`tp-stage tp-${theme} tp-is-poster`} style={vars} aria-hidden="true">
    <div className="tp-tilt"><div className="tp-device">
      <div className="tp-screen tp-poster">
        {cover && <img src={cover} alt="" loading="lazy" decoding="async" />}
        <b>{content.name}</b><i /><i className="short" />
      </div>
      <i className="tp-island" />
    </div></div>
  </div>;
}

export function NicheCard({ id, name = '', index = 0, selected = false, paused = false, onOpen }: { id: NicheId; name?: string; index?: number; selected?: boolean; paused?: boolean; onOpen: (id: NicheId) => void }) {
  const n = nicheById(id)!;
  const content = useMemo(() => withName(nicheDemo(id, 'thumb'), name), [id, name]);
  const box = useRef<HTMLDivElement>(null);
  const live = useLive(box, !paused);
  return <div className={`nc-card${selected ? ' is-selected' : ''}`} ref={box}>
    {live ? <ThemePhone content={content} theme={n.theme} index={index} /> : <PhonePoster content={content} theme={n.theme} />}
    <span className="nc-body">
      <strong>{n.short}{selected && <i>Escolhido</i>}</strong>
      <small>{n.label}</small>
      <em><Sparkles size={13} aria-hidden="true" />{n.fxLabel}</em>
    </span>
    <button type="button" className="nc-hit" onClick={() => onOpen(id)} aria-label={`Ver o exemplo de ${n.label}`} />
  </div>;
}

// Exemplo em tela cheia: troca de cores, anterior/próximo (setas do teclado também) e a ação principal.
export function NicheViewer({ id, ids, name = '', onClose, onNav, actions, label }: {
  id: NicheId; ids: NicheId[]; name?: string; onClose: () => void; onNav: (id: NicheId) => void; actions: ReactNode | ((palette: PaletteId) => ReactNode); label?: string;
}) {
  const n = nicheById(id)!;
  const [palette, setPalette] = useState<PaletteId>(n.palette);
  const [hint, setHint] = useState(true);
  useEffect(() => { setPalette(n.palette); }, [id]);
  useEffect(() => { const t = setTimeout(() => setHint(false), 4200); return () => clearTimeout(t); }, []);
  const pos = Math.max(0, ids.indexOf(id));
  const go = (d: number) => onNav(ids[(pos + d + ids.length) % ids.length]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      // Com a foto ampliada ou a janela de privacidade aberta, o teclado é delas (Esc fecha só a foto).
      if (document.querySelector('.mini-lightbox, .mini-sheet')) return;
      if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', key, true); // antes da foto ampliada tratar o Esc
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', key, true); document.body.style.overflow = overflow; };
  });
  const content = useMemo(() => ({ ...withName(nicheDemo(id, 'full'), name), palette }), [id, name, palette]);
  return <div className="nv" role="dialog" aria-modal="true" aria-label={`Exemplo de ${n.label}`}>
    <div className="nv-bar">
      <div className="nv-nav">
        {ids.length > 1 && <button type="button" className="nv-arrow" onClick={() => go(-1)} aria-label="Exemplo anterior"><ChevronLeft size={20} /></button>}
        <div className="nv-title"><strong>{n.short}</strong><span>{ids.length > 1 ? `${pos + 1} de ${ids.length} · ` : ''}{n.fxLabel}</span></div>
        {ids.length > 1 && <button type="button" className="nv-arrow" onClick={() => go(1)} aria-label="Próximo exemplo"><ChevronRight size={20} /></button>}
      </div>
      <div className="nv-tools">
        <div className="nv-palettes"><span>Cores</span><PaletteDots theme={n.theme} value={palette} onChange={setPalette} /></div>
        <div className="nv-actions">
          {typeof actions === 'function' ? actions(palette) : actions}
          <button type="button" className="nv-close" onClick={onClose} aria-label="Fechar"><X size={19} /></button>
        </div>
      </div>
    </div>
    <div className="nv-stage">
      <MiniLanding key={id} content={content} demo floating demoLabel={label ?? (name ? `Exemplo com o nome ${name} · fotos ilustrativas` : 'Empresa fictícia · fotos ilustrativas')} />
    </div>
    {hint && <div className="nv-hint" role="status"><Sparkles size={15} aria-hidden="true" /> Toque e arraste na capa: o efeito reage.</div>}
  </div>;
}
