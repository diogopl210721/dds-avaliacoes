import { CSSProperties, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { MiniContent, MiniTheme, PaletteId, themeOptions, thumbContent } from '../lib/miniPage';
import { PALETTES, paletteVars } from '../lib/miniPalettes';
import { usePhoneTilt } from '../lib/miniMotion';
import { useThemeFonts } from '../lib/miniFonts';
import MiniLanding from './MiniLanding';

type Vars = CSSProperties & Record<`--${string}`, string | number>;
const inert = { inert: '' } as Record<string, string>;

// Celular em 3D que mostra o mini site rolando sozinho. Puramente visual.
export function ThemePhone({ content, theme, index = 0 }: { content: MiniContent; theme: MiniTheme; index?: number }) {
  const stage = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  usePhoneTilt(stage);
  useThemeFonts([theme]);
  // Pausa as animações dos celulares que estão fora da tela (são até nove de uma vez).
  useEffect(() => {
    const el = stage.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle('is-paused', !e.isIntersecting), { rootMargin: '80px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const el = screen.current;
    if (!el) return;
    const fit = () => {
      const scale = el.clientWidth / 360;
      if (!scale) return;
      el.style.setProperty('--s', scale.toFixed(4));
      el.style.setProperty('--vh', `${(el.clientHeight / scale).toFixed(1)}px`);
    };
    fit();
    if (!('ResizeObserver' in window)) return;
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const vars = paletteVars(theme, content.palette, content.brandColor);
  return <div className={`tp-stage tp-${theme}`} ref={stage} style={{ ...vars, '--i': index } as Vars} aria-hidden="true">
    <div className="tp-tilt"><div className="tp-float">
      <div className="tp-device">
        <div className="tp-screen" ref={screen}>
          <div className="tp-scale"><div className="tp-scroll" {...inert}><MiniLanding content={thumbContent(content, theme)} thumb /></div></div>
        </div>
        <i className="tp-island" /><i className="tp-glare" />
      </div>
    </div></div>
    <i className="tp-floor" />
  </div>;
}

// Bolinhas com as 4 paletas do modelo (e a cor da marca, quando houver).
export function PaletteDots({ theme, value, brandColor = '', onChange }: { theme: MiniTheme; value: PaletteId; brandColor?: string; onChange: (id: PaletteId) => void }) {
  return <div className="palette-dots" role="radiogroup" aria-label="Cores">
    {PALETTES[theme].map(p => <button key={p.id} role="radio" aria-checked={value === p.id} aria-label={p.name} title={p.name} onClick={() => onChange(p.id)}
      style={{ '--a': p.vars['--accent'], '--b': p.vars['--bg'], '--c': p.vars['--fx1'] } as Vars} />)}
    {brandColor && <button role="radio" aria-checked={value === 'brand'} aria-label="Cor da marca" title="Cor da marca" onClick={() => onChange('brand')}
      style={{ '--a': brandColor, '--b': PALETTES[theme][0].vars['--bg'], '--c': brandColor } as Vars} />}
  </div>;
}

// Prévia em tela cheia, com troca de modelo e de cores opcional.
export function MiniPreviewModal({ content, demo = false, label, onClose, onTheme, onPalette, action }: {
  content: MiniContent; demo?: boolean; label: string; onClose: () => void; onTheme?: (theme: MiniTheme) => void; onPalette?: (id: PaletteId) => void;
  action?: { label: string; onClick: () => void };
}) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', key);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', key); document.body.style.overflow = overflow; };
  }, [onClose]);
  return <div className="studio-preview-modal" role="dialog" aria-modal="true" aria-label={label}>
    <div className="mini-modal-bar">
      <div className="mini-modal-controls">
        {onTheme ? <ThemeChips current={content.theme} onTheme={onTheme} /> : <span className="mini-modal-title">{label}</span>}
        {onPalette && <div className="mini-modal-palettes"><span>Cores</span><PaletteDots theme={content.theme} value={content.palette} brandColor={content.brandColor} onChange={onPalette} /></div>}
      </div>
      <div className="mini-modal-buttons">
        {action && <button className="mini-modal-use" onClick={action.onClick}>{action.label}</button>}
        <button className="mini-modal-close" autoFocus={!action} onClick={onClose}><X size={18} /> Fechar</button>
      </div>
    </div>
    <MiniLanding key={content.theme} content={content} demo={demo} floating />
  </div>;
}

function ThemeChips({ current, onTheme }: { current: MiniTheme; onTheme: (theme: MiniTheme) => void }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { box.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center' }); }, [current]);
  return <div className="mini-modal-themes" role="group" aria-label="Escolher modelo" ref={box}>
    {themeOptions.map(t => <button key={t.id} aria-pressed={current === t.id} onClick={() => onTheme(t.id)}>{t.name}<small>{t.niche}</small></button>)}
  </div>;
}
