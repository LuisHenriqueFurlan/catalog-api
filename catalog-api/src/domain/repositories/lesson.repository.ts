import { Lesson } from '../entities/lesson.entity.js';

export abstract class ILessonRepository {
  abstract findByCourse(courseId: number): Promise<Lesson[]>;
  abstract findById(id: number): Promise<Lesson | null>;
  abstract findByCourseAndOrder(courseId: number, order: number): Promise<Lesson | null>;
  abstract countByCourse(courseId: number): Promise<number>;
  abstract save(lesson: Lesson): Promise<Lesson>;
}
