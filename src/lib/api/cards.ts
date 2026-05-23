import { apiRequest } from './client';
import {
  CardsPageSchema,
  LibraryCardSchema,
  BulkUpdateResponseSchema,
} from './schemas';
import type { CardsPage, LibraryCard, ListCardsParams } from './types';

export async function listCards(params: ListCardsParams = {}): Promise<CardsPage> {
  const raw = await apiRequest<unknown>('/cards', {
    query: {
      theme: params.theme,
      author: params.author,
      status: params.status,
      limit: params.limit ?? 100,
      cursor: params.cursor ?? undefined,
    },
  });
  return CardsPageSchema.parse(raw);
}

/**
 * Full-library text search. Matches the needle (case-insensitive) against
 * `text` and `author` server-side; cursor is always null because results
 * are served from the Lambda's in-memory card cache.
 */
export async function searchCards(q: string, limit = 100): Promise<CardsPage> {
  const raw = await apiRequest<unknown>('/cards/search', {
    query: { q, limit },
  });
  return CardsPageSchema.parse(raw);
}

export async function getCard(cardId: string): Promise<LibraryCard> {
  const raw = await apiRequest<unknown>(`/cards/${encodeURIComponent(cardId)}`);
  return LibraryCardSchema.parse(raw);
}

/** Fields editors are allowed to set on POST / PATCH — mirrors EDITABLE_FIELDS in handler.py. */
export type EditableCardFields = {
  theme?: string;
  themeTitle?: string;
  type?: string;
  dzType?: string;
  status?: string;
  text?: string;
  author?: string;
  articleUrl?: string | null;
  latestBgImageUrl?: string;
  latestDzImageUrl?: string;
  primaryCTAText?: string;
  sharePrefix?: string;
  firstUsedOn?: string;
  lastUsedOn?: string;
  usageCount?: number;
  usageHistory?: string[];
};

export async function createCard(body: EditableCardFields & { theme: string }): Promise<LibraryCard> {
  const raw = await apiRequest<unknown>('/cards', { method: 'POST', body });
  return LibraryCardSchema.parse(raw);
}

export async function updateCard(cardId: string, patch: EditableCardFields): Promise<LibraryCard> {
  const raw = await apiRequest<unknown>(`/cards/${encodeURIComponent(cardId)}`, {
    method: 'PATCH',
    body: patch,
  });
  return LibraryCardSchema.parse(raw);
}

export async function deleteCard(cardId: string): Promise<void> {
  await apiRequest<void>(`/cards/${encodeURIComponent(cardId)}`, { method: 'DELETE' });
}

export async function bulkUpdate(cardIds: string[], patch: EditableCardFields) {
  const raw = await apiRequest<unknown>('/cards/bulk', {
    method: 'POST',
    body: { cardIds, patch },
  });
  return BulkUpdateResponseSchema.parse(raw);
}
