import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { api } from '../api/endpoints';
import type { AuditLogFilter } from '../api/types';
import { EmptyState, ErrorBanner, Field, PageHeader, Pagination, Pill, Spinner } from '../components/ui';
import { formatDateTime, toIsoOrUndefined } from '../lib/format';

const LIMIT = 15;
const EMPTY = { event: '', studentId: '', from: '', to: '' };

export function AuditLogsPage() {
  const [form, setForm] = useState(EMPTY);
  const [filter, setFilter] = useState<AuditLogFilter>({});
  const [page, setPage] = useState(1);

  const logs = useQuery({
    queryKey: ['audit', filter, page],
    queryFn: () => api.audit.list({ ...filter, page, limit: LIMIT }),
    placeholderData: keepPreviousData,
    refetchInterval: 15_000,
  });

  function apply(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setFilter({
      event: form.event || undefined,
      studentId: form.studentId.trim() || undefined,
      from: toIsoOrUndefined(form.from),
      to: toIsoOrUndefined(form.to),
    });
  }

  return (
    <>
      <PageHeader
        title="Auditoria"
        subtitle="Eventos gravados no MongoDB (audit_logs) pelo worker que consome o RabbitMQ."
      />
      <form className="card form toolbar-form" onSubmit={apply}>
        <Field label="Evento">
          <select value={form.event} onChange={(e) => setForm({ ...form, event: e.target.value })}>
            <option value="">Todos</option>
            <option value="student.enrolled">student.enrolled</option>
            <option value="lesson.completed">lesson.completed</option>
          </select>
        </Field>
        <Field label="Estudante (id)">
          <input inputMode="numeric" maxLength={20} value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} />
        </Field>
        <Field label="De">
          <input type="datetime-local" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} />
        </Field>
        <Field label="Até">
          <input type="datetime-local" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} />
        </Field>
        <div className="toolbar-buttons">
          <button className="btn btn-primary">Filtrar</button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setForm(EMPTY);
              setFilter({});
              setPage(1);
            }}
          >
            Limpar
          </button>
        </div>
      </form>
      <ErrorBanner error={logs.error} />
      {logs.isPending && <Spinner />}
      {logs.data?.total === 0 && <EmptyState title="Nenhum evento encontrado" />}
      {logs.data && logs.data.total > 0 && (
        <div className="card table-card">
          <table>
            <thead>
              <tr>
                <th>Quando</th>
                <th>Evento</th>
                <th>Ator</th>
                <th>Payload</th>
              </tr>
            </thead>
            <tbody>
              {logs.data.data.map((log, i) => (
                <tr key={log.eventId ?? `${log.timestamp}-${i}`}>
                  <td className="muted nowrap">{formatDateTime(log.timestamp)}</td>
                  <td>
                    <Pill tone={log.event === 'lesson.completed' ? 'ok' : 'info'}>{log.event}</Pill>
                  </td>
                  <td className="muted">{log.actorId ? `usuário #${log.actorId}` : '—'}</td>
                  <td>
                    <code className="payload">
                      {Object.entries(log.payload)
                        .map(([k, v]) => `${k}=${String(v)}`)
                        .join('  ')}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={logs.data.page} limit={logs.data.limit} total={logs.data.total} onChange={setPage} />
        </div>
      )}
    </>
  );
}
