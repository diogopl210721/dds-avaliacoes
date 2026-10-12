import type { MiniTheme, PaletteId } from './miniPage';

// Cores de cada modelo. Todas as cores da página saem destas variáveis CSS,
// então trocar a paleta muda o fundo, os botões, os efeitos e até o WebGL.
export type Vars = Record<`--${string}`, string>;
export type Palette = { id: Exclude<PaletteId, 'brand'>; name: string; vars: Vars };

type Base = { bg: string; surface?: string; ink: string; muted: string; accent: string; accent2: string; onAccent?: string; line: string; fx: [string, string, string]; extra?: Record<string, string> };
const mk = (id: Palette['id'], name: string, p: Base): Palette => {
  const vars: Vars = {
    '--bg': p.bg, '--surface': p.surface ?? '#ffffff', '--ink': p.ink, '--muted': p.muted,
    '--accent': p.accent, '--accent2': p.accent2, '--on-accent': p.onAccent ?? '#ffffff', '--line': p.line,
    '--glow': alpha(p.accent, 0.42), '--soft': alpha(p.accent, 0.14), '--fx1': p.fx[0], '--fx2': p.fx[1], '--fx3': p.fx[2],
  };
  for (const [k, v] of Object.entries(p.extra ?? {})) vars[`--${k}`] = v;
  return { id, name, vars: finish(vars) };
};

// Garante texto legível nos botões: escolhe a cor do texto com mais contraste e
// limita o degradê do botão até onde o texto continua legível.
function finish(v: Vars): Vars {
  let acc = v['--accent'];
  let on = v['--on-accent'];
  if (contrast(on, acc) < 4.5) on = ['#ffffff', v['--bg'], v['--ink'], '#141414'].sort((a, b) => contrast(b, acc) - contrast(a, acc))[0];
  // Tons médios (nem branco nem preto chegam a 4,5): escurece ou clareia o destaque aos poucos.
  if (contrast(on, acc) < 4.5) {
    const [h, s2, l0] = toHsl(acc), lightText = lum(on) > lum(acc);
    for (let i = 1, l = l0; i <= 25 && contrast(on, acc) < 4.5; i++) { l += lightText ? -1.5 : 1.5; acc = fromHsl(h, s2, l); }
    v['--accent'] = acc; v['--glow'] = alpha(acc, 0.42); v['--soft'] = alpha(acc, 0.14);
  }
  v['--on-accent'] = on;
  let end = acc;
  for (let i = 1; i <= 10; i++) { const m = mix(acc, v['--accent2'], i / 10); if (contrast(on, m) >= 4.5) end = m; else break; }
  v['--btn-end'] = end;
  return v;
}

const sky = (s1: string, s2: string, s3: string, s4: string, far: string, mid: string, mpine: string, near: string, pine: string, sun: string) =>
  ({ sky1: s1, sky2: s2, sky3: s3, sky4: s4, far, mid, mpine, near, pine, sun });

