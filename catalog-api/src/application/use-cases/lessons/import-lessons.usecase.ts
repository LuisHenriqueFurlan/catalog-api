import { Injectable, Logger } from '@nestjs/common';
import { Lesson } from '../../../domain/entities/lesson.entity.js';
import { DomainError } from '../../../domain/errors.js';
import { ICourseRepository } from '../../../domain/repositories/course.repository.js';
import { ILessonRepository } from '../../../domain/repositories/lesson.repository.js';

export interface LessonCsvRow {
  courseId: string;
  title: string;
  order: string;
  contentUrl: string;
}

export interface ImportSummary {
  processed: number;
  imported: number;
  skippedDuplicates: number;
  invalid: number;
}

const MAX_LOGGED_ERRORS = 20;
const URL_PATTERN = /^https?:\/\/\S+$/;

@Injectable()
export class ImportLessonsUseCase {
  private readonly logger = new Logger(ImportLessonsUseCase.name);

  constructor(
    private readonly lessons: ILessonRepository,
    private readonly courses: ICourseRepository,
  ) {}

  async execute(batches: AsyncIterable<LessonCsvRow[]>): Promise<ImportSummary> {
    const summary: ImportSummary = { processed: 0, imported: 0, skippedDuplicates: 0, invalid: 0 };
    const knownCourses = new Map<number, boolean>();
    let loggedErrors = 0;

    const reject = (line: number, reason: string) => {
      summary.invalid++;
      if (loggedErrors++ < MAX_LOGGED_ERRORS) {
        this.logger.warn(`Linha ${line} ignorada: ${reason}`);
      }
    };

    for await (const batch of batches) {
      const firstLine = summary.processed + 2;
      const valid: { lesson: Lesson; line: number }[] = [];

      batch.forEach((row, index) => {
        const line = firstLine + index;
        try {
          const lesson = Lesson.create({
            courseId: Number(row.courseId),
            title: row.title ?? '',
            order: Number(row.order),
            contentUrl: row.contentUrl ?? '',
          });
          if (!Number.isInteger(lesson.courseId) || lesson.courseId < 1) {
            return reject(line, 'courseId inválido');
          }
          if (!URL_PATTERN.test(lesson.contentUrl)) {
            return reject(line, 'contentUrl inválida');
          }
          valid.push({ lesson, line });
        } catch (error) {
          if (error instanceof DomainError) return reject(line, error.message);
          throw error;
        }
      });

      const courseIds = [...new Set(valid.map((v) => v.lesson.courseId))];
      for (const id of courseIds) {
        if (!knownCourses.has(id)) knownCourses.set(id, !!(await this.courses.findById(id)));
      }
      const existing = await this.lessons.findExistingOrders(
        valid.map((v) => v.lesson).filter((l) => knownCourses.get(l.courseId)),
      );

      const toInsert: Lesson[] = [];
      valid.forEach(({ lesson, line }) => {
        const key = `${lesson.courseId}:${lesson.order}`;
        if (!knownCourses.get(lesson.courseId)) {
          reject(line, `curso ${lesson.courseId} não existe`);
        } else if (existing.has(key)) {
          summary.skippedDuplicates++;
        } else {
          existing.add(key);
          toInsert.push(lesson);
        }
      });

      await this.lessons.saveMany(toInsert);
      summary.imported += toInsert.length;
      summary.processed += batch.length;
      this.logger.log(
        `${summary.processed} registros processados (${summary.imported} importados, ` +
          `${summary.skippedDuplicates} duplicados, ${summary.invalid} inválidos)`,
      );
      await new Promise<void>((resolve) => setImmediate(resolve));
    }
    return summary;
  }
}
