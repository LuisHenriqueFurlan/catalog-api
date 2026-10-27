import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/endpoints';
import { EmptyState, ErrorBanner, Field, PageHeader, Pagination, Spinner } from '../components/ui';
import { formatDateTime } from '../lib/format';

const LIMIT = 10;

export function EnrollmentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [studentId, setStudentId] = useState('');
  const [courseId, setCourseId] = useState('');

  const enrollments = useQuery({
    queryKey: ['enrollments', { page }],
    queryFn: () => api.enrollments.list({ page, limit: LIMIT }),
    placeholderData: keepPreviousData,
  });
  const students = useQuery({ queryKey: ['students', 'all'], queryFn: () => api.students.list({ limit: 100 }) });
  const courses = useQuery({ queryKey: ['courses', 'all'], queryFn: () => api.courses.list({ limit: 100 }) });
  const studentName = new Map(students.data?.data.map((s) => [s.id, s.name]));
  const courseTitle = new Map(courses.data?.data.map((c) => [c.id, c.title]));

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    void queryClient.invalidateQueries({ queryKey: ['students'] });
    void queryClient.invalidateQueries({ queryKey: ['reports'] });
    void queryClient.invalidateQueries({ queryKey: ['audit'] });
  };
  const create = useMutation({
    mutationFn: () => api.enrollments.create(Number(studentId), Number(courseId)),
    onSuccess: () => {
      setStudentId('');
      setCourseId('');
      invalidate();
    },
  });
  const cancel = useMutation({ mutationFn: (id: number) => api.enrollments.cancel(id), onSuccess: invalidate });

  function submit(event: FormEvent) {
    event.preventDefault();
    create.mutate();
  }

  return (
    <>
      <PageHeader
        title="Matrículas"
        subtitle="Cada matrícula publica o evento student.enrolled; matricular duas vezes devolve 409."
      />
      <form className="card form inline-form toolbar-form" onSubmit={submit}>
        <Field label="Estudante">
          <select required value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            <option value="">Selecione…</option>
            {students.data?.data.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Curso">
          <select required value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">Selecione…</option>
            {courses.data?.data.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </Field>
        <button className="btn btn-primary" disabled={create.isPending}>
          Matricular
        </button>
      </form>
      <ErrorBanner error={enrollments.error ?? create.error ?? cancel.error} />
      {enrollments.isPending && <Spinner />}
      {enrollments.data?.total === 0 && <EmptyState title="Nenhuma matrícula ainda" />}
      {enrollments.data && enrollments.data.total > 0 && (
        <div className="card table-card">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Estudante</th>
                <th>Curso</th>
                <th>Data</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {enrollments.data.data.map((e) => (
                <tr key={e.id}>
                  <td className="muted">{e.id}</td>
                  <td>{studentName.get(e.studentId) ?? `#${e.studentId}`}</td>
                  <td>
                    <Link to={`/courses/${e.courseId}`}>{courseTitle.get(e.courseId) ?? `#${e.courseId}`}</Link>
                  </td>
                  <td className="muted">{formatDateTime(e.createdAt)}</td>
                  <td className="row-actions">
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => window.confirm('Cancelar esta matrícula?') && cancel.mutate(e.id)}
                    >
                      Cancelar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={enrollments.data.page}
            limit={enrollments.data.limit}
            total={enrollments.data.total}
            onChange={setPage}
          />
        </div>
      )}
    </>
  );
}
