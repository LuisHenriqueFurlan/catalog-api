import { Connection } from 'mongoose';
import { DataSource } from 'typeorm';
import { BrokerState, IBrokerStatus } from '../messaging/broker-status.js';
import { HealthService } from './health.service.js';

function build(options: { db?: boolean; mongo?: boolean; broker?: BrokerState }) {
  const { db = true, mongo = true, broker = 'disabled' } = options;
  const dataSource = {
    query: async () => {
      if (!db) throw new Error('banco fora');
    },
  } as unknown as DataSource;
  const connection = {
    readyState: mongo ? 1 : 0,
    db: { admin: () => ({ ping: async () => ({ ok: 1 }) }) },
  } as unknown as Connection;
  const brokerStatus = { check: async () => broker } as IBrokerStatus;
  return new HealthService(dataSource, connection, brokerStatus);
}

describe('HealthService', () => {
  it('ok quando tudo responde (broker desativado não conta como falha)', async () => {
    const report = await build({}).check();
    expect(report.status).toBe('ok');
    expect(report.components.database.status).toBe('up');
    expect(report.components.mongo.status).toBe('up');
    expect(report.components.broker.status).toBe('disabled');
  });

  it('degraded quando Mongo ou broker estão fora', async () => {
    expect((await build({ mongo: false }).check()).status).toBe('degraded');
    const report = await build({ broker: 'down' }).check();
    expect(report.status).toBe('degraded');
    expect(report.components.broker.status).toBe('down');
  });

  it('down quando o banco relacional está fora', async () => {
    const report = await build({ db: false }).check();
    expect(report.status).toBe('down');
    expect(report.components.database).toMatchObject({ status: 'down', error: 'banco fora' });
  });
});
