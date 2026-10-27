import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './helpers.js';

describe('Lessons (e2e)', () => {
  let app: INestApplication;
  const http = () => request(app.getHttpServer());
  let courseId: number;
  let studentId: number;
  let lessonIds: number[] = [];

  beforeAll(async () => {
    app = await createTestApp();
    courseId = (await http().post('/api/courses').send({ title: 'Curso com aulas' })).body.id;
    studentId = (
      await http().post('/api/students').send({ name: 'Leo', email: 'leo@example.com' })
    ).body.id;
    for (const order of [1, 2]) {
      const res = await http()
        .post(`/api/courses/${courseId}/lessons`)
        .send({ title: `Aula ${order}`, order, contentUrl: 'https://cdn.example.com/a.mp4' })
        .expect(201);
      lessonIds.push(res.body.id);
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('lista aulas do curso em ordem e rejeita ordem repetida (409)', async () => {
    const res = await http().get(`/api/courses/${courseId}/lessons`).expect(200);
    expect(res.body.map((l: { order: number }) => l.order)).toEqual([1, 2]);
    await http()
      .post(`/api/courses/${courseId}/lessons`)
      .send({ title: 'Repetida', order: 1, contentUrl: 'https://cdn.example.com/b.mp4' })
      .expect(409);
    await http().get('/api/courses/999/lessons').expect(404);
  });

  it('sem matrícula: concluir aula e ver progresso -> 403', async () => {
    await http().post(`/api/lessons/${lessonIds[0]}/complete`).send({ studentId }).expect(403);
    await http().get(`/api/students/${studentId}/courses/${courseId}/progress`).expect(403);
  });

  it('matriculado: conclui aula (idempotente) e consulta progresso', async () => {
    await http().post('/api/enrollments').send({ studentId, courseId }).expect(201);
    const first = await http().post(`/api/lessons/${lessonIds[0]}/complete`).send({ studentId }).expect(200);
    expect(first.body.status).toBe('completed');
    expect(first.body.completedAt).toBeTruthy();
    const again = await http().post(`/api/lessons/${lessonIds[0]}/complete`).send({ studentId }).expect(200);
    expect(again.body.completedAt).toBe(first.body.completedAt);

    const res = await http().get(`/api/students/${studentId}/courses/${courseId}/progress`).expect(200);
    expect(res.body).toMatchObject({ totalLessons: 2, completedLessons: 1, percentage: 50 });
  });

  it('aula inexistente -> 404', async () => {
    await http().post('/api/lessons/999/complete').send({ studentId }).expect(404);
  });
});
