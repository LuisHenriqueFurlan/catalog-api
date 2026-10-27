import { Course } from '../../../domain/entities/course.entity.js';
import { Lesson } from '../../../domain/entities/lesson.entity.js';
import { ICourseRepository } from '../../../domain/repositories/course.repository.js';
import { ILessonRepository } from '../../../domain/repositories/lesson.repository.js';
import { ImportLessonsUseCase, LessonCsvRow } from './import-lessons.usecase.js';

async function* source(...batches: LessonCsvRow[][]) {
  for (const batch of batches) yield batch;
}

const row = (courseId: string, order: string, title = 'Aula válida', url = 'https://x.io/a.mp4') => ({
  courseId,
  order,
  title,
  contentUrl: url,
});

function setup() {
  const stored: Lesson[] = [];
  const lessons = {
    findExistingOrders: async (items: Lesson[]) =>
      new Set(
        stored
          .filter((s) => items.some((i) => i.courseId === s.courseId))
          .map((s) => `${s.courseId}:${s.order}`),
      ),
    saveMany: async (items: Lesson[]) => {
      stored.push(...items);
    },
  } as unknown as ILessonRepository;
  const courses = {
    findById: async (id: number) =>
      id === 1
        ? Course.restore({ id: 1, title: 'Nest', category: null, description: null, createdAt: new Date() })
        : null,
  } as unknown as ICourseRepository;
  return { stored, useCase: new ImportLessonsUseCase(lessons, courses) };
}

describe('ImportLessonsUseCase', () => {
  it('importa linhas válidas e descarta inválidas, duplicadas e de curso inexistente', async () => {
    const { stored, useCase } = setup();
    const summary = await useCase.execute(
      source([
        row('1', '1'),
        row('1', '2'),
        row('1', '2'),
        row('1', '3', 'ab'),
        row('1', '0'),
        row('1', '4', 'Aula válida', 'ftp://x'),
        row('9', '1'),
      ]),
    );
    expect(summary).toEqual({ processed: 7, imported: 2, skippedDuplicates: 1, invalid: 4 });
    expect(stored.map((l) => l.order)).toEqual([1, 2]);
  });

  it('processa vários lotes e é idempotente', async () => {
    const { stored, useCase } = setup();
    const batches = () => source([row('1', '1'), row('1', '2')], [row('1', '3')]);
    expect((await useCase.execute(batches())).imported).toBe(3);
    const again = await useCase.execute(batches());
    expect(again).toMatchObject({ processed: 3, imported: 0, skippedDuplicates: 3 });
    expect(stored).toHaveLength(3);
  });
});
