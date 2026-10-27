import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { migrations } from './infrastructure/persistence/migrations/index.js';
import { ormEntities } from './infrastructure/persistence/typeorm/entities/index.js';
import { HealthController } from './presentation/controllers/health.controller.js';
import { CoursesModule } from './presentation/modules/courses.module.js';
import { EnrollmentsModule } from './presentation/modules/enrollments.module.js';
import { StudentsModule } from './presentation/modules/students.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'better-sqlite3',
        database: config
          .get<string>('DATABASE_URL', 'file:./data/catalog.db')
          .replace(/^file:/, ''),
        entities: ormEntities,
        migrations,
        migrationsRun: true,
        synchronize: false,
      }),
    }),
    CoursesModule,
    StudentsModule,
    EnrollmentsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
