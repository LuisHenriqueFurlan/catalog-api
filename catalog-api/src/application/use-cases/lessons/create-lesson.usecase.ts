import { Injectable } from '@nestjs/common';
import { Lesson, LessonProps } from '../../../domain/entities/lesson.entity.js';
import { CourseNotFoundError, DuplicateLessonOrderError } from '../../../domain/errors.js';
import { ICourseRepository } from '../../../domain/repositories/course.repository.js';
import { ILessonRepository } from '../../../domain/repositories/lesson.repository.js';

@Injectable()
export class CreateLessonUseCase {
  constructor(
    private readonly lessons: ILessonRepository,
    private readonly courses: ICourseRepository,
  ) {}

  async execute(input: LessonProps): Promise<Lesson> {
    if (!(await this.courses.findById(input.courseId))) throw new CourseNotFoundError();
    const lesson = Lesson.create(input);
    if (await this.lessons.findByCourseAndOrder(input.courseId, lesson.order)) {
      throw new DuplicateLessonOrderError();
    }
    return this.lessons.save(lesson);
  }
}
