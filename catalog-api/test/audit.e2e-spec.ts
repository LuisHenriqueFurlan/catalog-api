import { INestApplication } from '@nestjs/common';
import { client, closeTestApp, createTestApp, signUp } from './helpers.js';

describe('Audit logs (e2e)', () => {
  let app: INestApplication;
  let admin: { token: string };
  let ana: { token: string; studentId: number; userId: number };
  let bia: { token: string; studentId: number };
  let lessonId: number;
  let before: string;

  beforeAll(async () => {
    app = await createTestApp();
    admin = await signUp(app, 'admin@example.com', 'ADMIN');
    ana = await signUp(app, 'ana@example.com');
    bia = await signUp(app, 'bia@example.com');
    const course = (await client(app, admin.token).post('/api/courses').send({ title: 'Auditoria' })).body;
    lessonId = (
      await client(app, admin.token)
        .post(`/api/courses/${course.id}/lessons`)
        .send({ title: 'Aula 1', order: 1, contentUrl: 'https://cdn.example.com/a.mp4' })
    ).body.id;
    before = new Date().toISOString();
    await client(app, ana.token).post('/api/enrollments').send({ studentId: ana.studentId, courseId: course.id }).expect(201);
    await client(app, bia.token).post('/api/enrollments').send({ studentId: bia.studentId, courseId: course.id }).expect(201);
    await client(app, ana.token).post(`/api/lessons/${lessonId}/complete`).send({ studentId: ana.studentId }).expect(200);
    await client(app, ana.token).post(`/api/lessons/${lessonId}/complete`).send({ studentId: ana.studentId }).expect(200);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  const list = (query = '') => client(app, admin.token).get(`/api/audit-logs${query}`).expect(200);

  it('registra student.enrolled e lesson.completed (conclusão repetida não duplica)', async () => {
    const all = await list();
    expect(all.body.total).toBe(3);
    const completed = await list('?event=lesson.completed');
    expect(completed.body.total).toBe(1);
    expect(completed.body.data[0]).toMatchObject({
      event: 'lesson.completed',
      actorId: String(ana.userId),
      payload: { studentId: String(ana.studentId), lessonId: String(lessonId) },
    });
  });

  it('filtra por event, studentId e período', async () => {
    expect((await list('?event=student.enrolled')).body.total).toBe(2);
    expect((await list(`?studentId=${bia.studentId}`)).body.total).toBe(1);
    expect((await list(`?studentId=${ana.studentId}&event=student.enrolled`)).body.total).toBe(1);
    expect((await list(`?from=${encodeURIComponent(before)}`)).body.total).toBe(3);
    const future = encodeURIComponent(new Date(Date.now() + 60_000).toISOString());
    expect((await list(`?from=${future}`)).body.total).toBe(0);
    expect((await list(`?to=${encodeURIComponent(before)}`)).body.total).toBe(0);
  });

  it('filtro malicioso é tratado como valor literal; data inválida -> 400', async () => {
    const res = await list(`?event=${encodeURIComponent('{"$ne":"x"}')}`);
    expect(res.body.total).toBe(0);
    await client(app, admin.token).get('/api/audit-logs?from=ontem').expect(400);
  });

  it('somente ADMIN acessa (STUDENT 403, sem token 401)', async () => {
    await client(app, ana.token).get('/api/audit-logs').expect(403);
    await client(app).get('/api/audit-logs').expect(401);
  });
});
