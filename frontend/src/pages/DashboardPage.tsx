import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import { HealthPanel } from '../components/HealthPanel';
import { StudentCourses } from '../components/StudentCourses';
import { EmptyState, ErrorBanner, PageHeader, Pill, Stat } from '../components/ui';
import { formatDateTime } from '../lib/format';
import { EnrollmentBars } from './ReportsPage';

export function DashboardPage() {
  const { user, email, isAdmin } = useAuth();
  const courses = useQuery({ queryKey: ['courses', 'count'], queryFn: () => api.courses.list({ limit: 1 }) });

  return (
    <>
      <PageHeader
        title={`Olá${email ? `, ${email.split('@')[0]}` : ''}!`}
        subtitle={isAdmin ? 'Visão geral da plataforma.' : 'Acompanhe seus cursos e seu progresso.'}
      />
      <div className="stats">
        <Stat label="Cursos no catálogo" value={courses.data?.total ?? '—'} hint={<Link to="/courses">ver catálogo →</Link>} />
        {isAdmin && <AdminStats />}
      </div>
      <div className="grid-2">
        {user?.studentId !== null && user?.studentId !== undefined && (
          <section className="card">
            <div className="card-head">
              <h2>Meus cursos</h2>
              <Link to="/learning">ver tudo →</Link>
            </div>
            <StudentCourses
              studentId={user.studentId}
              emptyHint={
                <>
                  Explore o <Link to="/courses">catálogo</Link> e matricule-se.
                </>
              }
            />
          </section>
        )}
        {isAdmin && <TopCourses />}
        {isAdmin && <RecentActivity />}
        <HealthPanel />
      </div>
    </>
  );
}

function AdminStats() {
  const students = useQuery({ queryKey: ['students', 'count'], queryFn: () => api.students.list({ limit: 1 }) });
  const enrollments = useQuery({ queryKey: ['enrollments', 'count'], queryFn: () => api.enrollments.list({ limit: 1 }) });
  const events = useQuery({ queryKey: ['audit', 'count'], queryFn: () => api.audit.list({ limit: 1 }) });
  return (
    <>
      <Stat label="Estudantes" value={students.data?.total ?? '—'} hint={<Link to="/students">gerenciar →</Link>} />
      <Stat label="Matrículas" value={enrollments.data?.total ?? '—'} hint={<Link to="/enrollments">gerenciar →</Link>} />
      <Stat label="Eventos auditados" value={events.data?.total ?? '—'} hint={<Link to="/audit">ver auditoria →</Link>} />
    </>
  );
}

function TopCourses() {
  const report = useQuery({ queryKey: ['reports', 'enrollments'], queryFn: api.reports.enrollmentsPerCourse });
  return (
    <section className="card">
      <div className="card-head">
        <h2>Cursos mais procurados</h2>
        <Link to="/reports">relatório →</Link>
      </div>
      <ErrorBanner error={report.error} />
      {report.data && <EnrollmentBars rows={report.data.slice(0, 5)} />}
    </section>
  );
}

function RecentActivity() {
  const logs = useQuery({ queryKey: ['audit', 'recent'], queryFn: () => api.audit.list({ limit: 6 }), refetchInterval: 15_000 });
  return (
    <section className="card">
      <div className="card-head">
        <h2>Atividade recente</h2>
        <Link to="/audit">auditoria →</Link>
      </div>
      <ErrorBanner error={logs.error} />
      {logs.data?.data.length === 0 && <EmptyState title="Nenhum evento ainda" />}
      <ul className="timeline">
        {logs.data?.data.map((log, i) => (
          <li key={log.eventId ?? i}>
            <Pill tone={log.event === 'lesson.completed' ? 'ok' : 'info'}>{log.event}</Pill>
            <span className="small">
              estudante #{String(log.payload.studentId ?? '?')}
              {log.payload.courseId !== undefined && ` · curso #${String(log.payload.courseId)}`}
            </span>
            <span className="muted small">{formatDateTime(log.timestamp)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
