import { LessonProgress } from '../entities/lesson-progress.entity.js';

export abstract class ILessonProgressRepository {
  abstract findByStudentAndLesson(
    studentId: number,
    lessonId: number,
  ): Promise<LessonProgress | null>;
  /** Quantas aulas do curso o estudante já concluiu (uma única query com JOIN). */
  abstract countCompletedInCourse(studentId: number, courseId: number): Promise<number>;
  abstract save(progress: LessonProgress): Promise<LessonProgress>;
}
