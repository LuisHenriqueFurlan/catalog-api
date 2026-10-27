import { Module } from '@nestjs/common';
import { ListAuditLogsUseCase } from '../../application/use-cases/audit/list-audit-logs.usecase.js';
import { AuditLogsController } from '../controllers/audit-logs.controller.js';

@Module({
  controllers: [AuditLogsController],
  providers: [ListAuditLogsUseCase],
})
export class AuditLogsModule {}
