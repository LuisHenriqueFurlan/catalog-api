import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { DEFAULT_MONGO_URL } from './mongo.constants.js';

const RETRY_DELAY_MS = 5000;

@Injectable()
export class MongoReconnector implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(MongoReconnector.name);
  private timer?: NodeJS.Timeout;
  private stopped = false;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly config: ConfigService,
  ) {}

  onApplicationBootstrap(): void {
    this.connection.on('error', (error: Error) => this.logger.warn(`MongoDB: ${error.message}`));
    this.connection.on('connected', () => this.logger.log('MongoDB conectado'));
    this.schedule(RETRY_DELAY_MS);
  }

  onModuleDestroy(): void {
    this.stopped = true;
    clearTimeout(this.timer);
  }

  private schedule(delay: number): void {
    if (this.stopped) return;
    this.timer = setTimeout(() => void this.ensureConnected(), delay);
    this.timer.unref();
  }

  private async ensureConnected(): Promise<void> {
    if (this.connection.readyState === 0) {
      const uri = this.config.get<string>('MONGO_URL', DEFAULT_MONGO_URL);
      try {
        await this.connection.openUri(uri, { serverSelectionTimeoutMS: 3000 });
      } catch (error) {
        this.logger.warn(`MongoDB indisponível (${(error as Error).message}); nova tentativa em ${RETRY_DELAY_MS}ms`);
      }
    }
    this.schedule(RETRY_DELAY_MS);
  }
}
