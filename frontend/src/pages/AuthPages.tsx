import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import { ErrorBanner, Field } from '../components/ui';

function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="auth">
      <div className="auth-hero">
        <span className="brand-mark big" aria-hidden>
          ▤
        </span>
        <h2>Catálogo de Cursos 2.0</h2>
        <p>
          Cursos, aulas, matrículas e progresso sobre uma API NestJS com Clean Architecture, JWT,
          PostgreSQL, MongoDB e RabbitMQ.
        </p>
      </div>
      <div className="auth-panel">
        <div className="card auth-card">
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const registered = (location.state as { registered?: string } | null)?.registered;
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const [email, setEmail] = useState(registered ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={from} replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Entrar" subtitle="Use sua conta para acessar a plataforma.">
      {registered && <div className="alert alert-ok">Conta criada! Faça login para continuar.</div>}
      <form onSubmit={submit} className="form">
        <Field label="E-mail">
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Senha">
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <ErrorBanner error={error} />
        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      {import.meta.env.DEV && (
        <button
          className="btn btn-ghost btn-block"
          onClick={() => {
            setEmail('admin@example.com');
            setPassword('Admin123!');
          }}
        >
          Preencher admin de demonstração
        </button>
      )}
      <p className="muted center">
        Ainda não tem conta? <Link to="/register">Cadastre-se</Link>
      </p>
    </AuthCard>
  );
}

export function RegisterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.auth.register(name.trim(), email.trim(), password);
      navigate('/login', { state: { registered: email.trim() } });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Criar conta" subtitle="Você entra como estudante e já ganha seu perfil de aluno.">
      <form onSubmit={submit} className="form">
        <Field label="Nome">
          <input required minLength={2} maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="E-mail">
          <input type="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Senha" hint="Mínimo de 8 caracteres">
          <input
            type="password"
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <ErrorBanner error={error} />
        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Criando…' : 'Criar conta'}
        </button>
      </form>
      <p className="muted center">
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </AuthCard>
  );
}
