import { INestApplication } from '@nestjs/common';
import { client, closeTestApp, createTestApp, PASSWORD, signUp } from './helpers.js';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let admin: { token: string; studentId: number };
  let ana: { token: string; studentId: number };
  let bia: { token: string; studentId: number };

  beforeAll(async () => {
    app = await createTestApp();
    admin = await signUp(app, 'admin@example.com', 'ADMIN');
    ana = await signUp(app, 'ana@example.com');
    bia = await signUp(app, 'bia@example.com');
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('register: role STUDENT, sem expor passwordHash; e-mail duplicado -> 409', async () => {
    const res = await client(app)
      .post('/api/auth/register')
      .send({ name: 'Caio', email: 'caio@example.com', password: PASSWORD })
      .expect(201);
    expect(res.body).toMatchObject({ email: 'caio@example.com', role: 'STUDENT' });
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    await client(app)
      .post('/api/auth/register')
      .send({ name: 'Caio', email: 'caio@example.com', password: PASSWORD })
      .expect(409);
  });

  it('register: não aceita role no body nem senha curta', async () => {
    await client(app)
      .post('/api/auth/register')
      .send({ name: 'X Y', email: 'x@example.com', password: PASSWORD, role: 'ADMIN' })
      .expect(400);
    await client(app)
      .post('/api/auth/register')
      .send({ name: 'X Y', email: 'x@example.com', password: '123' })
      .expect(400);
  });

  it('login: sucesso devolve Bearer token; senha errada ou e-mail inexistente -> 401', async () => {
    const ok = await client(app)
      .post('/api/auth/login')
      .send({ email: 'ana@example.com', password: PASSWORD })
      .expect(200);
    expect(ok.body.tokenType).toBe('Bearer');
    expect(ok.body.accessToken).toEqual(expect.any(String));
    await client(app)
      .post('/api/auth/login')
      .send({ email: 'ana@example.com', password: 'errada-errada' })
      .expect(401);
    await client(app)
      .post('/api/auth/login')
      .send({ email: 'ninguem@example.com', password: PASSWORD })
      .expect(401);
  });

  it('sem token ou com token inválido -> 401; /health e /auth continuam abertos', async () => {
    await client(app).get('/api/courses').expect(401);
    await client(app, 'token-invalido').get('/api/courses').expect(401);
    await client(app).get('/health').expect(200);
  });

  it('STUDENT: lê cursos, mas não cria/edita/remove (403)', async () => {
    await client(app, ana.token).get('/api/courses').expect(200);
    await client(app, ana.token).post('/api/courses').send({ title: 'Proibido' }).expect(403);
    await client(app, ana.token).put('/api/courses/1').send({ title: 'Proibido' }).expect(403);
    await client(app, ana.token).delete('/api/courses/1').expect(403);
    await client(app, ana.token).get('/api/students').expect(403);
  });

  it('ADMIN gerencia cursos', async () => {
    await client(app, admin.token).post('/api/courses').send({ title: 'Permitido' }).expect(201);
  });

  it('STUDENT só matricula e consulta a si mesmo', async () => {
    const course = (await client(app, admin.token).post('/api/courses').send({ title: 'Docker' })).body;
    await client(app, ana.token)
      .post('/api/enrollments')
      .send({ studentId: bia.studentId, courseId: course.id })
      .expect(403);
    await client(app, ana.token)
      .post('/api/enrollments')
      .send({ studentId: ana.studentId, courseId: course.id })
      .expect(201);
    await client(app, ana.token).get(`/api/students/${ana.studentId}/enrollments`).expect(200);
    await client(app, ana.token).get(`/api/students/${bia.studentId}/enrollments`).expect(403);
    await client(app, admin.token).get(`/api/students/${bia.studentId}/enrollments`).expect(200);
  });
});
