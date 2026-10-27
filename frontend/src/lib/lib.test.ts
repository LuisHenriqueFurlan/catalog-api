import { describe, expect, it } from 'vitest';
import { buildQuery } from '../api/http';
import { decodeToken, isExpired } from '../auth/jwt';
import { formatBytes, formatDuration } from './format';
import { findValue, parsePrometheus, summarizeHttp } from './metrics';

function fakeToken(payload: object): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encode({ alg: 'HS256' })}.${encode(payload)}.assinatura`;
}

describe('decodeToken', () => {
  it('lê sub, role, studentId e exp', () => {
    const user = decodeToken(fakeToken({ sub: 3, role: 'STUDENT', studentId: 7, exp: 2_000_000_000 }));
    expect(user).toEqual({ userId: 3, role: 'STUDENT', studentId: 7, expiresAt: 2_000_000_000_000 });
  });

  it('rejeita token malformado ou com role desconhecida', () => {
    expect(decodeToken('nada')).toBeNull();
    expect(decodeToken(fakeToken({ sub: 1, role: 'ROOT' }))).toBeNull();
  });

  it('detecta expiração', () => {
    const user = decodeToken(fakeToken({ sub: 1, role: 'ADMIN', exp: 100 }))!;
    expect(isExpired(user, 200_000)).toBe(true);
    expect(isExpired(user, 50_000)).toBe(false);
  });
});

describe('buildQuery', () => {
  it('ignora valores vazios e codifica o resto', () => {
    expect(buildQuery({ page: 1, search: 'node & nest', category: '', x: undefined })).toBe(
      '?page=1&search=node+%26+nest',
    );
    expect(buildQuery({})).toBe('');
  });
});

describe('format', () => {
  it('formata duração e bytes', () => {
    expect(formatDuration(42)).toBe('42s');
    expect(formatDuration(3_700)).toBe('1h 1min');
    expect(formatDuration(90_000)).toBe('1d 1h');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});

describe('métricas Prometheus', () => {
  const text = [
    '# HELP http_requests_total Total',
    '# TYPE http_requests_total counter',
    'http_requests_total{method="GET",route="/api/courses",status="200"} 5',
    'http_requests_total{method="GET",route="/api/courses",status="401"} 2',
    'http_requests_total{method="POST",route="/api/enrollments",status="201"} 1',
    'process_resident_memory_bytes 1048576',
  ].join('\n');

  it('agrega requisições por rota e conta erros', () => {
    const samples = parsePrometheus(text);
    expect(summarizeHttp(samples)).toEqual([
      { method: 'GET', route: '/api/courses', total: 7, errors: 2 },
      { method: 'POST', route: '/api/enrollments', total: 1, errors: 0 },
    ]);
    expect(findValue(samples, 'process_resident_memory_bytes')).toBe(1048576);
  });
});
