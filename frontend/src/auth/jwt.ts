import type { Role } from '../api/types';

export interface SessionUser {
  userId: number;
  role: Role;
  studentId: number | null;
  expiresAt: number;
}

export function decodeToken(token: string): SessionUser | null {
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '='));
    const payload = JSON.parse(json) as { sub?: number; role?: Role; studentId?: number | null; exp?: number };
    if (typeof payload.sub !== 'number' || (payload.role !== 'ADMIN' && payload.role !== 'STUDENT')) {
      return null;
    }
    return {
      userId: payload.sub,
      role: payload.role,
      studentId: payload.studentId ?? null,
      expiresAt: (payload.exp ?? 0) * 1000,
    };
  } catch {
    return null;
  }
}

export function isExpired(user: SessionUser, now: number = Date.now()): boolean {
  return user.expiresAt > 0 && user.expiresAt <= now;
}
