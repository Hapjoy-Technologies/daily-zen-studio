import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  listCards,
  getCard,
  createCard,
  updateCard,
  deleteCard,
  type EditableCardFields,
} from '@/lib/api/cards';
import type { CardsPage, LibraryCard, ListCardsParams } from '@/lib/api/types';
import { queryKeys } from './keys';

const PAGE_LIMIT = 200;

export function useInfiniteCards(params: Omit<ListCardsParams, 'cursor' | 'limit'>) {
  return useInfiniteQuery({
    queryKey: queryKeys.cards({ ...params, limit: PAGE_LIMIT }),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      listCards({ ...params, limit: PAGE_LIMIT, cursor: pageParam }),
    getNextPageParam: (lastPage: CardsPage) => lastPage.cursor ?? undefined,
    staleTime: 60_000,
  });
}

export function useCard(cardId: string | undefined) {
  return useQuery({
    queryKey: cardId ? queryKeys.card(cardId) : ['card', 'none'],
    queryFn: () => getCard(cardId as string),
    enabled: Boolean(cardId),
  });
}

export function useCreateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: EditableCardFields & { theme: string }) => createCard(body),
    onSuccess: (created: LibraryCard) => {
      qc.invalidateQueries({ queryKey: ['cards'] });
      qc.setQueryData(queryKeys.card(created.cardId), created);
    },
  });
}

export function useUpdateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, patch }: { cardId: string; patch: EditableCardFields }) =>
      updateCard(cardId, patch),
    onSuccess: (updated: LibraryCard) => {
      qc.setQueryData(queryKeys.card(updated.cardId), updated);
      qc.invalidateQueries({ queryKey: ['cards'] });
    },
  });
}

export function useDeleteCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => deleteCard(cardId),
    onSuccess: (_data, cardId) => {
      qc.removeQueries({ queryKey: queryKeys.card(cardId) });
      qc.invalidateQueries({ queryKey: ['cards'] });
    },
  });
}
