import { INestApplication } from '@nestjs/common';
import { client, closeTestApp, createTestApp, signUp } from './helpers.js';

describe('API (e2e)', () => {
  let app: INestApplication;
  let token: string;
  const http = () => client(app, token);

  beforeAll(async () => {
    app = await createTestApp();
    token = (await signUp(app, 'admin@example.com', 'ADMIN')).token;
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('GET /health', async () => {
    await client(app).get('/health').expect(200).expect({ status: 'ok' });
  });

  describe('courses', () => {
    it('POST /api/courses válido -> 201', async () => {
      const res = await http()
        .post('/api/courses')
        .send({ title: 'NestJS', category: 'Backend' })
        .expect(201);
      expect(res.body).toMatchObject({ title: 'NestJS', category: 'Backend' });
      expect(res.body.id).toBeDefined();
    });

    it('POST /api/courses inválido -> 400 com details', async () => {
      const res = await http().post('/api/courses').send({ title: 'ab' }).expect(400);
      expect(res.body.message).toBe('Erro de validação');
      expect(res.body.details).toEqual(expect.any(Array));
      expect(res.body.path).toBe('/api/courses');
      expect(res.body.timestamp).toBeDefined();
    });

    it('GET /api/courses/:id inexistente -> 404', async () => {
      const res = await http().get('/api/courses/999').expect(404);
      expect(res.body).toMatchObject({
        message: 'Curso não encontrado',
        path: '/api/courses/999',
      });
    });

    it('lista com filtro por category e paginação', async () => {
      await http().post('/api/courses').send({ title: 'SQL', category: 'Dados' }).expect(201);
      const res = await http().get('/api/courses?category=Dados&page=1&limit=5').expect(200);
      expect(res.body).toMatchObject({ page: 1, limit: 5, total: 1 });
      expect(res.body.data).toHaveLength(1);
    });

    it('PUT atualiza e DELETE remove (204 e depois 404)', async () => {
      const { body } = await http().post('/api/courses').send({ title: 'Temp' }).expect(201);
      const put = await http()
        .put(`/api/courses/${body.id}`)
        .send({ title: 'Temp 2' })
        .expect(200);
      expect(put.body.title).toBe('Temp 2');
      await http().delete(`/api/courses/${body.id}`).expect(204);
      await http().delete(`/api/courses/${body.id}`).expect(404);
      await http().put('/api/courses/999').send({ title: 'Nada' }).expect(404);
    });
  });

  describe('students', () => {
    it('POST /api/students com e-mail duplicado -> 409', async () => {
      const dto = { name: 'Ana', email: 'ana@example.com' };
      await http().post('/api/students').send(dto).expect(201);
      const res = await http().post('/api/students').send(dto).expect(409);
      expect(res.body.message).toBe('E-mail já cadastrado');
    });

    it('e-mail inválido -> 400', async () => {
      await http().post('/api/students').send({ name: 'Bia', email: 'x' }).expect(400);
    });

    it('PUT para e-mail de outro estudante -> 409', async () => {
      const { body } = await http()
        .post('/api/students')
        .send({ name: 'Caio', email: 'caio@example.com' })
        .expect(201);
      await http()
        .put(`/api/students/${body.id}`)
        .send({ name: 'Caio', email: 'ana@example.com' })
        .expect(409);
    });
  });

  describe('enrollments', () => {
    it('matricula, repete (409), lista por estudante e cancela', async () => {
      const student = (
        await http().post('/api/students').send({ name: 'Duda', email: 'duda@example.com' })
      ).body;
      const course = (await http().post('/api/courses').send({ title: 'Docker' })).body;
      const dto = { studentId: student.id, courseId: course.id };

      const created = await http().post('/api/enrollments').send(dto).expect(201);
      await http().post('/api/enrollments').send(dto).expect(409);

      const list = await http().get(`/api/students/${student.id}/enrollments`).expect(200);
      expect(list.body).toHaveLength(1);
      expect(list.body[0].course.title).toBe('Docker');

      await http().delete(`/api/enrollments/${created.body.id}`).expect(204);
      const after = await http().get(`/api/students/${student.id}/enrollments`).expect(200);
      expect(after.body).toHaveLength(0);
    });

    it('studentId ou courseId inexistente -> 404', async () => {
      await http().post('/api/enrollments').send({ studentId: 999, courseId: 1 }).expect(404);
      const { body } = await http()
        .post('/api/students')
        .send({ name: 'Edu', email: 'edu@example.com' });
      await http()
        .post('/api/enrollments')
        .send({ studentId: body.id, courseId: 999 })
        .expect(404);
    });
  });
});

describe('Consultas avançadas e relatórios (e2e)', () => {
  let app: INestApplication;
  let token: string;
  const http = () => client(app, token);

  beforeAll(async () => {
    app = await createTestApp();
    token = (await signUp(app, 'admin@example.com', 'ADMIN')).token;
    const courses = [
      { title: 'Node.js avançado', category: 'Backend', description: 'Streams e eventos' },
      { title: 'NestJS na prática', category: 'Backend' },
      { title: 'SQL essencial', category: 'Dados', description: '100% prático' },
    ];
    for (const course of courses) await http().post('/api/courses').send(course).expect(201);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('search no título ou na descrição, combinável com category', async () => {
    const byTitle = await http().get('/api/courses?search=nest').expect(200);
    expect(byTitle.body.data.map((c: { title: string }) => c.title)).toEqual(['NestJS na prática']);
    const byDescription = await http().get('/api/courses?search=streams').expect(200);
    expect(byDescription.body.total).toBe(1);
    const combined = await http().get('/api/courses?category=Backend&search=node').expect(200);
    expect(combined.body.total).toBe(1);
  });

  it('curingas do LIKE e tentativa de SQL injection são tratados como texto', async () => {
    const percent = await http().get('/api/courses?search=100%25').expect(200);
    expect(percent.body.total).toBe(1);
    const all = await http().get('/api/courses?search=%25').expect(200);
    expect(all.body.total).toBe(1);
    const injection = await http()
      .get(`/api/courses?search=${encodeURIComponent("x' OR '1'='1")}`)
      .expect(200);
    expect(injection.body.total).toBe(0);
  });

  it('relatório de matrículas por curso (inclui cursos com 0)', async () => {
    const student = await signUp(app, 'aluno@example.com');
    await http().post('/api/enrollments').send({ studentId: student.studentId, courseId: 1 }).expect(201);
    const res = await http().get('/api/reports/courses/enrollments').expect(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[0]).toMatchObject({ courseId: 1, title: 'Node.js avançado', enrollments: 1 });
    expect(res.body.slice(1).every((r: { enrollments: number }) => r.enrollments === 0)).toBe(true);
    await client(app, student.token).get('/api/reports/courses/enrollments').expect(403);
  });
});
