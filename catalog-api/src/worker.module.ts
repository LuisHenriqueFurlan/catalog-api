import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AuditModule } from './infrastructure/audit/audit.module.js';
import { loggerParams } from './infrastructure/observability/logging.config.js';
import { AuditEventsConsumer } from './infrastructure/messaging/audit-events.consumer.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRootAsync({ inject: [ConfigService], useFactory: loggerParams }),
    AuditModule,
  ],
  providers: [AuditEventsConsumer],
})
export class WorkerModule {}
