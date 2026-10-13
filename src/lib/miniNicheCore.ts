// Ramos de negócio do mini site: cada ramo escolhe um modelo, uma combinação de cores e um
// efeito animado próprio na capa. Este arquivo é leve (entra no runtime das páginas públicas);
// as empresas de exemplo ficam em miniNicheDemos.ts.
import type { MiniTheme, PaletteId } from './miniPage';

export type FxKind =
  | 'vapor' | 'temperos' | 'graos' | 'gotas' | 'espumante'
  | 'seda' | 'glitter' | 'petalas' | 'lamina'
  | 'brilho' | 'ondas' | 'pegadas' | 'bolhas'
  | 'impacto' | 'respira' | 'faiscas' | 'chuva'
  | 'brotos' | 'etiquetas' | 'circuito';

export type NicheId =
  | 'pizzaria' | 'restaurante' | 'cafeteria' | 'acai' | 'adega'
  | 'salao' | 'unhas' | 'estetica' | 'barbearia'
  | 'dentista' | 'terapias' | 'veterinaria' | 'petshop'
  | 'academia' | 'pilates' | 'oficina' | 'lavacar'
  | 'jardinagem' | 'loja' | 'assistencia';

export type NicheGroup = 'comida' | 'beleza' | 'saude' | 'movimento' | 'carro' | 'casa';
// Segmento dos textos automáticos (miniAutofill) usado como base para o ramo.
export type NicheSegment = 'gastronomia' | 'beleza' | 'barbearia' | 'saude' | 'fitness' | 'loja' | 'automotivo' | 'pet' | 'servicos';

export type NicheInfo = {
  id: NicheId; label: string; short: string; group: NicheGroup;
  theme: MiniTheme; palette: PaletteId; fx: FxKind; fxLabel: string; listTitle: string; segment: NicheSegment;
};

export const NICHE_GROUPS: { id: NicheGroup; label: string }[] = [
  { id: 'comida', label: 'Comida e bebida' },
  { id: 'beleza', label: 'Beleza' },
  { id: 'saude', label: 'Saúde e animais' },
  { id: 'movimento', label: 'Academias e estúdios' },
  { id: 'carro', label: 'Carro' },
  { id: 'casa', label: 'Casa, loja e serviços' },
];

const n = (id: NicheId, label: string, short: string, group: NicheGroup, theme: MiniTheme, palette: PaletteId, fx: FxKind, fxLabel: string, listTitle: string, segment: NicheSegment): NicheInfo =>
  ({ id, label, short, group, theme, palette, fx, fxLabel, listTitle, segment });

// A ordem é a da vitrine. Todos os IDs precisam estar na lista da função plate-mini (content.ts).
export const NICHES: NicheInfo[] = [
  n('pizzaria', 'Pizzaria e hamburgueria', 'Pizzaria', 'comida', 'brasa', 'p1', 'vapor', 'Vapor saindo do forno', 'Cardápio', 'gastronomia'),
  n('restaurante', 'Restaurante, marmitaria e lanchonete', 'Restaurante', 'comida', 'brasa', 'p3', 'temperos', 'Ervas e temperos no ar', 'Cardápio do dia', 'gastronomia'),
  n('cafeteria', 'Cafeteria, padaria e confeitaria', 'Cafeteria', 'comida', 'elegance', 'p1', 'graos', 'Grãos de café caindo', 'Cardápio', 'gastronomia'),
  n('acai', 'Açaí, sorveteria e doceria', 'Açaí e doces', 'comida', 'viva', 'p2', 'gotas', 'Calda escorrendo e granulado', 'Cardápio', 'gastronomia'),
  n('adega', 'Adega, empório e distribuidora', 'Adega', 'comida', 'elegance', 'p2', 'espumante', 'Bolhas de espumante', 'Rótulos', 'loja'),
  n('salao', 'Salão de beleza', 'Salão', 'beleza', 'aura', 'p1', 'seda', 'Fios de seda em movimento', 'Serviços', 'beleza'),
  n('unhas', 'Unhas, cílios e sobrancelhas', 'Unhas e cílios', 'beleza', 'aura', 'p3', 'glitter', 'Glitter brilhando', 'Serviços', 'beleza'),
  n('estetica', 'Estética e depilação', 'Estética', 'beleza', 'aura', 'p2', 'petalas', 'Pétalas caindo', 'Tratamentos', 'beleza'),
  n('barbearia', 'Barbearia', 'Barbearia', 'beleza', 'navalha', 'p1', 'lamina', 'Brilho de navalha que segue o dedo', 'Serviços', 'barbearia'),
  n('dentista', 'Dentista', 'Dentista', 'saude', 'vital', 'p2', 'brilho', 'Brilho de sorriso limpo', 'Tratamentos', 'saude'),
  n('terapias', 'Fisioterapia, psicologia e nutrição', 'Terapias', 'saude', 'vital', 'p3', 'ondas', 'Ondas calmas', 'Especialidades', 'saude'),
  n('veterinaria', 'Clínica veterinária', 'Veterinária', 'saude', 'vital', 'p4', 'pegadas', 'Patinhas passeando', 'Serviços', 'pet'),
  n('petshop', 'Pet shop, banho e tosa', 'Pet shop', 'saude', 'viva', 'p3', 'bolhas', 'Bolhas de sabão que estouram', 'Serviços', 'pet'),
  n('academia', 'Academia e crossfit', 'Academia', 'movimento', 'impulso', 'p1', 'impacto', 'Ondas de impacto', 'Planos e aulas', 'fitness'),
  n('pilates', 'Pilates, yoga e funcional', 'Pilates e yoga', 'movimento', 'aura', 'p4', 'respira', 'Círculos que respiram', 'Aulas', 'fitness'),
  n('oficina', 'Oficina mecânica e auto center', 'Oficina', 'carro', 'impulso', 'p3', 'faiscas', 'Faíscas de esmerilhadeira', 'Serviços', 'automotivo'),
  n('lavacar', 'Lava-car e estética automotiva', 'Lava-car', 'carro', 'impulso', 'p2', 'chuva', 'Gotas no vidro que o dedo limpa', 'Serviços', 'automotivo'),
  n('jardinagem', 'Jardinagem, paisagismo e floricultura', 'Jardinagem', 'casa', 'refugio', 'p2', 'brotos', 'Plantas brotando', 'Serviços', 'servicos'),
  n('loja', 'Loja de roupas, calçados e presentes', 'Loja', 'casa', 'viva', 'p4', 'etiquetas', 'Etiquetas balançando', 'Novidades', 'loja'),
  n('assistencia', 'Assistência técnica de celular e informática', 'Assistência técnica', 'casa', 'essencial', 'p1', 'circuito', 'Circuito com energia passando', 'Serviços', 'servicos'),
];

export const NICHE_IDS = NICHES.map(x => x.id);
export const nicheById = (id: string | undefined | null): NicheInfo | undefined => NICHES.find(x => x.id === id);
