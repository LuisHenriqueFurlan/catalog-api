import { Link, Route, Routes } from 'react-router-dom';
import { Layout, RequireAdmin } from './components/Layout';
import { EmptyState } from './components/ui';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { CoursesPage } from './pages/CoursesPage';
import { DashboardPage } from './pages/DashboardPage';
import { EnrollmentsPage } from './pages/EnrollmentsPage';
import { LearningPage } from './pages/LearningPage';
import { ReportsPage } from './pages/ReportsPage';
import { StudentsPage } from './pages/StudentsPage';
import { SystemPage } from './pages/SystemPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/:id" element={<CourseDetailPage />} />
        <Route path="learning" element={<LearningPage />} />
        <Route path="system" element={<SystemPage />} />
        <Route path="students" element={<RequireAdmin><StudentsPage /></RequireAdmin>} />
        <Route path="enrollments" element={<RequireAdmin><EnrollmentsPage /></RequireAdmin>} />
        <Route path="reports" element={<RequireAdmin><ReportsPage /></RequireAdmin>} />
        <Route path="audit" element={<RequireAdmin><AuditLogsPage /></RequireAdmin>} />
        <Route
          path="*"
          element={
            <EmptyState title="Página não encontrada">
              <Link to="/">Voltar ao painel</Link>
            </EmptyState>
          }
        />
      </Route>
    </Routes>
  );
}
