import { Injectable } from '@nestjs/common';
import { Course, CourseProps } from '../../../domain/entities/course.entity.js';
import { CourseNotFoundError } from '../../../domain/errors.js';
import { ICourseRepository } from '../../../domain/repositories/course.repository.js';

@Injectable()
export class UpdateCourseUseCase {
  constructor(private readonly courses: ICourseRepository) {}

  async execute(id: number, input: CourseProps): Promise<Course> {
    const course = await this.courses.findById(id);
    if (!course) throw new CourseNotFoundError();
    course.update(input);
    return this.courses.save(course);
  }
}
