import { Injectable } from '@nestjs/common';
import { AuditLogEntry } from '../../../domain/entities/audit-log.entity.js';
import { Paginated } from '../../../domain/pagination.js';
import {
  AuditLogFilter,
  IAuditLogRepository,
} from '../../../domain/repositories/audit-log.repository.js';

@Injectable()
export class ListAuditLogsUseCase {
  constructor(private readonly logs: IAuditLogRepository) {}

  execute(filter: AuditLogFilter): Promise<Paginated<AuditLogEntry>> {
    return this.logs.find(filter);
  }
}
