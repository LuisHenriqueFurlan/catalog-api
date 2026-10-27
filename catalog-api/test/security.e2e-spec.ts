import { INestApplication } from '@nestjs/common';
import { vi } from 'vitest';
import { client, closeTestApp, createTestApp, PASSWORD, signUp } from './helpers.js';

vi.hoisted(() => {
  process.env.THROTTLE_AUTH_LIMIT = '5';
});

describe('Segurança (e2e)', () => {
  let app: INestApplication;
  let admin: { token: string };

  beforeAll(async () => {
    app = await createTestApp();
    admin = await signUp(app, 'admin@example.com', 'ADMIN');
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('helmet: cabeçalhos de segurança e sem x-powered-by', async () => {
    const res = await client(app).get('/health').expect(200);
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['strict-transport-security']).toBeDefined();
    expect(res.headers['content-security-policy']).toBeDefined();
  });

  it('SQL injection em login, id e filtros não altera o resultado', async () => {
    await client(app).post('/api/auth/login').send({ email: "' OR 1=1 --", password: 'x' }).expect(400);
    await client(app)
      .post('/api/auth/login')
      .send({ email: "admin@example.com' OR '1'='1", password: PASSWORD })
      .expect(400);
    await client(app, admin.token).get('/api/courses/1;DROP TABLE courses').expect(400);
    await client(app, admin.token).get('/api/courses/1 OR 1=1').expect(400);
    const res = await client(app, admin.token)
      .get(`/api/courses?category=${encodeURIComponent("x' OR '1'='1")}`)
      .expect(200);
    expect(res.body.total).toBe(0);
    await client(app, admin.token).get('/api/courses').expect(200);
  });

  it('limites de tamanho e propriedades extras são rejeitados', async () => {
    const post = (body: object) => client(app, admin.token).post('/api/courses').send(body);
    await post({ title: 'a'.repeat(201) }).expect(400);
    await post({ title: 'Curso', description: 'd'.repeat(2001) }).expect(400);
    await post({ title: 'Curso', isAdmin: true }).expect(400);
    await post({ title: 'Curso', category: 'c'.repeat(101) }).expect(400);
    await client(app)
      .post('/api/auth/register')
      .send({ name: 'Ana Souza', email: `${'a'.repeat(250)}@example.com`, password: PASSWORD })
      .expect(400);
    await client(app, admin.token)
      .post('/api/courses')
      .send({ title: 'x'.repeat(200_000) })
      .expect(413);
  });

  it('rate limit nas rotas de autenticação: excesso -> 429', async () => {
    const attempt = () =>
      client(app).post('/api/auth/login').send({ email: 'admin@example.com', password: 'errada-errada' });
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) statuses.push((await attempt()).status);
    expect(statuses).toContain(429);
    expect(statuses[0]).toBe(401);
  });
});
