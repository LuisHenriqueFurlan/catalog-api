import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { api } from '../api/endpoints';
import type { Student } from '../api/types';
import { StudentCourses } from '../components/StudentCourses';
import { EmptyState, ErrorBanner, Field, Modal, PageHeader, Pagination, Spinner } from '../components/ui';
import { formatDate } from '../lib/format';

const LIMIT = 10;

export function StudentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Student | 'new' | null>(null);
  const [viewing, setViewing] = useState<Student | null>(null);

  const students = useQuery({
    queryKey: ['students', { page }],
    queryFn: () => api.students.list({ page, limit: LIMIT }),
    placeholderData: keepPreviousData,
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.students.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['students'] });
      void queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });

  return (
    <>
      <PageHeader
        title="Estudantes"
        subtitle="E-mail único: tentar repetir um e-mail devolve 409 da API."
        actions={
          <button className="btn btn-primary" onClick={() => setEditing('new')}>
            + Novo estudante
          </button>
        }
      />
      <ErrorBanner error={students.error ?? remove.error} />
      {students.isPending && <Spinner />}
      {students.data && students.data.total === 0 && <EmptyState title="Nenhum estudante cadastrado" />}
      {students.data && students.data.total > 0 && (
        <div className="card table-card">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Desde</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {students.data.data.map((student) => (
                <tr key={student.id}>
                  <td className="muted">{student.id}</td>
                  <td className="strong">{student.name}</td>
                  <td>{student.email}</td>
                  <td className="muted">{formatDate(student.createdAt)}</td>
                  <td className="row-actions">
                    <button className="btn btn-small btn-ghost" onClick={() => setViewing(student)}>
                      Progresso
                    </button>
                    <button className="btn btn-small btn-ghost" onClick={() => setEditing(student)}>
                      Editar
                    </button>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => window.confirm(`Remover ${student.name}?`) && remove.mutate(student.id)}
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={students.data.page} limit={students.data.limit} total={students.data.total} onChange={setPage} />
        </div>
      )}
      {editing && <StudentFormModal student={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
      {viewing && (
        <Modal title={`Cursos de ${viewing.name}`} onClose={() => setViewing(null)}>
          <StudentCourses studentId={viewing.id} />
        </Modal>
      )}
    </>
  );
}

function StudentFormModal({ student, onClose }: { student?: Student; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(student?.name ?? '');
  const [email, setEmail] = useState(student?.email ?? '');
  const save = useMutation({
    mutationFn: () => {
      const input = { name: name.trim(), email: email.trim() };
      return student ? api.students.update(student.id, input) : api.students.create(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['students'] });
      onClose();
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  return (
    <Modal
      title={student ? 'Editar estudante' : 'Novo estudante'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" form="student-form" disabled={save.isPending}>
            Salvar
          </button>
        </>
      }
    >
      <form id="student-form" className="form" onSubmit={submit}>
        <Field label="Nome">
          <input required minLength={2} maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="E-mail">
          <input type="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <ErrorBanner error={save.error} />
      </form>
    </Modal>
  );
}
