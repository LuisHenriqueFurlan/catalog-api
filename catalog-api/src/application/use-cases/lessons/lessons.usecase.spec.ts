import { Lesson } from '../../../domain/entities/lesson.entity.js';
import { LessonProgress } from '../../../domain/entities/lesson-progress.entity.js';
import { Student } from '../../../domain/entities/student.entity.js';
import { Enrollment } from '../../../domain/entities/enrollment.entity.js';
import { Course } from '../../../domain/entities/course.entity.js';
import { LessonNotFoundError, NotEnrolledError } from '../../../domain/errors.js';
import { ICourseRepository } from '../../../domain/repositories/course.repository.js';
import { IEnrollmentRepository } from '../../../domain/repositories/enrollment.repository.js';
import { ILessonProgressRepository } from '../../../domain/repositories/lesson-progress.repository.js';
import { ILessonRepository } from '../../../domain/repositories/lesson.repository.js';
import { IStudentRepository } from '../../../domain/repositories/student.repository.js';
import { IEventPublisher } from '../../ports/event-publisher.js';
import { CompleteLessonUseCase } from './complete-lesson.usecase.js';
import { GetStudentCourseProgressUseCase } from './get-student-course-progress.usecase.js';

const now = new Date();
const lessonRows = [1, 2, 3, 4].map((n) =>
  Lesson.restore({ id: n, courseId: 1, title: `Aula ${n}`, order: n, contentUrl: 'https://x.io', createdAt: now }),
);

function setup(enrolled: boolean) {
  const store: LessonProgress[] = [];
  const lessons = {
    findById: async (id: number) => lessonRows.find((l) => l.id === id) ?? null,
    countByCourse: async () => lessonRows.length,
  } as unknown as ILessonRepository;
  const progress = {
    findByStudentAndLesson: async (s: number, l: number) =>
      store.find((p) => p.studentId === s && p.lessonId === l) ?? null,
    countCompletedInCourse: async () => store.filter((p) => p.isCompleted).length,
    save: async (p: LessonProgress) => {
      if (!store.includes(p)) store.push(p);
      return p;
    },
  } as unknown as ILessonProgressRepository;
  const students = {
    findById: async () => Student.restore({ id: 1, name: 'Ana', email: 'a@a.com', createdAt: now }),
  } as unknown as IStudentRepository;
  const courses = {
    findById: async () => Course.restore({ id: 1, title: 'Nest', category: null, description: null, createdAt: now }),
  } as unknown as ICourseRepository;
  const enrollments = {
    findByPair: async () => (enrolled ? Enrollment.restore({ id: 1, studentId: 1, courseId: 1, createdAt: now }) : null),
  } as unknown as IEnrollmentRepository;
  const events: string[] = [];
  const audit = {
    publish: async (message: { event: string }) => {
      events.push(message.event);
    },
  } as unknown as IEventPublisher;
  return {
    events,
    complete: new CompleteLessonUseCase(lessons, progress, students, enrollments, audit),
    getProgress: new GetStudentCourseProgressUseCase(lessons, progress, students, courses, enrollments),
  };
}

describe('CompleteLessonUseCase', () => {
  it('rejeita estudante não matriculado no curso da aula', async () => {
    const { complete } = setup(false);
    await expect(complete.execute({ studentId: 1, lessonId: 1 })).rejects.toThrow(NotEnrolledError);
  });

  it('aula inexistente -> LessonNotFoundError', async () => {
    const { complete } = setup(true);
    await expect(complete.execute({ studentId: 1, lessonId: 99 })).rejects.toThrow(LessonNotFoundError);
  });

  it('conclui, preenche completedAt e é idempotente', async () => {
    const { complete, events } = setup(true);
    const first = await complete.execute({ studentId: 1, lessonId: 1 });
    expect(first.status).toBe('completed');
    expect(first.completedAt).toBeInstanceOf(Date);
    const again = await complete.execute({ studentId: 1, lessonId: 1 });
    expect(again.completedAt).toBe(first.completedAt);
    expect(events).toEqual(['lesson.completed']);
  });
});

describe('GetStudentCourseProgressUseCase', () => {
  it('calcula a porcentagem de aulas concluídas', async () => {
    const { complete, getProgress } = setup(true);
    await complete.execute({ studentId: 1, lessonId: 1 });
    await complete.execute({ studentId: 1, lessonId: 2 });
    expect(await getProgress.execute({ studentId: 1, courseId: 1 })).toEqual({
      studentId: 1,
      courseId: 1,
      totalLessons: 4,
      completedLessons: 2,
      percentage: 50,
    });
  });

  it('exige matrícula', async () => {
    const { getProgress } = setup(false);
    await expect(getProgress.execute({ studentId: 1, courseId: 1 })).rejects.toThrow(NotEnrolledError);
  });
});
