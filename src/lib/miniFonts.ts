import { useEffect } from 'react';
import type { MiniTheme } from './miniPage';

// Cada modelo carrega só as fontes dele (a página pública fica mais leve).
export const THEME_FONTS: Record<MiniTheme, string[]> = {
  elegance: ['Fraunces:ital,opsz,wght@0,9..144,400..600;1,9..144,400', 'DM+Sans:wght@400;500;600;700'],
  viva: ['Bricolage+Grotesque:opsz,wght@12..96,400..800'],
  essencial: ['Sora:wght@400..700'],
  brasa: ['Big+Shoulders+Display:wght@600..900', 'DM+Sans:wght@400;500;600;700'],
  aura: ['Cormorant+Garamond:ital,wght@0,400..600;1,400..600', 'Jost:wght@300..600'],
  navalha: ['Archivo:wdth,wght@62..125,400..900'],
  vital: ['Manrope:wght@400..800'],
  impulso: ['Barlow+Condensed:ital,wght@0,700;0,800;1,700;1,800', 'Barlow:wght@400;500;600;700'],
  refugio: ['DM+Serif+Display', 'DM+Sans:wght@400;500;600;700'],
};

export function fontsUrl(themes: MiniTheme[]) {
  const families = [...new Set(themes.flatMap(t => THEME_FONTS[t] ?? []))].sort();
  return families.length ? `https://fonts.googleapis.com/css2?${families.map(f => 'family=' + f).join('&')}&display=swap` : '';
}

export function loadFonts(themes: MiniTheme[]) {
  if (typeof document === 'undefined') return;
  const url = fontsUrl(themes);
  if (!url || document.querySelector(`link[data-mini-fonts="${CSS.escape(url)}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet'; link.href = url; link.dataset.miniFonts = url;
  document.head.appendChild(link);
}

export function useThemeFonts(themes: MiniTheme[]) {
  const key = themes.join(',');
  useEffect(() => { loadFonts(themes); }, [key]);
}
