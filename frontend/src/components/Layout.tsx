import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  show: (ctx: { isAdmin: boolean; hasStudent: boolean }) => boolean;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Painel', icon: '◧', show: () => true },
  { to: '/courses', label: 'Cursos', icon: '▤', show: () => true },
  { to: '/learning', label: 'Meu aprendizado', icon: '✦', show: ({ hasStudent }) => hasStudent },
  { to: '/students', label: 'Estudantes', icon: '◉', show: ({ isAdmin }) => isAdmin },
  { to: '/enrollments', label: 'Matrículas', icon: '⇄', show: ({ isAdmin }) => isAdmin },
  { to: '/reports', label: 'Relatórios', icon: '▥', show: ({ isAdmin }) => isAdmin },
  { to: '/audit', label: 'Auditoria', icon: '☰', show: ({ isAdmin }) => isAdmin },
  { to: '/system', label: 'Sistema', icon: '◎', show: () => true },
];

export function Layout() {
  const { user, email, isAdmin, logout } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  const items = NAV.filter((item) => item.show({ isAdmin, hasStudent: user.studentId !== null }));

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden>
            ▤
          </span>
          <span>
            Catálogo<small>de Cursos</small>
          </span>
        </div>
        <nav className="nav">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className="nav-link">
              <span className="nav-icon" aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user">
            <span className="avatar" aria-hidden>
              {(email ?? '?').charAt(0).toUpperCase()}
            </span>
            <span className="user-info">
              <span className="user-email" title={email ?? undefined}>
                {email ?? `Usuário #${user.userId}`}
              </span>
              <span className={`role role-${user.role.toLowerCase()}`}>{user.role}</span>
            </span>
          </div>
          <button className="btn btn-ghost btn-block" onClick={logout}>
            Sair
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  return isAdmin ? <>{children}</> : <Navigate to="/" replace />;
}
