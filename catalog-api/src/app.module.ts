import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validateEnv } from './infrastructure/config/env.validation.js';
import { loggerParams } from './infrastructure/observability/logging.config.js';
import { ObservabilityModule } from './infrastructure/observability/observability.module.js';
import { AuditModule } from './infrastructure/audit/audit.module.js';
import { MessagingModule } from './infrastructure/messaging/messaging.module.js';
import { typeOrmOptions } from './infrastructure/persistence/typeorm.config.js';
import { MetricsController } from './presentation/controllers/metrics.controller.js';
import { HealthController } from './presentation/controllers/health.controller.js';
import { AuditLogsModule } from './presentation/modules/audit.module.js';
import { AuthModule } from './presentation/modules/auth.module.js';
import { CoursesModule } from './presentation/modules/courses.module.js';
import { EnrollmentsModule } from './presentation/modules/enrollments.module.js';
import { LessonsModule } from './presentation/modules/lessons.module.js';
import { ReportsModule } from './presentation/modules/reports.module.js';
import { StudentsModule } from './presentation/modules/students.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      ignoreEnvFile: process.env.NODE_ENV === 'test',
    }),
    LoggerModule.forRootAsync({ inject: [ConfigService], useFactory: loggerParams }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        { name: 'default', ttl: 60_000, limit: config.get<number>('THROTTLE_LIMIT', 120) },
        {
          name: 'auth',
          ttl: 60_000,
          limit: config.get<number>('THROTTLE_AUTH_LIMIT', 10),
          skipIf: (context) =>
            !context.switchToHttp().getRequest<{ path: string }>().path.startsWith('/api/auth'),
        },
      ],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: typeOrmOptions,
    }),
    AuditModule,
    MessagingModule,
    ObservabilityModule,
    AuditLogsModule,
    AuthModule,
    CoursesModule,
    StudentsModule,
    LessonsModule,
    ReportsModule,
    EnrollmentsModule,
  ],
  controllers: [HealthController, MetricsController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
