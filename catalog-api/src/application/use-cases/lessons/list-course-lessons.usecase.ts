import { Injectable } from '@nestjs/common';
import { Lesson } from '../../../domain/entities/lesson.entity.js';
import { CourseNotFoundError } from '../../../domain/errors.js';
import { ICourseRepository } from '../../../domain/repositories/course.repository.js';
import { ILessonRepository } from '../../../domain/repositories/lesson.repository.js';

@Injectable()
export class ListCourseLessonsUseCase {
  constructor(
    private readonly lessons: ILessonRepository,
    private readonly courses: ICourseRepository,
  ) {}

  async execute(courseId: number): Promise<Lesson[]> {
    if (!(await this.courses.findById(courseId))) throw new CourseNotFoundError();
    return this.lessons.findByCourse(courseId);
  }
}
