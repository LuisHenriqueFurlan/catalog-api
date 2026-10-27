import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/endpoints';
import type { CourseEnrollmentCount } from '../api/types';
import { EmptyState, ErrorBanner, PageHeader, Spinner, Stat } from '../components/ui';

export function EnrollmentBars({ rows }: { rows: CourseEnrollmentCount[] }) {
  if (rows.length === 0) return <EmptyState title="Nenhum curso cadastrado" />;
  const max = Math.max(1, ...rows.map((r) => r.enrollments));
  return (
    <ul className="bars">
      {rows.map((row) => (
        <li key={row.courseId}>
          <Link to={`/courses/${row.courseId}`} className="bar-label" title={row.title}>
            {row.title}
          </Link>
          <span className="bar-track">
            <span className="bar-fill" style={{ width: `${(row.enrollments / max) * 100}%` }} />
          </span>
          <span className="bar-value">{row.enrollments}</span>
        </li>
      ))}
    </ul>
  );
}

export function ReportsPage() {
  const report = useQuery({ queryKey: ['reports', 'enrollments'], queryFn: api.reports.enrollmentsPerCourse });
  const rows = report.data ?? [];
  const total = rows.reduce((sum, r) => sum + r.enrollments, 0);
  const withoutStudents = rows.filter((r) => r.enrollments === 0).length;

  return (
    <>
      <PageHeader
        title="Relatórios"
        subtitle="GET /api/reports/courses/enrollments — uma única query com LEFT JOIN + GROUP BY."
      />
      <ErrorBanner error={report.error} />
      {report.isPending && <Spinner />}
      {report.data && (
        <>
          <div className="stats">
            <Stat label="Cursos" value={rows.length} />
            <Stat label="Matrículas" value={total} />
            <Stat label="Média por curso" value={rows.length ? (total / rows.length).toFixed(1) : '0'} />
            <Stat label="Cursos sem alunos" value={withoutStudents} />
          </div>
          <section className="card">
            <div className="card-head">
              <h2>Matrículas por curso</h2>
            </div>
            <EnrollmentBars rows={rows} />
          </section>
        </>
      )}
    </>
  );
}
