import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IAuditLog } from '../../application/ports/audit-log.js';
import { AuditLogEntry } from '../../domain/entities/audit-log.entity.js';
import { Paginated } from '../../domain/pagination.js';
import {
  AuditLogFilter,
  IAuditLogRepository,
} from '../../domain/repositories/audit-log.repository.js';
import { AuditLogDocument } from './audit-log.schema.js';

@Injectable()
export class AuditLogService implements IAuditLog, IAuditLogRepository {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectModel(AuditLogDocument.name) private readonly model: Model<AuditLogDocument>,
  ) {}

  async record(
    event: string,
    actorId: number | string | null,
    payload: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.append({
        event,
        timestamp: new Date(),
        actorId: actorId === null ? null : String(actorId),
        payload,
      });
    } catch (error) {
      this.logger.error(`Falha ao registrar auditoria de ${event}`, error as Error);
    }
  }

  async append(entry: AuditLogEntry): Promise<void> {
    await this.model.create(entry);
  }

  async find(filter: AuditLogFilter): Promise<Paginated<AuditLogEntry>> {
    const { page, limit, event, studentId, from, to } = filter;
    const query: Record<string, unknown> = {};
    if (event) query.event = { $eq: event };
    if (studentId) query['payload.studentId'] = { $eq: studentId };
    if (from || to) {
      query.timestamp = {
        ...(from && { $gte: from }),
        ...(to && { $lte: to }),
      };
    }
    const [rows, total] = await Promise.all([
      this.model
        .find(query, { _id: 0 })
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<AuditLogEntry[]>(),
      this.model.countDocuments(query),
    ]);
    return { data: rows, page, limit, total };
  }
}
