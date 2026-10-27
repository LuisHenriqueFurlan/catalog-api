import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { DataSource } from 'typeorm';
import { BrokerState, IBrokerStatus } from '../messaging/broker-status.js';

export type ComponentState = 'up' | 'down' | 'disabled';

export interface ComponentHealth {
  status: ComponentState;
  latencyMs?: number;
  error?: string;
}

export interface HealthReport {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  uptimeSeconds: number;
  components: {
    database: ComponentHealth;
    mongo: ComponentHealth;
    broker: ComponentHealth;
  };
}

const CHECK_TIMEOUT_MS = 2000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout após ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

@Injectable()
export class HealthService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectConnection() private readonly mongo: Connection,
    private readonly broker: IBrokerStatus,
  ) {}

  async check(): Promise<HealthReport> {
    const [database, mongo, broker] = await Promise.all([
      this.probe(() => this.dataSource.query('SELECT 1')),
      this.probe(async () => {
        if (this.mongo.readyState !== 1 || !this.mongo.db) throw new Error('desconectado');
        await this.mongo.db.admin().ping();
      }),
      this.brokerHealth(),
    ]);

    const status =
      database.status === 'down'
        ? 'down'
        : mongo.status === 'down' || broker.status === 'down'
          ? 'degraded'
          : 'ok';

    return {
      status,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      components: { database, mongo, broker },
    };
  }

  private async probe(fn: () => Promise<unknown>): Promise<ComponentHealth> {
    const started = Date.now();
    try {
      await withTimeout(fn(), CHECK_TIMEOUT_MS);
      return { status: 'up', latencyMs: Date.now() - started };
    } catch (error) {
      return { status: 'down', error: (error as Error).message };
    }
  }

  private async brokerHealth(): Promise<ComponentHealth> {
    const started = Date.now();
    let state: BrokerState;
    try {
      state = await withTimeout(this.broker.check(), CHECK_TIMEOUT_MS);
    } catch (error) {
      return { status: 'down', error: (error as Error).message };
    }
    return state === 'up' ? { status: 'up', latencyMs: Date.now() - started } : { status: state };
  }
}
