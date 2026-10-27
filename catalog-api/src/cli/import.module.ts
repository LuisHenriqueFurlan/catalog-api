import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportLessonsUseCase } from '../application/use-cases/lessons/import-lessons.usecase.js';
import { PersistenceModule } from '../infrastructure/persistence/persistence.module.js';
import { typeOrmOptions } from '../infrastructure/persistence/typeorm.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({ inject: [ConfigService], useFactory: typeOrmOptions }),
    PersistenceModule,
  ],
  providers: [ImportLessonsUseCase],
})
export class ImportModule {}