export const PALETTES: Record<MiniTheme, Palette[]> = {
  elegance: [
    mk('p1', 'Café e ouro', { bg: '#1b1410', surface: '#251b15', ink: '#f3e8d6', muted: '#bba78f', accent: '#d8b06c', accent2: '#c7964e', onAccent: '#1b1410', line: '#3d2f24', fx: ['#55211f', '#2e2118', '#d8b06c'] }),
    mk('p2', 'Vinho', { bg: '#1a0f13', surface: '#26151b', ink: '#f6e9ec', muted: '#c4a3ad', accent: '#e3b38a', accent2: '#c98d68', onAccent: '#1a0f13', line: '#3e2530', fx: ['#6b1a32', '#2b141c', '#e3b38a'] }),
    mk('p3', 'Verde inglês', { bg: '#0f1915', surface: '#16241e', ink: '#eef2e6', muted: '#a7b6a4', accent: '#d6b86a', accent2: '#b8984c', onAccent: '#0f1915', line: '#2a3c33', fx: ['#1f4a36', '#15271f', '#d6b86a'] }),
    mk('p4', 'Grafite e prata', { bg: '#131416', surface: '#1c1d21', ink: '#f2f2f0', muted: '#a7a9ae', accent: '#dfe2e6', accent2: '#a9aeb5', onAccent: '#131416', line: '#2f3136', fx: ['#2c3542', '#1d2026', '#dfe2e6'] }),
  ],
  viva: [
    mk('p1', 'Sol', { bg: '#fffcf2', ink: '#2d1b3d', muted: '#66547a', accent: '#ff5a36', accent2: '#ffd84d', line: '#2d1b3d', fx: ['#ffd84d', '#6fe0c0', '#ee4c86'] }),
    mk('p2', 'Chiclete', { bg: '#fff6fa', ink: '#2b1340', muted: '#6d5580', accent: '#6b4bff', accent2: '#ffb3d1', line: '#2b1340', fx: ['#ffb3d1', '#ffe066', '#2ec4b6'] }),
    mk('p3', 'Água', { bg: '#f2fffc', ink: '#13293d', muted: '#4f6475', accent: '#f0552a', accent2: '#8ee6d9', line: '#13293d', fx: ['#8ee6d9', '#ffd84d', '#5b6cff'] }),
    mk('p4', 'Céu', { bg: '#f5f8ff', ink: '#1d1f4a', muted: '#585b86', accent: '#f03a4c', accent2: '#9cc8ff', line: '#1d1f4a', fx: ['#9cc8ff', '#ffd84d', '#7a5cff'] }),
  ],
  essencial: [
    mk('p1', 'Azul', { bg: '#eef3fb', surface: '#ffffffbf', ink: '#0e1f3d', muted: '#52627d', accent: '#2a6bff', accent2: '#7a5cff', line: '#0e1f3d1c', fx: ['#2a6bff', '#7a5cff', '#16bfd6'] }),
    mk('p2', 'Violeta', { bg: '#f4f1fd', surface: '#ffffffbf', ink: '#1d1238', muted: '#5d5379', accent: '#7a3cff', accent2: '#e8478f', line: '#1d12381c', fx: ['#7a3cff', '#ff5ca8', '#5ab0ff'] }),
    mk('p3', 'Turquesa', { bg: '#edf8f6', surface: '#ffffffbf', ink: '#0b2a2e', muted: '#4b6a6c', accent: '#0a8277', accent2: '#2a6bff', line: '#0b2a2e1c', fx: ['#0abfae', '#2a6bff', '#4fd1a5'] }),
    mk('p4', 'Coral', { bg: '#fdf3f0', surface: '#ffffffbf', ink: '#3a1d16', muted: '#7d5a50', accent: '#d9402a', accent2: '#f08a2e', line: '#3a1d161c', fx: ['#ff6b4a', '#ff9f43', '#ff6fa1'] }),
  ],
  brasa: [
    mk('p1', 'Fogo', { bg: '#120d0b', surface: '#1c1411', ink: '#fbeee0', muted: '#c6ad97', accent: '#ff7a1a', accent2: '#ffc14d', onAccent: '#1a0e07', line: '#3d2c22', fx: ['#ff5a14', '#ffb347', '#ffd27a'], extra: { deep: '#a3300c' } }),
    mk('p2', 'Pimenta', { bg: '#130b0b', surface: '#1f1211', ink: '#fbe9e4', muted: '#c8a29b', accent: '#ff4136', accent2: '#ff9a6b', onAccent: '#1a0706', line: '#402420', fx: ['#e3241b', '#ff7a45', '#ffb08a'], extra: { deep: '#8a120c' } }),
    mk('p3', 'Mostarda', { bg: '#12100a', surface: '#1c1910', ink: '#fbf3dc', muted: '#c9bb93', accent: '#f2b705', accent2: '#ffe08a', onAccent: '#1a1205', line: '#3d3520', fx: ['#e08e0b', '#ffd166', '#fff1b8'], extra: { deep: '#8a5508' } }),
    mk('p4', 'Chama azul', { bg: '#0a0d14', surface: '#121725', ink: '#eaf2ff', muted: '#9fb0cc', accent: '#4da3ff', accent2: '#9bd4ff', onAccent: '#06101f', line: '#243049', fx: ['#1f6bff', '#66c2ff', '#d6f0ff'], extra: { deep: '#0b2e7a' } }),
  ],
  aura: [
    mk('p1', 'Rosé', { bg: '#fbf6f4', surface: '#ffffffd9', ink: '#3b2631', muted: '#7d6170', accent: '#a8577a', accent2: '#d8a47c', line: '#3b263117', fx: ['#f7d1dd', '#ded6fa', '#fde2cf'] }),
    mk('p2', 'Lavanda', { bg: '#f8f6fc', surface: '#ffffffd9', ink: '#2e2440', muted: '#675c7d', accent: '#7a5ca8', accent2: '#c49bd6', line: '#2e244017', fx: ['#e2d5f7', '#cfe0fb', '#f6d9ec'] }),
    mk('p3', 'Champanhe', { bg: '#fbf7f2', surface: '#ffffffd9', ink: '#3a2a21', muted: '#776557', accent: '#94654a', accent2: '#d4ab7f', line: '#3a2a2117', fx: ['#f3e2d0', '#ecdcd3', '#fbefe2'] }),
    mk('p4', 'Sálvia', { bg: '#f5f8f2', surface: '#ffffffd9', ink: '#24332a', muted: '#58695d', accent: '#56755c', accent2: '#b5c8a1', line: '#24332a17', fx: ['#dbe9d4', '#e8efdf', '#f3e6d6'] }),
  ],
  navalha: [
    mk('p1', 'Clássico', { bg: '#141519', surface: '#1c1e23', ink: '#efebe4', muted: '#a3a7af', accent: '#e0283a', accent2: '#2c5ad6', line: '#2d3037', fx: ['#8c0a12', '#0d2470', '#9aa0aa'], extra: { metal1: '#80868f', metal2: '#fbfcfd', stripe: '#f5f2ec' } }),
    mk('p2', 'Ouro velho', { bg: '#121110', surface: '#1b1917', ink: '#f1ebde', muted: '#b0a693', accent: '#c9a04f', accent2: '#1f1f1f', onAccent: '#121110', line: '#2e2a24', fx: ['#6b4f1d', '#2a2015', '#c9a04f'], extra: { metal1: '#8a6a2e', metal2: '#f6e3a8', stripe: '#f4ead2' } }),
    mk('p3', 'Couro', { bg: '#1a1310', surface: '#241a15', ink: '#f2e7da', muted: '#b9a491', accent: '#c8743f', accent2: '#3f6b4a', line: '#3a2b22', fx: ['#6e3417', '#1f3a28', '#e0b48a'], extra: { metal1: '#8a5a3c', metal2: '#f3c6a0', stripe: '#f2e7da' } }),
    mk('p4', 'Petróleo', { bg: '#0e1517', surface: '#152022', ink: '#e9f1f0', muted: '#9fb3b2', accent: '#1fb5a8', accent2: '#e8a33d', onAccent: '#06201d', line: '#24363a', fx: ['#0b5d56', '#5a3a0c', '#8fd9d1'], extra: { metal1: '#7f9a9a', metal2: '#f3fbfb', stripe: '#e9f1f0' } }),
  ],
  vital: [
    mk('p1', 'Menta', { bg: '#f3faf8', ink: '#0d2b33', muted: '#4a666e', accent: '#0b8573', accent2: '#2b7bd6', line: '#0d2b331a', fx: ['#d3f3ed', '#cce5fb', '#dbf6f1'] }),
    mk('p2', 'Azul clínico', { bg: '#f3f7fd', ink: '#0f2540', muted: '#4d6380', accent: '#1f6fd1', accent2: '#0fa3a3', line: '#0f25401a', fx: ['#d4e5fb', '#d3f1f1', '#e2ecfc'] }),
    mk('p3', 'Lilás calmo', { bg: '#f7f5fc', ink: '#251c45', muted: '#5d567a', accent: '#6b4fc4', accent2: '#2fa39a', line: '#251c451a', fx: ['#e3dcf7', '#d5efea', '#ece6fb'] }),
    mk('p4', 'Verde folha', { bg: '#f4f9f1', ink: '#1d331b', muted: '#53684f', accent: '#367f32', accent2: '#c08a2e', line: '#1d331b1a', fx: ['#d9efd2', '#eef3d3', '#e1f2dc'] }),
  ],
  impulso: [
    mk('p1', 'Laranja e rosa', { bg: '#0b0d1f', surface: '#141738', ink: '#f6f6ff', muted: '#a9aed8', accent: '#ff5b14', accent2: '#ff2d87', line: '#272b5c', fx: ['#ff5b14', '#ff2d87', '#2a1450'] }),
    mk('p2', 'Elétrico', { bg: '#070b17', surface: '#0f1730', ink: '#f2f7ff', muted: '#9fb2d6', accent: '#2f7bff', accent2: '#18e0ff', line: '#1d2b52', fx: ['#2f7bff', '#18e0ff', '#0f2a5c'] }),
    mk('p3', 'Amarelo e preto', { bg: '#0d0d0d', surface: '#181818', ink: '#fafafa', muted: '#b5b5b5', accent: '#ffd400', accent2: '#ff8a00', onAccent: '#111111', line: '#2c2c2c', fx: ['#ffd400', '#ff8a00', '#2e2600'] }),
    mk('p4', 'Vermelho', { bg: '#120709', surface: '#1f0d11', ink: '#fff3f4', muted: '#d1a6ab', accent: '#ff1f3d', accent2: '#ff7a00', line: '#3d1820', fx: ['#ff1f3d', '#ff7a00', '#3d0d14'] }),
  ],
  refugio: [
    mk('p1', 'Pôr do sol', { bg: '#eef2ec', ink: '#1f3326', muted: '#56695c', accent: '#2f6b4a', accent2: '#e3924a', line: '#1f33261a', fx: ['#f4c7a3', '#d8b6c8', '#ffd9a0'], extra: sky('#a9a6d4', '#d8b6c8', '#f4c7a3', '#fbe2c4', '#9a98c4', '#7f9b8b', '#5d7d6b', '#4b7258', '#24402e', '#ffd9a0') }),
    mk('p2', 'Manhã', { bg: '#eef4f2', ink: '#1c3330', muted: '#556b67', accent: '#2a7052', accent2: '#e0a33a', line: '#1c33301a', fx: ['#bfe0f5', '#e3f2f6', '#fff4c2'], extra: sky('#8ec5f2', '#bfe0f5', '#e3f2f6', '#f6fbf4', '#9fb6cf', '#8fb39a', '#6e9a7c', '#5d8f63', '#2f5934', '#fff4c2') }),
    mk('p3', 'Outono', { bg: '#f8f1e8', ink: '#3a2516', muted: '#7a6250', accent: '#9a4b24', accent2: '#2f6b4a', line: '#3a25161a', fx: ['#f2c493', '#f9dfbb', '#ffe1a8'], extra: sky('#e9a46d', '#f2c493', '#f9dfbb', '#fcefdc', '#c99f84', '#b27a4f', '#9a6239', '#8a4f2a', '#4a2a17', '#ffe1a8') }),
    mk('p4', 'Noite', { bg: '#eff0f6', ink: '#1b2238', muted: '#565d78', accent: '#3b4fa8', accent2: '#e3b34a', line: '#1b22381a', fx: ['#1f2a55', '#3a3f74', '#f4f1d8'], extra: sky('#0f1838', '#1f2a55', '#3a3f74', '#5d5a8c', '#2c3563', '#253150', '#1e2a45', '#1a2440', '#0e152b', '#f4f1d8') }),
  ],
};

