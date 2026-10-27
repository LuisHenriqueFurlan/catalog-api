import { existsSync } from 'node:fs';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  ImportLessonsUseCase,
  LessonCsvRow,
} from '../application/use-cases/lessons/import-lessons.usecase.js';
import { readCsvInBatches } from '../infrastructure/import/csv-batch-reader.js';
import { ImportModule } from './import.module.js';

const BATCH_SIZE = 500;
const logger = new Logger('ImportLessons');

const file = process.argv[2];
if (!file || !existsSync(file)) {
  logger.error('Uso: npm run import:lessons -- <arquivo.csv>');
  process.exit(1);
}

const app = await NestFactory.createApplicationContext(ImportModule, {
  logger: ['log', 'warn', 'error'],
});
const started = Date.now();
const summary = await app
  .get(ImportLessonsUseCase)
  .execute(readCsvInBatches<LessonCsvRow>(file, BATCH_SIZE));
logger.log(
  `Concluído em ${((Date.now() - started) / 1000).toFixed(1)}s: ${summary.processed} lidos, ` +
    `${summary.imported} importados, ${summary.skippedDuplicates} duplicados, ` +
    `${summary.invalid} inválidos`,
);
await app.close();
