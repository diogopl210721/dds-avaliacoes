import { CSSProperties, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { MiniContent, MiniTheme, themeOptions, thumbContent } from '../lib/miniPage';
import { usePhoneTilt } from '../lib/miniMotion';
import MiniLanding from './MiniLanding';

type Vars = CSSProperties & Record<`--${string}`, string | number>;
const inert = { inert: '' } as Record<string, string>;

// Celular em 3D que mostra o mini site rolando sozinho. Puramente visual.
export function ThemePhone({ content, theme, index = 0 }: { content: MiniContent; theme: MiniTheme; index?: number }) {
  const stage = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  usePhoneTilt(stage);
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
  return <div className={`tp-stage tp-${theme}`} ref={stage} style={{ '--i': index } as Vars} aria-hidden="true">
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

// Prévia em tela cheia, com troca de modelo opcional.
export function MiniPreviewModal({ content, demo = false, label, onClose, onTheme }: {
  content: MiniContent; demo?: boolean; label: string; onClose: () => void; onTheme?: (theme: MiniTheme) => void;
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
      {onTheme ? <div className="mini-modal-themes" role="group" aria-label="Escolher modelo">
        {themeOptions.map(t => <button key={t.id} aria-pressed={content.theme === t.id} onClick={() => onTheme(t.id)}>{t.name}</button>)}
      </div> : <span className="mini-modal-title">{label}</span>}
      <button className="mini-modal-close" autoFocus onClick={onClose}><X size={18} /> Fechar</button>
    </div>
    <MiniLanding key={content.theme} content={content} demo={demo} />
  </div>;
}
