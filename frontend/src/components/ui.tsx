import { useEffect, useId, useRef, type ReactNode } from 'react';
import { ApiError } from '../api/http';

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function Spinner({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="spinner" role="status">
      <span className="spinner-dot" aria-hidden />
      {label}
    </div>
  );
}

export function ErrorBanner({ error }: { error: unknown }) {
  if (!error) return null;
  const apiError = error instanceof ApiError ? error : null;
  const message = error instanceof Error ? error.message : 'Algo deu errado';
  return (
    <div className="alert alert-error" role="alert">
      <strong>
        {apiError && apiError.status > 0 ? `${apiError.status} · ` : ''}
        {message}
      </strong>
      {apiError?.body?.details && (
        <ul>
          {apiError.body.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      )}
      {apiError?.body?.requestId && <small>requestId: {apiError.body.requestId}</small>}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <p className="empty-title">{title}</p>
      {children && <div className="muted">{children}</div>}
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="progress-track">
        <div className={`progress-fill${pct === 100 ? ' done' : ''}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-value">{pct}%</span>
    </div>
  );
}

type Tone = 'ok' | 'warn' | 'bad' | 'neutral' | 'info';

export function Pill({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

const STATUS_TONE: Record<string, Tone> = {
  ok: 'ok',
  up: 'ok',
  degraded: 'warn',
  disabled: 'neutral',
  down: 'bad',
};

const STATUS_LABEL: Record<string, string> = {
  ok: 'Operacional',
  up: 'No ar',
  degraded: 'Degradado',
  disabled: 'Desativado',
  down: 'Fora do ar',
};

export function StatusPill({ status }: { status: string }) {
  return <Pill tone={STATUS_TONE[status] ?? 'neutral'}>{STATUS_LABEL[status] ?? status}</Pill>;
}

export function Pagination({
  page,
  limit,
  total,
  onChange,
}: {
  page: number;
  limit: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (total === 0) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return (
    <nav className="pagination" aria-label="Paginação">
      <span className="muted">
        {from}–{to} de {total}
      </span>
      <div className="pagination-buttons">
        <button className="btn btn-ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          ← Anterior
        </button>
        <span className="muted">
          {page} / {pages}
        </span>
        <button className="btn btn-ghost" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Próxima →
        </button>
      </div>
    </nav>
  );
}

export function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    dialogRef.current?.querySelector<HTMLElement>('input, select, textarea, button')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialogRef}>
        <div className="modal-header">
          <h2 id={titleId}>{title}</h2>
          <button className="btn btn-icon" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="card stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {hint && <span className="muted small">{hint}</span>}
    </div>
  );
}
