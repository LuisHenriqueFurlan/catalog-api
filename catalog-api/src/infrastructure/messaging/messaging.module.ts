import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IEventPublisher } from '../../application/ports/event-publisher.js';
import { AuditLogService } from '../audit/audit-log.service.js';
import { IBrokerStatus } from './broker-status.js';
import { InlineEventPublisher } from './inline-event-publisher.js';
import { RabbitMqEventPublisher } from './rabbitmq-event-publisher.js';

@Global()
@Module({
  providers: [
    {
      provide: IEventPublisher,
      inject: [ConfigService, AuditLogService],
      useFactory: (config: ConfigService, audit: AuditLogService): IEventPublisher => {
        const url = config.get<string>('RABBITMQ_URL');
        return url ? new RabbitMqEventPublisher(url) : new InlineEventPublisher(audit);
      },
    },
    { provide: IBrokerStatus, useExisting: IEventPublisher },
  ],
  exports: [IEventPublisher, IBrokerStatus],
})
export class MessagingModule {}
