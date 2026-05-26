import type { ListCardsParams } from '@/lib/api/types';

export const queryKeys = {
  themes: ['themes'] as const,
  authors: ['authors'] as const,
  stats: ['stats'] as const,
  cards: (params: ListCardsParams) => ['cards', params] as const,
  card: (cardId: string) => ['cards', cardId] as const,
  months: ['months'] as const,
  month: (year: number, month: number) => ['months', year, month] as const,
  cardsLookup: (ids: readonly string[]) => ['cards', 'lookup', [...ids].sort()] as const,
};
