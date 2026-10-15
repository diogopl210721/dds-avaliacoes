// Visual próprio de cada ramo: como a capa é montada e como a lista de produtos/serviços aparece.
// Os 9 modelos gerais (brasa, aura, ..., essencial) não têm entrada aqui e continuam como sempre.
// Arquivo leve: entra no runtime das páginas públicas.
import type { MiniTheme } from './miniPage';

// Capa:
//  poster    foto de ponta a ponta, título enorme inclinado e painel de números (corrida)
//  magazine  capa de revista: nome como logotipo da revista e foto em retrato (moda)
//  arch      vitrine de padaria: toldo listrado, placa com o nome e foto numa janela em arco (padaria)
//  split     foto grande com cartão de busca por cima (imobiliária)
//  showroom  carro em destaque com holofote, reflexo no piso e o nome numa placa (loja de carros)
//  seal      selo redondo com texto girando em volta da foto, papel kraft (produtos naturais)
export type HeroKind = 'poster' | 'magazine' | 'arch' | 'split' | 'showroom' | 'seal';
// Lista:
//  lanes     raias de pista numeradas (planos de treino)
//  lookbook  grade de fotos em retrato, como um catálogo de moda
//  shelf     prateleira com etiqueta de preço pendurada
//  fichas    fichas de imóvel com preço em destaque e características
//  garage    vitrine de carros para deslizar, com ano, km e preço
//  tags      etiquetas de papel kraft com barbante
export type ListKind = 'lanes' | 'lookbook' | 'shelf' | 'fichas' | 'garage' | 'tags';

export type Look = {
  hero: HeroKind; list: ListKind;
  // Texto do botão de cada item e a mensagem do WhatsApp ({item} vira o nome).
  itemCta: string; itemMessage: string;
  // Números (stats) na capa em vez de no meio da página.
  heroStats?: boolean;
};

export const LOOKS: Partial<Record<MiniTheme, Look>> = {
  pace: { hero: 'poster', list: 'lanes', heroStats: true, itemCta: 'Quero esse plano', itemMessage: 'Olá! Quero saber mais sobre o plano {item}.' },
  atelier: { hero: 'magazine', list: 'lookbook', itemCta: 'Quero esta peça', itemMessage: 'Olá! Tenho interesse na peça {item}. Tem no meu tamanho?' },
  forno: { hero: 'arch', list: 'shelf', itemCta: 'Encomendar', itemMessage: 'Olá! Quero encomendar: {item}.' },
  planta: { hero: 'split', list: 'fichas', itemCta: 'Agendar visita', itemMessage: 'Olá! Quero agendar uma visita: {item}.' },
  garagem: { hero: 'showroom', list: 'garage', itemCta: 'Simular financiamento', itemMessage: 'Olá! Quero simular o financiamento do {item}.' },
  raiz: { hero: 'seal', list: 'tags', itemCta: 'Quero este', itemMessage: 'Olá! Quero saber do {item}.' },
};

// "3 quartos · 2 vagas · 120 m²" vira uma lista de características (fichas, carros, planos).
export function specParts(text: string): string[] | null {
  const parts = text.split(/\s*[·•|]\s*/).map(s => s.trim()).filter(Boolean);
  return parts.length >= 2 && parts.length <= 6 && parts.every(p => p.length <= 32) ? parts : null;
}
