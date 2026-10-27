import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuditModule } from './infrastructure/audit/audit.module.js';
import { AuditEventsConsumer } from './infrastructure/messaging/audit-events.consumer.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuditModule],
  providers: [AuditEventsConsumer],
})
export class WorkerModule {}
