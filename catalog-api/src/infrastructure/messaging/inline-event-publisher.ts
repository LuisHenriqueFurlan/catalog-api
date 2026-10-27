import { Injectable } from '@nestjs/common';
import { DomainEventMessage, IEventPublisher } from '../../application/ports/event-publisher.js';
import { AuditLogService } from '../audit/audit-log.service.js';

@Injectable()
export class InlineEventPublisher implements IEventPublisher {
  constructor(private readonly audit: AuditLogService) {}

  publish(message: DomainEventMessage): Promise<void> {
    return this.audit.record(message.event, message.actorId, message.payload);
  }
}
