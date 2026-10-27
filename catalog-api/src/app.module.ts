import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from './infrastructure/audit/audit.module.js';
import { MessagingModule } from './infrastructure/messaging/messaging.module.js';
import { typeOrmOptions } from './infrastructure/persistence/typeorm.config.js';
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
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: typeOrmOptions,
    }),
    AuditModule,
    MessagingModule,
    AuditLogsModule,
    AuthModule,
    CoursesModule,
    StudentsModule,
    LessonsModule,
    ReportsModule,
    EnrollmentsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
