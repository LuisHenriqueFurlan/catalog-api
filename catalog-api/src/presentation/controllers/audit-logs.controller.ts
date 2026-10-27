import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListAuditLogsUseCase } from '../../application/use-cases/audit/list-audit-logs.usecase.js';
import { Roles } from '../../infrastructure/auth/decorators.js';
import { ListAuditLogsQueryDto } from '../dtos/list-audit-logs-query.dto.js';

@ApiBearerAuth()
@ApiTags('audit')
@Roles('ADMIN')
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly listAuditLogs: ListAuditLogsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Lista logs de auditoria (filtros: event, studentId, from, to)' })
  findAll(@Query() query: ListAuditLogsQueryDto) {
    return this.listAuditLogs.execute(query);
  }
}
