import type { Response } from 'express';
import { HealthController } from './health.controller.js';
import {
  HealthReport,
  HealthService,
} from '../../infrastructure/observability/health.service.js';

const report = (status: HealthReport['status']): HealthReport => ({
  status,
  timestamp: new Date().toISOString(),
  uptimeSeconds: 1,
  components: {
    database: { status: 'up' },
    mongo: { status: 'up' },
    broker: { status: 'disabled' },
  },
});

describe('HealthController', () => {
  const run = async (status: HealthReport['status']) => {
    const controller = new HealthController({ check: async () => report(status) } as HealthService);
    const res = { status: vi.fn() } as unknown as Response;
    const body = await controller.check(res);
    return { body, res };
  };

  it('ok e degraded respondem 200 (sem alterar o status)', async () => {
    for (const status of ['ok', 'degraded'] as const) {
      const { body, res } = await run(status);
      expect(body.status).toBe(status);
      expect(res.status).not.toHaveBeenCalled();
    }
  });

  it('down responde 503', async () => {
    const { res } = await run('down');
    expect(res.status).toHaveBeenCalledWith(503);
  });
});
