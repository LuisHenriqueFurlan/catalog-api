import { Controller, Get, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { Public } from '../../infrastructure/auth/decorators.js';
import {
  HealthReport,
  HealthService,
} from '../../infrastructure/observability/health.service.js';

@ApiTags('health')
@SkipThrottle({ default: true, auth: true })
@Controller()
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Public()
  @Get('health')
  @ApiOperation({
    summary: 'Saúde da aplicação: ok, degraded (Mongo/broker fora) ou down (banco fora, HTTP 503)',
  })
  async check(@Res({ passthrough: true }) res: Response): Promise<HealthReport> {
    const report = await this.health.check();
    if (report.status === 'down') res.status(503);
    return report;
  }
}
