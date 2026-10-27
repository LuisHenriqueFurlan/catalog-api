import { useQuery } from '@tanstack/react-query';
import { api } from '../api/endpoints';
import { HealthPanel } from '../components/HealthPanel';
import { EmptyState, ErrorBanner, PageHeader, Stat } from '../components/ui';
import { formatBytes } from '../lib/format';
import { findValue, parsePrometheus, summarizeHttp } from '../lib/metrics';

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export function SystemPage() {
  const metrics = useQuery({
    queryKey: ['metrics'],
    queryFn: async () => parsePrometheus(await api.system.metrics()),
    refetchInterval: 10_000,
  });
  const samples = metrics.data ?? [];
  const routes = summarizeHttp(samples);
  const requests = routes.reduce((sum, r) => sum + r.total, 0);
  const errors = routes.reduce((sum, r) => sum + r.errors, 0);
  const memory = findValue(samples, 'process_resident_memory_bytes');
  const heap = findValue(samples, 'nodejs_heap_size_used_bytes');

  return (
    <>
      <PageHeader
        title="Sistema"
        subtitle="Saúde dos componentes (/health) e métricas Prometheus (/metrics) da API."
        actions={
          <>
            <a className="btn btn-ghost" href={`${API_BASE}/docs`} target="_blank" rel="noreferrer">
              Swagger ↗
            </a>
            <a className="btn btn-ghost" href={`${API_BASE}/metrics`} target="_blank" rel="noreferrer">
              /metrics ↗
            </a>
          </>
        }
      />
      <HealthPanel />
      <div className="stats">
        <Stat label="Requisições HTTP" value={requests} hint="desde que a API subiu" />
        <Stat label="Respostas 4xx/5xx" value={errors} />
        <Stat label="Memória (RSS)" value={memory !== undefined ? formatBytes(memory) : '—'} />
        <Stat label="Heap usado" value={heap !== undefined ? formatBytes(heap) : '—'} />
      </div>
      <section className="card table-card">
        <div className="card-head">
          <h2>Tráfego por rota</h2>
        </div>
        <ErrorBanner error={metrics.error} />
        {routes.length === 0 ? (
          <EmptyState title="Sem tráfego registrado ainda" />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Método</th>
                <th>Rota</th>
                <th className="num">Total</th>
                <th className="num">Erros</th>
              </tr>
            </thead>
            <tbody>
              {routes.slice(0, 15).map((r) => (
                <tr key={`${r.method} ${r.route}`}>
                  <td>
                    <code>{r.method}</code>
                  </td>
                  <td>
                    <code>{r.route}</code>
                  </td>
                  <td className="num">{r.total}</td>
                  <td className={`num${r.errors ? ' text-bad' : ''}`}>{r.errors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
