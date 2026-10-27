import { LessonProgress } from '../entities/lesson-progress.entity.js';

export abstract class ILessonProgressRepository {
  abstract findByStudentAndLesson(
    studentId: number,
    lessonId: number,
  ): Promise<LessonProgress | null>;
  abstract findCompletedLessonIds(studentId: number, courseId: number): Promise<number[]>;
  abstract save(progress: LessonProgress): Promise<LessonProgress>;
}
