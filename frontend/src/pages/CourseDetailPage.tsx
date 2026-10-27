import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/endpoints';
import type { Course, Lesson } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { CourseFormModal } from '../components/CourseFormModal';
import { EmptyState, ErrorBanner, Field, PageHeader, Pill, ProgressBar, Spinner } from '../components/ui';
import { formatDate } from '../lib/format';

export function CourseDetailPage() {
  const courseId = Number(useParams().id);
  const { isAdmin, user } = useAuth();
  const course = useQuery({ queryKey: ['courses', courseId], queryFn: () => api.courses.get(courseId) });
  const lessons = useQuery({ queryKey: ['courses', courseId, 'lessons'], queryFn: () => api.courses.lessons(courseId) });

  if (course.isPending) return <Spinner />;
  if (course.error) return <ErrorBanner error={course.error} />;

  return (
    <>
      <p className="breadcrumb">
        <Link to="/courses">← Cursos</Link>
      </p>
      <CourseHeader course={course.data} isAdmin={isAdmin} />
      <div className={isAdmin ? 'grid-2 wide-left' : 'single'}>
        <section className="card">
          <div className="card-head">
            <h2>Aulas</h2>
            <span className="muted small">{lessons.data?.length ?? 0} aulas</span>
          </div>
          <ErrorBanner error={lessons.error} />
          {lessons.isPending && <Spinner />}
          {lessons.data &&
            (user?.studentId != null ? (
              <StudentLessons courseId={courseId} studentId={user.studentId} lessons={lessons.data} />
            ) : (
              <LessonList lessons={lessons.data} />
            ))}
          {isAdmin && <AddLessonForm courseId={courseId} nextOrder={(lessons.data?.length ?? 0) + 1} />}
        </section>
        {isAdmin && <EnrolledStudents courseId={courseId} />}
      </div>
    </>
  );
}

function CourseHeader({ course, isAdmin }: { course: Course; isAdmin: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const remove = useMutation({
    mutationFn: () => api.courses.remove(course.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['courses'] });
      void queryClient.invalidateQueries({ queryKey: ['reports'] });
      navigate('/courses');
    },
  });

  return (
    <>
      <PageHeader
        title={course.title}
        subtitle={
          <>
            {course.category && <Pill tone="info">{course.category}</Pill>} {course.description || 'Sem descrição.'}
          </>
        }
        actions={
          isAdmin && (
            <>
              <button className="btn btn-ghost" onClick={() => setEditing(true)}>
                Editar
              </button>
              <button
                className="btn btn-danger"
                disabled={remove.isPending}
                onClick={() => window.confirm(`Remover "${course.title}" e todas as matrículas?`) && remove.mutate()}
              >
                Remover
              </button>
            </>
          )
        }
      />
      <ErrorBanner error={remove.error} />
      {editing && <CourseFormModal course={course} onClose={() => setEditing(false)} />}
    </>
  );
}

function LessonList({ lessons, done, action }: {
  lessons: Lesson[];
  done?: Set<number>;
  action?: (lesson: Lesson) => React.ReactNode;
}) {
  if (lessons.length === 0) return <EmptyState title="Este curso ainda não tem aulas" />;
  return (
    <ol className="lessons">
      {lessons.map((lesson) => (
        <li key={lesson.id} className={done?.has(lesson.id) ? 'lesson done' : 'lesson'}>
          <span className="lesson-order">{done?.has(lesson.id) ? '✓' : lesson.order}</span>
          <span className="lesson-body">
            <span className="strong">{lesson.title}</span>
            <a href={lesson.contentUrl} target="_blank" rel="noreferrer" className="small">
              {lesson.contentUrl}
            </a>
          </span>
          {action?.(lesson)}
        </li>
      ))}
    </ol>
  );
}

