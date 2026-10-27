import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import { CourseFormModal } from '../components/CourseFormModal';
import { EmptyState, ErrorBanner, PageHeader, Pagination, Pill, Spinner } from '../components/ui';
import { formatDate } from '../lib/format';

const LIMIT = 9;

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function CoursesPage() {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const debouncedSearch = useDebounced(search);
  const debouncedCategory = useDebounced(category);

  useEffect(() => setPage(1), [debouncedSearch, debouncedCategory]);

  const courses = useQuery({
    queryKey: ['courses', { page, search: debouncedSearch, category: debouncedCategory }],
    queryFn: () =>
      api.courses.list({ page, limit: LIMIT, search: debouncedSearch.trim(), category: debouncedCategory.trim() }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="Cursos"
        subtitle="Busca por texto (título ou descrição), filtro por categoria e paginação vêm direto da API."
        actions={
          isAdmin && (
            <button className="btn btn-primary" onClick={() => setCreating(true)}>
              + Novo curso
            </button>
          )
        }
      />
      <div className="toolbar">
        <input
          type="search"
          placeholder="Buscar cursos…"
          value={search}
          maxLength={100}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar cursos"
        />
        <input
          placeholder="Categoria exata"
          value={category}
          maxLength={100}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filtrar por categoria"
        />
      </div>
      <ErrorBanner error={courses.error} />
      {courses.isPending && <Spinner />}
      {courses.data && courses.data.data.length === 0 && (
        <EmptyState title="Nenhum curso encontrado">Tente outra busca ou limpe os filtros.</EmptyState>
      )}
      <div className={`course-grid${courses.isFetching ? ' is-loading' : ''}`}>
        {courses.data?.data.map((course) => (
          <Link key={course.id} to={`/courses/${course.id}`} className="card course-card">
            <div className="course-card-top">
              {course.category ? <Pill tone="info">{course.category}</Pill> : <Pill>Sem categoria</Pill>}
              <span className="muted small">#{course.id}</span>
            </div>
            <h3>{course.title}</h3>
            <p className="muted clamp">{course.description || 'Sem descrição.'}</p>
            <span className="muted small">Criado em {formatDate(course.createdAt)}</span>
          </Link>
        ))}
      </div>
      {courses.data && (
        <Pagination page={courses.data.page} limit={courses.data.limit} total={courses.data.total} onChange={setPage} />
      )}
      {creating && <CourseFormModal onClose={() => setCreating(false)} />}
    </>
  );
}
