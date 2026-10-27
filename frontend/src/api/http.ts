import type { ApiErrorBody } from './types';

const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const TOKEN_KEY = 'catalog.token';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiErrorBody | null,
  ) {
    super(body?.message ?? (status === 0 ? 'Não foi possível falar com a API' : `Erro ${status}`));
  }
}

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      return;
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      return;
    }
  },
};

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

type QueryValue = string | number | undefined | null;

export function buildQuery(query?: Record<string, QueryValue>): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, QueryValue>;
  acceptStatuses?: number[];
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = tokenStore.get();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}${buildQuery(options.query)}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(0, null);
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  const data = parseBody(text);

  if (!response.ok && !options.acceptStatuses?.includes(response.status)) {
    if (response.status === 401 && token) onUnauthorized?.();
    throw new ApiError(response.status, isErrorBody(data) ? data : null);
  }
  return data as T;
}

export async function requestText(path: string): Promise<string> {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) throw new ApiError(response.status, null);
  return response.text();
}

function parseBody(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null && 'message' in value;
}
