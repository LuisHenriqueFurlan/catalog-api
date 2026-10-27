import { Injectable } from '@nestjs/common';
import { DomainEventMessage, IEventPublisher } from '../../application/ports/event-publisher.js';
import { BrokerState, IBrokerStatus } from './broker-status.js';
import { AuditLogService } from '../audit/audit-log.service.js';

@Injectable()
export class InlineEventPublisher implements IEventPublisher, IBrokerStatus {
  constructor(private readonly audit: AuditLogService) {}

  publish(message: DomainEventMessage): Promise<void> {
    return this.audit.record(message.event, message.actorId, message.payload);
  }

  async check(): Promise<BrokerState> {
    return 'disabled';
  }
}
