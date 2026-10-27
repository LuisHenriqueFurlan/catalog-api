import { INestApplication } from '@nestjs/common';
import { client, closeTestApp, createTestApp, signUp } from './helpers.js';

describe('Observabilidade (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('devolve x-request-id (gera um ou reaproveita o enviado)', async () => {
    const generated = await client(app).get('/api/courses').expect(401);
    expect(generated.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    const echoed = await client(app).get('/api/courses').set('x-request-id', 'abc-123').expect(401);
    expect(echoed.headers['x-request-id']).toBe('abc-123');
  });

  it('o corpo de erro inclui o mesmo requestId do header', async () => {
    const { token } = await signUp(app, 'obs@example.com');
    const res = await client(app, token).get('/api/courses/999').set('x-request-id', 'req-42').expect(404);
    expect(res.body.requestId).toBe('req-42');
    expect(res.body.path).toBe('/api/courses/999');
  });

  it('/metrics expõe métricas no formato Prometheus, inclusive contadores HTTP', async () => {
    await client(app).get('/health').expect(200);
    const res = await client(app).get('/metrics').expect(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toContain('process_cpu_user_seconds_total');
    expect(res.text).toMatch(/http_requests_total\{method="GET",route="\/health",status="200"\} \d+/);
  });
});
