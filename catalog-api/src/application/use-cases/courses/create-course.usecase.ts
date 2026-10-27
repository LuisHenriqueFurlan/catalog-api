import { Injectable } from '@nestjs/common';
import { Course, CourseProps } from '../../../domain/entities/course.entity.js';
import { ICourseRepository } from '../../../domain/repositories/course.repository.js';

@Injectable()
export class CreateCourseUseCase {
  constructor(private readonly courses: ICourseRepository) {}

  execute(input: CourseProps): Promise<Course> {
    return this.courses.save(Course.create(input));
  }
}