const DARK = new Set<MiniTheme>(['elegance', 'brasa', 'navalha', 'impulso']);

export function paletteVars(theme: MiniTheme, palette: PaletteId, brandColor = ''): Vars {
  const list = PALETTES[theme];
  if (palette === 'brand' && /^#[0-9a-f]{6}$/i.test(brandColor)) return brandVars(theme, brandColor);
  return (list.find(p => p.id === palette) ?? list[0]).vars;
}

// Cores para o WebGL: [efeito 1, efeito 2, efeito 3, fundo].
export function shaderColors(vars: Vars): [string, string, string, string] {
  return [vars['--fx1'], vars['--fx2'], vars['--fx3'], vars['--bg']];
}

// "Cor da minha marca": parte da paleta 1 do modelo e troca o destaque e os efeitos,
// ajustando o brilho para o texto continuar legível.
function brandVars(theme: MiniTheme, hex: string): Vars {
  const base = { ...PALETTES[theme][0].vars };
  const [h, s] = toHsl(hex);
  const dark = DARK.has(theme);
  let accent = hex;
  if (dark) { const [, , l] = toHsl(hex); accent = fromHsl(h, s, Math.min(72, Math.max(52, l))); }
  else accent = darkenFor(hex, base['--bg'], 3.2);
  const onAccent = contrast(accent, '#ffffff') >= 4.5 ? '#ffffff' : '#141414';
  const accent2 = fromHsl(h + 28, Math.min(95, s + 5), dark ? 70 : 58);
  const v: Vars = { ...base, '--accent': accent, '--accent2': accent2, '--on-accent': onAccent, '--glow': alpha(accent, 0.42), '--soft': alpha(accent, 0.14) };
  const set = (a: string, b: string, c: string) => { v['--fx1'] = a; v['--fx2'] = b; v['--fx3'] = c; };
  switch (theme) {
    case 'elegance': set(fromHsl(h, 55, 22), fromHsl(h, 30, 13), accent); break;
    case 'viva': v['--accent2'] = fromHsl(h, 90, 76); set(fromHsl(h, 90, 76), fromHsl(h + 150, 65, 66), fromHsl(h + 210, 75, 62)); break;
    case 'essencial': set(fromHsl(h, Math.max(s, 70), 55), fromHsl(h + 40, 80, 62), fromHsl(h - 45, 75, 55)); break;
    case 'brasa': set(fromHsl(h, 95, 50), fromHsl(h + 14, 100, 64), fromHsl(h + 24, 100, 78)); v['--deep'] = fromHsl(h, 85, 30); break;
    case 'aura': set(fromHsl(h, 70, 90), fromHsl(h + 45, 60, 91), fromHsl(h - 35, 75, 92)); break;
    case 'navalha': v['--accent2'] = fromHsl(h + 180, 60, 45); set(fromHsl(h, 80, 28), fromHsl(h + 180, 70, 22), accent); break;
    case 'vital': set(fromHsl(h, 55, 90), fromHsl(h + 35, 60, 90), fromHsl(h - 20, 55, 93)); break;
    case 'impulso': set(accent, fromHsl(h + 40, 95, 60), fromHsl(h, 60, 16)); v['--accent2'] = fromHsl(h + 40, 95, 60); break;
    case 'refugio': break;
  }
  return finish(v);
}

// ---- utilidades de cor ----
function rgb(hex: string): [number, number, number] { const n = parseInt(hex.slice(1, 7), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function hex2(n: number) { return Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0'); }
export function alpha(hex: string, a: number) { return hex.slice(0, 7) + hex2(a * 255); }
function toHsl(hex: string): [number, number, number] {
  const [r, g, b] = rgb(hex).map(x => x / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min, s = l > .5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s * 100, l * 100];
}
function fromHsl(h: number, s: number, l: number) {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)].map(x => hex2(x * 255)).join('');
}
function mix(a: string, b: string, t: number) { const x = rgb(a), y = rgb(b); return '#' + x.map((n, i) => hex2(n + (y[i] - n) * t)).join(''); }
function lum(hex: string) { const [r, g, b] = rgb(hex).map(x => { x /= 255; return x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }); return .2126 * r + .7152 * g + .0722 * b; }
export function contrast(a: string, b: string) { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
function darkenFor(hex: string, bg: string, min: number) {
  let [h, s, l] = toHsl(hex), out = hex;
  for (let i = 0; i < 40 && contrast(out, bg) < min; i++) { l -= 2; out = fromHsl(h, s, l); }
  return out;
}
