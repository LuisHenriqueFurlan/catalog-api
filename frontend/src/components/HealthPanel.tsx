import { useQuery } from '@tanstack/react-query';
import { api } from '../api/endpoints';
import type { ComponentHealth } from '../api/types';
import { formatDuration } from '../lib/format';
import { ErrorBanner, Spinner, StatusPill } from './ui';

const COMPONENTS: { key: 'database' | 'mongo' | 'broker'; label: string; detail: string }[] = [
  { key: 'database', label: 'Banco relacional', detail: 'PostgreSQL / SQLite' },
  { key: 'mongo', label: 'MongoDB', detail: 'Auditoria (audit_logs)' },
  { key: 'broker', label: 'RabbitMQ', detail: 'Eventos assíncronos' },
];

export function useHealth() {
  return useQuery({ queryKey: ['health'], queryFn: api.system.health, refetchInterval: 10_000 });
}

export function HealthPanel() {
  const health = useHealth();
  if (health.isPending) return <Spinner label="Verificando serviços…" />;
  if (health.error) return <ErrorBanner error={health.error} />;
  const report = health.data;

  return (
    <section className="card">
      <div className="card-head">
        <h2>Saúde do sistema</h2>
        <StatusPill status={report.status} />
      </div>
      <div className="health-grid">
        {COMPONENTS.map(({ key, label, detail }) => (
          <ComponentCard key={key} label={label} detail={detail} health={report.components[key]} />
        ))}
      </div>
      <p className="muted small">
        No ar há {formatDuration(report.uptimeSeconds)} · atualiza a cada 10s
      </p>
    </section>
  );
}

function ComponentCard({ label, detail, health }: { label: string; detail: string; health: ComponentHealth }) {
  return (
    <div className={`health-item health-${health.status}`}>
      <div className="health-item-head">
        <span className="strong">{label}</span>
        <StatusPill status={health.status} />
      </div>
      <span className="muted small">{detail}</span>
      <span className="small">
        {health.latencyMs !== undefined && `${health.latencyMs} ms`}
        {health.error && <span className="text-bad">{health.error}</span>}
        {health.status === 'disabled' && 'Sem RABBITMQ_URL: auditoria gravada direto no Mongo'}
      </span>
    </div>
  );
}
