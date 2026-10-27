import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { entities } from './database/data-source.js';
import { CoursesModule } from './courses/courses.module.js';
import { StudentsModule } from './students/students.module.js';
import { EnrollmentsModule } from './enrollments/enrollments.module.js';

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
        entities,
        synchronize: false,
      }),
    }),
    CoursesModule,
    StudentsModule,
    EnrollmentsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
