import { AuditLogEntry } from '../entities/audit-log.entity.js';
import { Paginated, PageQuery } from '../pagination.js';

export interface AuditLogFilter extends PageQuery {
  event?: string;
  studentId?: string;
  from?: Date;
  to?: Date;
}

export abstract class IAuditLogRepository {
  abstract append(entry: AuditLogEntry): Promise<void>;
  abstract find(filter: AuditLogFilter): Promise<Paginated<AuditLogEntry>>;
}
