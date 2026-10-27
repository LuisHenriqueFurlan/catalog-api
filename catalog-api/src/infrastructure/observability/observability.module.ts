import { Global, Module } from '@nestjs/common';
import { HealthService } from './health.service.js';
import { MetricsService } from './metrics.service.js';

@Global()
@Module({
  providers: [HealthService, MetricsService],
  exports: [HealthService, MetricsService],
})
export class ObservabilityModule {}
