import { getEditorPassword, clearEditorPassword } from '@/lib/auth/session';
import { ApiError } from './types';

const BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');

export function getApiBase(): string {
  return BASE;
}

export function assertApiConfigured(): void {
  if (!BASE) {
    throw new ApiError(
      0,
      'NEXT_PUBLIC_API_BASE_URL is not set. Copy .env.local.example to .env.local and fill it in, or set the Actions variable before deploying.',
    );
  }
}

type RequestOpts = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  /** Force-attach the editor password even on a GET (used by the login probe). */
  authForRead?: boolean;
  signal?: AbortSignal;
};

function buildUrl(path: string, query?: RequestOpts['query']): string {
  assertApiConfigured();
  const url = new URL(BASE + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === '') continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function apiRequest<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const method = opts.method ?? 'GET';
  const headers: Record<string, string> = { Accept: 'application/json' };
  const isWrite = method !== 'GET';

  if (isWrite || opts.authForRead) {
    const pwd = getEditorPassword();
    if (!pwd) {
      throw new ApiError(401, 'No editor password in session.');
    }
    headers['X-Editor-Password'] = pwd;
  }

  const init: RequestInit = { method, headers, signal: opts.signal };
  if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(opts.body);
  }

  const res = await fetch(buildUrl(path, opts.query), init);

  if (res.status === 204) {
    return undefined as T;
  }

  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    if (res.status === 401 && isWrite) {
      // Stale or wrong password — boot the editor back to login.
      clearEditorPassword();
    }
    const msg =
      (body && typeof body === 'object' && 'error' in body && typeof (body as { error: unknown }).error === 'string'
        ? (body as { error: string }).error
        : null) ?? `${method} ${path} failed: ${res.status}`;
    throw new ApiError(res.status, msg, body);
  }

  return body as T;
}
