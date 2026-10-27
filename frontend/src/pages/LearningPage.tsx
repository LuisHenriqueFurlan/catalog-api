import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { StudentCourses } from '../components/StudentCourses';
import { PageHeader } from '../components/ui';

export function LearningPage() {
  const { user } = useAuth();
  if (user?.studentId == null) return <Navigate to="/" replace />;
  return (
    <>
      <PageHeader
        title="Meu aprendizado"
        subtitle="Seus cursos e o progresso calculado pela API (aulas concluídas ÷ total de aulas)."
      />
      <section className="card">
        <StudentCourses
          studentId={user.studentId}
          emptyHint={
            <>
              Explore o <Link to="/courses">catálogo</Link> e matricule-se em um curso.
            </>
          }
        />
      </section>
    </>
  );
}
