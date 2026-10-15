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
  // ---- Modelos próprios de cada ramo ----
  // Corrida: asfalto escuro com cor de tênis de corrida.
  pace: [
    mk('p1', 'Volt', { bg: '#0d0f12', surface: '#171a1f', ink: '#f4f6f8', muted: '#9aa3ad', accent: '#d4ff1e', accent2: '#00e0ff', onAccent: '#0d0f12', line: '#2a2f37', fx: ['#d4ff1e', '#00e0ff', '#ff3d6e'], extra: { track: '#b9472c' } }),
    mk('p2', 'Pista laranja', { bg: '#100d0c', surface: '#1b1614', ink: '#fbf3ef', muted: '#b4a49c', accent: '#ff5a1f', accent2: '#ffb000', onAccent: '#100d0c', line: '#332925', fx: ['#ff5a1f', '#ffb000', '#ffffff'], extra: { track: '#c2452a' } }),
    mk('p3', 'Azul elétrico', { bg: '#080c18', surface: '#111833', ink: '#eef3ff', muted: '#97a6c9', accent: '#3d86ff', accent2: '#7cf5ff', onAccent: '#ffffff', line: '#22305a', fx: ['#3d86ff', '#7cf5ff', '#d4ff1e'], extra: { track: '#2e4a8a' } }),
    mk('p4', 'Dia claro', { bg: '#f2f3ef', surface: '#ffffff', ink: '#111316', muted: '#5d636b', accent: '#ff4d17', accent2: '#1d1f22', onAccent: '#ffffff', line: '#1113161f', fx: ['#ff4d17', '#c8f000', '#1d1f22'], extra: { track: '#d9603f' } }),
  ],
  // Moda: editorial de revista.
  atelier: [
    mk('p1', 'Areia', { bg: '#f3eee7', surface: '#fffdf9', ink: '#161412', muted: '#6f675f', accent: '#161412', accent2: '#b4553a', onAccent: '#f3eee7', line: '#16141226', fx: ['#e7dccc', '#d6c1a3', '#b4553a'] }),
    mk('p2', 'Noite', { bg: '#0f0e0d', surface: '#191715', ink: '#f2ede6', muted: '#a59d93', accent: '#f2ede6', accent2: '#c9a27e', onAccent: '#0f0e0d', line: '#f2ede62b', fx: ['#2b2622', '#3a302a', '#c9a27e'] }),
    mk('p3', 'Rosa seco', { bg: '#f4e7e4', surface: '#fffaf8', ink: '#2a1418', muted: '#7a5e62', accent: '#6b2d3a', accent2: '#c98a7a', onAccent: '#fff6f4', line: '#2a141826', fx: ['#ecd2cc', '#e2bdb3', '#6b2d3a'] }),
    mk('p4', 'Oliva', { bg: '#ecebe1', surface: '#fbfbf6', ink: '#1c2015', muted: '#62664f', accent: '#3d4a2c', accent2: '#b48a3c', onAccent: '#f6f5ec', line: '#1c201526', fx: ['#dcdcc8', '#c9c8a8', '#3d4a2c'] }),
  ],
  // Padaria: massa, casca de pão e toldo listrado.
  forno: [
    mk('p1', 'Massa e casca', { bg: '#f8efe2', surface: '#fffaf2', ink: '#3a2516', muted: '#7b6250', accent: '#a9471a', accent2: '#e8a34a', line: '#3a25161f', fx: ['#f2d7b0', '#e8b77a', '#fff4e1'], extra: { awning: '#a9471a', board: '#2f3a33' } }),
    mk('p2', 'Café com leite', { bg: '#f4ebe1', surface: '#fffaf4', ink: '#2e1e14', muted: '#76604f', accent: '#6b4226', accent2: '#c99a6b', line: '#2e1e141f', fx: ['#ead8c3', '#d9b993', '#fff3e3'], extra: { awning: '#6b4226', board: '#2c2622' } }),
    mk('p3', 'Toldo vermelho', { bg: '#fbf3e8', surface: '#fffbf5', ink: '#3b1d17', muted: '#7d5a50', accent: '#b8322a', accent2: '#f2c14e', line: '#3b1d171f', fx: ['#f6dcc0', '#f2c14e', '#fff2dc'], extra: { awning: '#b8322a', board: '#263129' } }),
    mk('p4', 'Verde vintage', { bg: '#f3efe3', surface: '#fffcf3', ink: '#1f2e26', muted: '#5f6b62', accent: '#2c6a4d', accent2: '#e3a857', line: '#1f2e261f', fx: ['#e3dcc4', '#e9c48a', '#fbf4e2'], extra: { awning: '#2c6a4d', board: '#2a2f2c' } }),
  ],
  // Imobiliária: planta baixa, marinho e dourado.
  planta: [
    mk('p1', 'Marinho e dourado', { bg: '#f5f6f8', surface: '#ffffff', ink: '#0e1a2b', muted: '#596475', accent: '#0f2b4a', accent2: '#c49a4c', line: '#0e1a2b1a', fx: ['#dfe6ef', '#c49a4c', '#0f2b4a'] }),
    mk('p2', 'Verde jardim', { bg: '#f3f6f3', surface: '#ffffff', ink: '#13241c', muted: '#56665d', accent: '#1d5a43', accent2: '#c9a45a', line: '#13241c1a', fx: ['#dbe7df', '#c9a45a', '#1d5a43'] }),
    mk('p3', 'Grafite', { bg: '#101317', surface: '#181c22', ink: '#eef1f4', muted: '#9aa3ae', accent: '#d1a85a', accent2: '#eef1f4', onAccent: '#101317', line: '#eef1f41f', fx: ['#1d242d', '#d1a85a', '#3a4552'] }),
    mk('p4', 'Terracota', { bg: '#f8f3ee', surface: '#ffffff', ink: '#2b1a12', muted: '#73604f', accent: '#9c4126', accent2: '#2b4a5c', line: '#2b1a121a', fx: ['#efdccd', '#2b4a5c', '#9c4126'] }),
  ],
  // Loja de carros: showroom escuro.
  garagem: [
    mk('p1', 'Vermelho', { bg: '#0b0c0e', surface: '#15171b', ink: '#f3f4f6', muted: '#9ba1ab', accent: '#e8160c', accent2: '#ff7a3d', line: '#262a31', fx: ['#e8160c', '#ff9a3d', '#c8d1dc'] }),
    mk('p2', 'Prata', { bg: '#0d0f12', surface: '#171a1f', ink: '#f2f4f7', muted: '#a0a7b2', accent: '#c9d2dd', accent2: '#6f7c8d', onAccent: '#0d0f12', line: '#2a2f37', fx: ['#c9d2dd', '#6f7c8d', '#ffffff'] }),
    mk('p3', 'Azul', { bg: '#070b14', surface: '#101827', ink: '#eef3fb', muted: '#97a4ba', accent: '#2a72ff', accent2: '#5ad1ff', line: '#1d2a44', fx: ['#2a72ff', '#5ad1ff', '#d8e6ff'] }),
    mk('p4', 'Amarelo', { bg: '#0c0c0b', surface: '#171715', ink: '#f6f5f0', muted: '#a8a69c', accent: '#ffc400', accent2: '#ff8a00', onAccent: '#0c0c0b', line: '#2d2c27', fx: ['#ffc400', '#ff8a00', '#fff3c4'] }),
  ],
  // Produtos naturais: papel kraft, sálvia e terracota.
  raiz: [
    mk('p1', 'Kraft e sálvia', { bg: '#efe5d2', surface: '#f8f1e3', ink: '#2b3722', muted: '#66664c', accent: '#4a7536', accent2: '#c8743f', line: '#2b37222b', fx: ['#a8c686', '#e6c48a', '#7a9a5a'] }),
    mk('p2', 'Terra', { bg: '#f1e6d6', surface: '#faf3e8', ink: '#3a2518', muted: '#7a6150', accent: '#9a4d24', accent2: '#6f8a3c', line: '#3a25182b', fx: ['#d9a77c', '#b5c98a', '#e8c28a'] }),
    mk('p3', 'Mel', { bg: '#f6ecd6', surface: '#fdf6e6', ink: '#33280f', muted: '#76684a', accent: '#8a5a00', accent2: '#4a7536', line: '#33280f2b', fx: ['#f2c76a', '#c9d89a', '#f7e2a8'] }),
    mk('p4', 'Mata', { bg: '#1c251a', surface: '#253022', ink: '#f1ead8', muted: '#b4b39a', accent: '#b5d68a', accent2: '#e0a96a', onAccent: '#1c251a', line: '#f1ead826', fx: ['#3d5a32', '#b5d68a', '#e0a96a'] }),
  ],
  // Ótica: tabela de exame de vista (branco clínico e a linha vermelha da tabela).
  lente: [
    mk('p1', 'Azul óptico', { bg: '#f3f6fa', surface: '#ffffff', ink: '#0c1b2e', muted: '#55657a', accent: '#1747d1', accent2: '#e0452b', line: '#0c1b2e1c', fx: ['#1747d1', '#e0452b', '#7a8ba3'] }),
    mk('p2', 'Tartaruga', { bg: '#f7f1e9', surface: '#fffdf9', ink: '#2a1a10', muted: '#76604e', accent: '#8a4a1c', accent2: '#c9502c', line: '#2a1a101c', fx: ['#8a4a1c', '#c9502c', '#b59a7c'] }),
    mk('p3', 'Preto fosco', { bg: '#0f1012', surface: '#18191c', ink: '#f2f3f5', muted: '#9ea3ab', accent: '#f2f3f5', accent2: '#ff5a3c', onAccent: '#0f1012', line: '#f2f3f521', fx: ['#f2f3f5', '#ff5a3c', '#5d636d'] }),
    mk('p4', 'Menta', { bg: '#eef7f3', surface: '#ffffff', ink: '#0f2a22', muted: '#4e6a60', accent: '#0d7356', accent2: '#e26a2c', line: '#0f2a221c', fx: ['#0d7356', '#e26a2c', '#8aa79c'] }),
  ],
  // Floricultura: papel de seda, pétala e folha.
  flora: [
    mk('p1', 'Rosa e folha', { bg: '#fbf1ee', surface: '#fffaf8', ink: '#33191f', muted: '#7a5e64', accent: '#ad3557', accent2: '#5b8a4a', line: '#33191f1f', fx: ['#f2a7b8', '#9cc58a', '#f7d27a'] }),
    mk('p2', 'Lavanda', { bg: '#f5f1fa', surface: '#fdfbff', ink: '#2a1f3d', muted: '#6a5d80', accent: '#6c4bb0', accent2: '#6f9a55', line: '#2a1f3d1f', fx: ['#c9b3ee', '#a9cf8f', '#f4c6dd'] }),
    mk('p3', 'Girassol', { bg: '#fcf5e2', surface: '#fffcf2', ink: '#2e2410', muted: '#73664a', accent: '#a65a06', accent2: '#4f7a3a', line: '#2e24101f', fx: ['#f7c948', '#9cc58a', '#f08a4b'] }),
    mk('p4', 'Jardim à noite', { bg: '#16201a', surface: '#1f2b23', ink: '#f6ece6', muted: '#b7b0a6', accent: '#f2a7b8', accent2: '#b5d68a', onAccent: '#16201a', line: '#f6ece621', fx: ['#f2a7b8', '#b5d68a', '#f7d27a'] }),
  ],
  // Material de construção: faixa zebrada, concreto e amarelo de obra.
  obra: [
    mk('p1', 'Amarelo obra', { bg: '#efede7', surface: '#ffffff', ink: '#1a1a17', muted: '#5f5d55', accent: '#ffc414', accent2: '#1a1a17', onAccent: '#1a1a17', line: '#1a1a1726', fx: ['#b5512d', '#cf6a3d', '#8f3f22'], extra: { tape: '#ffd21a' } }),
    mk('p2', 'Laranja cone', { bg: '#f1eee9', surface: '#ffffff', ink: '#1d1a17', muted: '#625b53', accent: '#ff6a13', accent2: '#1d1a17', onAccent: '#1d1a17', line: '#1d1a1726', fx: ['#b5512d', '#cf6a3d', '#8f3f22'], extra: { tape: '#ffd21a' } }),
    mk('p3', 'Azul ferramenta', { bg: '#eef0f3', surface: '#ffffff', ink: '#121a26', muted: '#56606e', accent: '#1f5fbf', accent2: '#ffc414', line: '#121a2626', fx: ['#b5512d', '#cf6a3d', '#8f3f22'], extra: { tape: '#ffd21a' } }),
    mk('p4', 'Concreto', { bg: '#1b1c1d', surface: '#25272a', ink: '#f1efe8', muted: '#aaa79e', accent: '#ffc414', accent2: '#f1efe8', onAccent: '#1b1c1d', line: '#f1efe824', fx: ['#a24a2a', '#c4643a', '#7d3720'], extra: { tape: '#ffd21a' } }),
  ],
  // Advocacia e contabilidade: papel timbrado, marinho e dourado.
  oficio: [
    mk('p1', 'Marinho', { bg: '#f6f3ec', surface: '#fffdf8', ink: '#14213a', muted: '#5b6476', accent: '#14213a', accent2: '#9a7a2e', onAccent: '#f6f3ec', line: '#14213a24', fx: ['#14213a', '#9a7a2e', '#5b6476'] }),
    mk('p2', 'Bordô', { bg: '#f7f2ee', surface: '#fffcf9', ink: '#2a1418', muted: '#6e5a5d', accent: '#6e1f2e', accent2: '#9a7a2e', onAccent: '#f7f2ee', line: '#2a141824', fx: ['#6e1f2e', '#9a7a2e', '#6e5a5d'] }),
    mk('p3', 'Verde garrafa', { bg: '#f3f4ef', surface: '#fcfdf8', ink: '#13261f', muted: '#56665e', accent: '#1f4a3a', accent2: '#9a7a2e', onAccent: '#f3f4ef', line: '#13261f24', fx: ['#1f4a3a', '#9a7a2e', '#56665e'] }),
    mk('p4', 'Grafite', { bg: '#141619', surface: '#1c1f23', ink: '#ece8df', muted: '#a7a39a', accent: '#c9a861', accent2: '#c9a861', onAccent: '#141619', line: '#ece8df24', fx: ['#ece8df', '#c9a861', '#7d7a73'] }),
  ],
  // Restaurante: toalha xadrez de cantina.
  mesa: [
    mk('p1', 'Toalha vermelha', { bg: '#fbf6ee', surface: '#ffffff', ink: '#2b1a12', muted: '#7a6352', accent: '#b8322a', accent2: '#3d7a3a', line: '#2b1a121f', fx: ['#5fa83f', '#79be52', '#d9472b'], extra: { cloth: '#c0392b' } }),
    mk('p2', 'Azul boteco', { bg: '#f6f4ee', surface: '#ffffff', ink: '#14223a', muted: '#5d6676', accent: '#1f4e8c', accent2: '#d99a1e', line: '#14223a1f', fx: ['#5fa83f', '#79be52', '#f2b705'], extra: { cloth: '#2a5ea8' } }),
    mk('p3', 'Verde ervas', { bg: '#f5f6ee', surface: '#ffffff', ink: '#1b2a18', muted: '#5c6857', accent: '#2f6b3a', accent2: '#c8452b', line: '#1b2a181f', fx: ['#5fa83f', '#8f9a3c', '#d9472b'], extra: { cloth: '#3d7a3a' } }),
    mk('p4', 'Cantina à noite', { bg: '#1a1411', surface: '#251c17', ink: '#f6ebdd', muted: '#c1ab95', accent: '#e8a33d', accent2: '#e05a3a', onAccent: '#1a1411', line: '#f6ebdd21', fx: ['#79be52', '#e8a33d', '#e05a3a'], extra: { cloth: '#8a2a1f' } }),
  ],
  // Açaí e sorveteria: calda escorrendo.
  tigela: [
    mk('p1', 'Açaí', { bg: '#f7f0fb', surface: '#ffffff', ink: '#2a0f3a', muted: '#6b5480', accent: '#5b1a7a', accent2: '#ff4f8b', line: '#2a0f3a1f', fx: ['#ff4f8b', '#ffd23f', '#7ad3a8'], extra: { calda: '#4a1066' } }),
    mk('p2', 'Morango', { bg: '#fff3f5', surface: '#ffffff', ink: '#3a0f1c', muted: '#7d5560', accent: '#c81e4b', accent2: '#5b1a7a', line: '#3a0f1c1f', fx: ['#ff7aa8', '#ffd23f', '#7ad3a8'], extra: { calda: '#a8123c' } }),
    mk('p3', 'Pistache e chocolate', { bg: '#effaf5', surface: '#ffffff', ink: '#14281f', muted: '#52685d', accent: '#1c7a5c', accent2: '#ff7aa8', line: '#14281f1f', fx: ['#ff7aa8', '#ffd23f', '#a46a44'], extra: { calda: '#5b341c' } }),
    mk('p4', 'Noite roxa', { bg: '#1a0b24', surface: '#261334', ink: '#fbefff', muted: '#c2a9d1', accent: '#ffd23f', accent2: '#ff4f8b', onAccent: '#1a0b24', line: '#fbefff21', fx: ['#ff4f8b', '#ffd23f', '#7ad3a8'], extra: { calda: '#8a2ab8' } }),
  ],
  // Adega: rótulo de vinho; labelink é a cor do nome no rótulo de papel.
  safra: [
    mk('p1', 'Tinto', { bg: '#170e11', surface: '#22151a', ink: '#f4ead9', muted: '#bfa999', accent: '#c9a45c', accent2: '#8c1c32', onAccent: '#170e11', line: '#f4ead91f', fx: ['#f4dfa6', '#c9a45c', '#ffffff'], extra: { labelink: '#6b1426' } }),
    mk('p2', 'Branco e ouro', { bg: '#f6f0e4', surface: '#fffaf0', ink: '#2a1d16', muted: '#76665a', accent: '#7a1d2e', accent2: '#b08a3e', line: '#2a1d161f', fx: ['#e9d9a8', '#b08a3e', '#ffffff'], extra: { labelink: '#7a1d2e' } }),
    mk('p3', 'Rosé', { bg: '#f8ecea', surface: '#fffaf8', ink: '#3a1a20', muted: '#7d5c62', accent: '#a83a52', accent2: '#c99a6b', line: '#3a1a201f', fx: ['#f6c8cf', '#e8a3b0', '#ffffff'], extra: { labelink: '#a83a52' } }),
    mk('p4', 'Cerveja', { bg: '#14100a', surface: '#1f1810', ink: '#f7ecd6', muted: '#bca88a', accent: '#f2a51a', accent2: '#5a3a12', onAccent: '#14100a', line: '#f7ecd61f', fx: ['#ffd77a', '#f2a51a', '#fff4d6'], extra: { labelink: '#7a4a0c' } }),
  ],
  // Unhas e cílios: cores de esmalte.
  esmalte: [
    mk('p1', 'Nude', { bg: '#fbf3ef', surface: '#ffffff', ink: '#3a2420', muted: '#80625a', accent: '#b84a62', accent2: '#e8b4a0', line: '#3a24201c', fx: ['#e8b4a0', '#d98a8a', '#f3d6c8'] }),
    mk('p2', 'Vermelho clássico', { bg: '#fff5f4', surface: '#ffffff', ink: '#2e1013', muted: '#7a5558', accent: '#c8102e', accent2: '#f6c1c1', line: '#2e10131c', fx: ['#e2313f', '#8a0f1f', '#f6c1c1'] }),
    mk('p3', 'Lilás', { bg: '#f7f2fd', surface: '#ffffff', ink: '#2a1d40', muted: '#695b80', accent: '#7b4fd0', accent2: '#c7b2f2', line: '#2a1d401c', fx: ['#b89cf0', '#e9a8d8', '#8fd3e8'] }),
    mk('p4', 'Preto e dourado', { bg: '#121012', surface: '#1c191c', ink: '#f5ede6', muted: '#b5a9a3', accent: '#d4af5a', accent2: '#3a3236', onAccent: '#121012', line: '#f5ede621', fx: ['#d4af5a', '#e8c9c0', '#8a2b3a'] }),
  ],
  // Estética: spa calmo, vidro fosco.
  serena: [
    mk('p1', 'Areia e sálvia', { bg: '#f4f1ea', surface: '#fbfaf6', ink: '#2c3329', muted: '#6a7066', accent: '#56704f', accent2: '#c9a98a', line: '#2c33291c', fx: ['#f1d9cf', '#dfe8d6', '#ffffff'] }),
    mk('p2', 'Rosé', { bg: '#faf2ef', surface: '#fffbfa', ink: '#3a2a2a', muted: '#7a6565', accent: '#a0596a', accent2: '#d9b8a8', line: '#3a2a2a1c', fx: ['#f6d2d6', '#f0e0d6', '#ffffff'] }),
    mk('p3', 'Água', { bg: '#eff6f6', surface: '#fbfefe', ink: '#16302f', muted: '#566c6b', accent: '#2a7671', accent2: '#a9cfcb', line: '#16302f1c', fx: ['#d0ecea', '#e6f1f3', '#ffffff'] }),
    mk('p4', 'Noite', { bg: '#141716', surface: '#1c201f', ink: '#eef0ea', muted: '#a6aca5', accent: '#c9b28a', accent2: '#7e9a7a', onAccent: '#141716', line: '#eef0ea21', fx: ['#c9b28a', '#7e9a7a', '#eef0ea'] }),
  ],
  // Pilates e yoga: tons de tapetinho.
  fluxo: [
    mk('p1', 'Sálvia', { bg: '#f2f4ee', surface: '#ffffff', ink: '#24302a', muted: '#5f6b63', accent: '#466f58', accent2: '#e3b48a', line: '#24302a1c', fx: ['#cfe2d4', '#f2dcc6', '#e3e9f4'] }),
    mk('p2', 'Terracota', { bg: '#f8f0e8', surface: '#ffffff', ink: '#3a2418', muted: '#78604f', accent: '#a9532f', accent2: '#7a9a7e', line: '#3a24181c', fx: ['#f2cdb5', '#d9e4d4', '#f6e4d6'] }),
    mk('p3', 'Lavanda', { bg: '#f4f1fa', surface: '#ffffff', ink: '#2b2440', muted: '#655d80', accent: '#6b58b0', accent2: '#e6a7c0', line: '#2b24401c', fx: ['#ddd3f3', '#f6d6e4', '#d6ecef'] }),
    mk('p4', 'Oceano', { bg: '#eef4f7', surface: '#ffffff', ink: '#13293a', muted: '#526878', accent: '#1d6a8f', accent2: '#f0a86a', line: '#13293a1c', fx: ['#cfe5f0', '#f6ddc8', '#dcefe9'] }),
  ],
  // Terapias: formas orgânicas e cores calmas.
  cuidar: [
    mk('p1', 'Lilás calmo', { bg: '#f7f4fb', surface: '#ffffff', ink: '#2b2340', muted: '#665d7d', accent: '#6a52b3', accent2: '#2f9884', line: '#2b23401c', fx: ['#e3dbf6', '#cfeee6', '#f6e2ea'] }),
    mk('p2', 'Menta', { bg: '#f1f8f5', surface: '#ffffff', ink: '#16302a', muted: '#53695f', accent: '#1e7a62', accent2: '#d9784a', line: '#16302a1c', fx: ['#cdeee2', '#f6dcc8', '#e3f1ec'] }),
    mk('p3', 'Pêssego', { bg: '#fdf4ee', surface: '#ffffff', ink: '#3a2418', muted: '#7a6052', accent: '#b8572f', accent2: '#4f8496', line: '#3a24181c', fx: ['#f8d6c2', '#d2e6ec', '#fbe7dc'] }),
    mk('p4', 'Azul sereno', { bg: '#f1f5fb', surface: '#ffffff', ink: '#152640', muted: '#56627a', accent: '#2e5fae', accent2: '#d9952a', line: '#1526401c', fx: ['#d5e2f6', '#f6e2c0', '#e6eefa'] }),
  ],
  // Veterinária: plaquinha de coleira.
  patas: [
    mk('p1', 'Azul', { bg: '#f2f7fc', surface: '#ffffff', ink: '#11243a', muted: '#52647a', accent: '#1f68c8', accent2: '#ffb347', line: '#11243a1c', fx: ['#1f68c8', '#ffb347', '#9cc4f2'] }),
    mk('p2', 'Verde', { bg: '#f2f8f1', surface: '#ffffff', ink: '#16301a', muted: '#53695a', accent: '#2c7d38', accent2: '#ff9f6b', line: '#16301a1c', fx: ['#2c7d38', '#ff9f6b', '#a8d8a8'] }),
    mk('p3', 'Laranja', { bg: '#fff6ee', surface: '#ffffff', ink: '#3a1f0e', muted: '#7a6050', accent: '#c4561a', accent2: '#3a8fd1', line: '#3a1f0e1c', fx: ['#c4561a', '#3a8fd1', '#f8c8a0'] }),
    mk('p4', 'Roxo', { bg: '#f7f3fc', surface: '#ffffff', ink: '#25183f', muted: '#62577c', accent: '#7140c0', accent2: '#ffc145', line: '#25183f1c', fx: ['#7140c0', '#ffc145', '#cdb6f0'] }),
  ],
  // Oficina: painel do carro, chapa de metal.
  motor: [
    mk('p1', 'Vermelho e grafite', { bg: '#111214', surface: '#1b1d21', ink: '#f1f2f4', muted: '#9da2aa', accent: '#e2231a', accent2: '#ffb020', line: '#2b2e34', fx: ['#ffb020', '#ff6a00', '#ffffff'] }),
    mk('p2', 'Laranja', { bg: '#121110', surface: '#1d1b19', ink: '#f4f1ee', muted: '#a8a29b', accent: '#ff7a00', accent2: '#ffd23f', onAccent: '#121110', line: '#2e2b27', fx: ['#ffd23f', '#ff7a00', '#ffffff'] }),
    mk('p3', 'Azul', { bg: '#0d1118', surface: '#161c26', ink: '#eef2f8', muted: '#97a2b4', accent: '#2f7bff', accent2: '#ffb020', line: '#263041', fx: ['#ffb020', '#7ab0ff', '#ffffff'] }),
    mk('p4', 'Verde', { bg: '#0f1210', surface: '#191d1a', ink: '#eff3ef', muted: '#9aa59c', accent: '#3fbf52', accent2: '#ffd23f', onAccent: '#0f1210', line: '#29302a', fx: ['#ffd23f', '#3fbf52', '#ffffff'] }),
  ],
  // Lava-car: letreiro de neon à noite.
  brilho: [
    mk('p1', 'Neon azul', { bg: '#0a0f1e', surface: '#121a30', ink: '#eef6ff', muted: '#9fb0cf', accent: '#2ad4ff', accent2: '#ff4fd8', onAccent: '#0a0f1e', line: '#22304f', fx: ['#bfe9ff', '#2ad4ff', '#ffffff'] }),
    mk('p2', 'Neon rosa', { bg: '#140a1a', surface: '#20122a', ink: '#fff0fa', muted: '#c8a6c0', accent: '#ff3fa4', accent2: '#2ad4ff', onAccent: '#140a1a', line: '#3a2246', fx: ['#ffd0ea', '#ff3fa4', '#ffffff'] }),
    mk('p3', 'Verde água', { bg: '#07141a', surface: '#0f2129', ink: '#eafffa', muted: '#94b8b2', accent: '#2bffc6', accent2: '#ffd23f', onAccent: '#07141a', line: '#1d3a42', fx: ['#c8fff0', '#2bffc6', '#ffffff'] }),
    mk('p4', 'Amarelo', { bg: '#12100a', surface: '#1e1b12', ink: '#fffbea', muted: '#bdb497', accent: '#ffd400', accent2: '#2ad4ff', onAccent: '#12100a', line: '#3a3420', fx: ['#fff3b0', '#ffd400', '#ffffff'] }),
  ],
  // Loja de presentes: papel de presente e laço.
  presente: [
    mk('p1', 'Vermelho presente', { bg: '#fff7f2', surface: '#ffffff', ink: '#2e1414', muted: '#7a5a56', accent: '#c92a35', accent2: '#f2b632', line: '#2e14141c', fx: ['#c92a35', '#f2b632', '#2a9d8f'] }),
    mk('p2', 'Azul', { bg: '#f3f7ff', surface: '#ffffff', ink: '#121f3d', muted: '#56627e', accent: '#2557d6', accent2: '#ff8a3d', line: '#121f3d1c', fx: ['#2557d6', '#ff8a3d', '#ffd23f'] }),
    mk('p3', 'Menta', { bg: '#effaf6', surface: '#ffffff', ink: '#123028', muted: '#53695f', accent: '#12806a', accent2: '#ff6f91', line: '#1230281c', fx: ['#12806a', '#ff6f91', '#ffd23f'] }),
    mk('p4', 'Rosa', { bg: '#fff3f8', surface: '#ffffff', ink: '#3a1028', muted: '#7d5a6c', accent: '#cc2f74', accent2: '#ffc53d', line: '#3a10281c', fx: ['#cc2f74', '#ffc53d', '#5bc0eb'] }),
  ],
};

