import { apiRequest } from './client';
import {
  ThemesResponseSchema,
  AuthorsResponseSchema,
  StatsResponseSchema,
} from './schemas';
import type { Stats, ThemeStat, AuthorStat } from './types';

export async function getThemes(): Promise<ThemeStat[]> {
  const raw = await apiRequest<unknown>('/themes');
  return ThemesResponseSchema.parse(raw).themes;
}

export async function getAuthors(): Promise<AuthorStat[]> {
  const raw = await apiRequest<unknown>('/authors');
  return AuthorsResponseSchema.parse(raw).authors;
}

export async function getStats(): Promise<Stats> {
  const raw = await apiRequest<unknown>('/stats');
  return StatsResponseSchema.parse(raw);
}

/** Used by the login probe — forces the password header on a GET. */
export async function probeLogin(): Promise<Stats> {
  const raw = await apiRequest<unknown>('/stats', { authForRead: true });
  return StatsResponseSchema.parse(raw);
}
