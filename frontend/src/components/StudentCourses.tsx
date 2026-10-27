import { useQueries, useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/endpoints';
import { formatDate } from '../lib/format';
import { EmptyState, ErrorBanner, ProgressBar, Spinner } from './ui';

export function StudentCourses({ studentId, emptyHint }: { studentId: number; emptyHint?: ReactNode }) {
  const enrollments = useQuery({
    queryKey: ['students', studentId, 'enrollments'],
    queryFn: () => api.students.enrollments(studentId),
  });

  const progress = useQueries({
    queries: (enrollments.data ?? []).map((enrollment) => ({
      queryKey: ['progress', studentId, enrollment.courseId],
      queryFn: () => api.students.progress(studentId, enrollment.courseId),
    })),
  });

  if (enrollments.isPending) return <Spinner />;
  if (enrollments.error) return <ErrorBanner error={enrollments.error} />;
  if (enrollments.data.length === 0) {
    return <EmptyState title="Nenhuma matrícula ainda">{emptyHint}</EmptyState>;
  }

  return (
    <ul className="course-progress-list">
      {enrollments.data.map((enrollment, index) => {
        const p = progress[index]?.data;
        return (
          <li key={enrollment.id} className="course-progress">
            <div className="course-progress-head">
              <Link to={`/courses/${enrollment.courseId}`} className="strong">
                {enrollment.course?.title ?? `Curso #${enrollment.courseId}`}
              </Link>
              <span className="muted small">desde {formatDate(enrollment.createdAt)}</span>
            </div>
            <ProgressBar value={p?.percentage ?? 0} label="Progresso no curso" />
            <span className="muted small">
              {p ? `${p.completedLessons} de ${p.totalLessons} aulas concluídas` : 'calculando…'}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
