export interface MetricSample {
  name: string;
  labels: Record<string, string>;
  value: number;
}

const LINE = /^([a-zA-Z_:][a-zA-Z0-9_:]*)(?:\{([^}]*)\})?\s+(\S+)/;
const LABEL = /(\w+)="((?:[^"\\]|\\.)*)"/g;

export function parsePrometheus(text: string): MetricSample[] {
  const samples: MetricSample[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const match = LINE.exec(line);
    if (!match) continue;
    const value = Number(match[3]);
    if (Number.isNaN(value)) continue;
    const labels: Record<string, string> = {};
    for (const [, key, val] of (match[2] ?? '').matchAll(LABEL)) labels[key] = val;
    samples.push({ name: match[1], labels, value });
  }
  return samples;
}

export interface RouteTraffic {
  method: string;
  route: string;
  total: number;
  errors: number;
}

export function summarizeHttp(samples: MetricSample[]): RouteTraffic[] {
  const byRoute = new Map<string, RouteTraffic>();
  for (const sample of samples) {
    if (sample.name !== 'http_requests_total') continue;
    const { method = '?', route = '?', status = '0' } = sample.labels;
    const key = `${method} ${route}`;
    const entry = byRoute.get(key) ?? { method, route, total: 0, errors: 0 };
    entry.total += sample.value;
    if (Number(status) >= 400) entry.errors += sample.value;
    byRoute.set(key, entry);
  }
  return [...byRoute.values()].sort((a, b) => b.total - a.total);
}

export function findValue(samples: MetricSample[], name: string): number | undefined {
  return samples.find((s) => s.name === name)?.value;
}