function StudentLessons({ courseId, studentId, lessons }: { courseId: number; studentId: number; lessons: Lesson[] }) {
  const queryClient = useQueryClient();
  const enrollments = useQuery({
    queryKey: ['students', studentId, 'enrollments'],
    queryFn: () => api.students.enrollments(studentId),
  });
  const enrolled = enrollments.data?.some((e) => e.courseId === courseId) ?? false;
  const progress = useQuery({
    queryKey: ['progress', studentId, courseId],
    queryFn: () => api.students.progress(studentId, courseId),
    enabled: enrolled,
  });
  const done = useMemo(() => new Set(progress.data?.completedLessonIds ?? []), [progress.data]);

  const enroll = useMutation({
    mutationFn: () => api.enrollments.create(studentId, courseId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['students', studentId, 'enrollments'] });
      void queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
  const complete = useMutation({
    mutationFn: (lessonId: number) => api.lessons.complete(lessonId, studentId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['progress', studentId] }),
  });

  if (enrollments.isPending) return <Spinner />;

  return (
    <>
      {enrolled ? (
        <div className="enrolled-box">
          <span className="strong">Seu progresso</span>
          <ProgressBar value={progress.data?.percentage ?? 0} />
          <span className="muted small">
            {progress.data ? `${progress.data.completedLessons} de ${progress.data.totalLessons} aulas` : '…'}
          </span>
        </div>
      ) : (
        <div className="enrolled-box">
          <span>Matricule-se para registrar seu progresso nas aulas.</span>
          <button className="btn btn-primary" disabled={enroll.isPending} onClick={() => enroll.mutate()}>
            {enroll.isPending ? 'Matriculando…' : 'Matricular-me'}
          </button>
        </div>
      )}
      <ErrorBanner error={enroll.error ?? complete.error} />
      <LessonList
        lessons={lessons}
        done={done}
        action={(lesson) =>
          enrolled &&
          (done.has(lesson.id) ? (
            <Pill tone="ok">Concluída</Pill>
          ) : (
            <button
              className="btn btn-small"
              disabled={complete.isPending}
              onClick={() => complete.mutate(lesson.id)}
            >
              Concluir
            </button>
          ))
        }
      />
    </>
  );
}

function AddLessonForm({ courseId, nextOrder }: { courseId: number; nextOrder: number }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [order, setOrder] = useState<number | ''>('');
  const [contentUrl, setContentUrl] = useState('');
  const add = useMutation({
    mutationFn: () =>
      api.courses.addLesson(courseId, { title: title.trim(), order: Number(order || nextOrder), contentUrl: contentUrl.trim() }),
    onSuccess: () => {
      setTitle('');
      setOrder('');
      setContentUrl('');
      void queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'lessons'] });
      void queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    add.mutate();
  }

  return (
    <form className="form inline-form" onSubmit={submit}>
      <h3>Adicionar aula</h3>
      <div className="form-row">
        <Field label="Título">
          <input required minLength={3} maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Ordem">
          <input
            type="number"
            min={1}
            placeholder={String(nextOrder)}
            value={order}
            onChange={(e) => setOrder(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </Field>
      </div>
      <Field label="URL do conteúdo">
        <input type="url" required maxLength={500} placeholder="https://…" value={contentUrl} onChange={(e) => setContentUrl(e.target.value)} />
      </Field>
      <ErrorBanner error={add.error} />
      <button className="btn btn-primary" disabled={add.isPending}>
        {add.isPending ? 'Adicionando…' : 'Adicionar aula'}
      </button>
    </form>
  );
}

function EnrolledStudents({ courseId }: { courseId: number }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState('');
  const students = useQuery({ queryKey: ['students', 'all'], queryFn: () => api.students.list({ limit: 100 }) });
  const enrollments = useQuery({ queryKey: ['enrollments', 'all'], queryFn: () => api.enrollments.list({ limit: 100 }) });
  const inCourse = (enrollments.data?.data ?? []).filter((e) => e.courseId === courseId);
  const names = new Map(students.data?.data.map((s) => [s.id, s.name]));

  const progress = useQueries({
    queries: inCourse.map((e) => ({
      queryKey: ['progress', e.studentId, courseId],
      queryFn: () => api.students.progress(e.studentId, courseId),
    })),
  });

  const enroll = useMutation({
    mutationFn: () => api.enrollments.create(Number(selected), courseId),
    onSuccess: () => {
      setSelected('');
      void queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      void queryClient.invalidateQueries({ queryKey: ['students'] });
      void queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const available = (students.data?.data ?? []).filter((s) => !inCourse.some((e) => e.studentId === s.id));

  return (
    <section className="card">
      <div className="card-head">
        <h2>Estudantes matriculados</h2>
        <span className="muted small">{inCourse.length}</span>
      </div>
      <ErrorBanner error={students.error ?? enrollments.error ?? enroll.error} />
      {inCourse.length === 0 ? (
        <EmptyState title="Ninguém matriculado ainda" />
      ) : (
        <ul className="course-progress-list">
          {inCourse.map((e, i) => (
            <li key={e.id} className="course-progress">
              <div className="course-progress-head">
                <span className="strong">{names.get(e.studentId) ?? `Estudante #${e.studentId}`}</span>
                <span className="muted small">desde {formatDate(e.createdAt)}</span>
              </div>
              <ProgressBar value={progress[i]?.data?.percentage ?? 0} />
            </li>
          ))}
        </ul>
      )}
      <form
        className="form inline-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (selected) enroll.mutate();
        }}
      >
        <Field label="Matricular estudante">
          <select value={selected} onChange={(e) => setSelected(e.target.value)} required>
            <option value="">Selecione…</option>
            {available.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.email})
              </option>
            ))}
          </select>
        </Field>
        <button className="btn btn-primary" disabled={!selected || enroll.isPending}>
          Matricular
        </button>
      </form>
    </section>
  );
}