const DARK = new Set<MiniTheme>(['elegance', 'brasa', 'navalha', 'impulso', 'pace', 'garagem', 'safra', 'motor', 'brilho']);

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
    case 'pace': case 'garagem': set(accent, fromHsl(h + 40, 90, 60), fromHsl(h + 180, 70, 70)); break;
    case 'atelier': v['--accent2'] = fromHsl(h, 45, 50); set(fromHsl(h, 30, 88), fromHsl(h, 30, 78), accent); break;
    case 'forno': v['--awning'] = accent; set(fromHsl(h, 60, 85), fromHsl(h + 20, 70, 72), fromHsl(h, 70, 94)); break;
    case 'planta': set(fromHsl(h, 25, 90), fromHsl(h + 35, 55, 60), accent); break;
    case 'raiz': set(fromHsl(h, 40, 66), fromHsl(h + 40, 60, 72), fromHsl(h - 20, 35, 52)); break;
    case 'lente': v['--accent2'] = fromHsl(h + 180, 75, 52); set(accent, fromHsl(h + 180, 75, 52), fromHsl(h, 15, 58)); break;
    case 'flora': set(fromHsl(h, 70, 78), fromHsl(h + 120, 35, 68), fromHsl(h + 40, 85, 72)); break;
    case 'obra': break;
    case 'oficio': v['--accent2'] = fromHsl(43, 54, 39); set(accent, fromHsl(43, 54, 39), fromHsl(h, 12, 45)); break;
    case 'mesa': v['--cloth'] = fromHsl(h, Math.min(80, s), 46); break;
    case 'tigela': v['--calda'] = fromHsl(h, Math.min(85, s), 26); set(fromHsl(h + 40, 95, 66), fromHsl(48, 100, 62), fromHsl(150, 50, 65)); break;
    case 'safra': v['--labelink'] = fromHsl(h, Math.min(80, s), 30); set(fromHsl(h, 70, 82), accent, '#ffffff'); break;
    case 'esmalte': set(fromHsl(h + 25, 60, 72), fromHsl(h - 25, 55, 62), fromHsl(h, 50, 88)); break;
    case 'serena': case 'cuidar': case 'fluxo': set(fromHsl(h, 45, 90), fromHsl(h + 50, 35, 88), fromHsl(h - 40, 40, 92)); break;
    case 'patas': case 'presente': set(accent, fromHsl(h + 150, 85, 62), fromHsl(h, 60, 80)); break;
    case 'motor': set(fromHsl(h + 30, 100, 60), accent, '#ffffff'); break;
    case 'brilho': set(fromHsl(h, 90, 88), accent, '#ffffff'); break;
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
