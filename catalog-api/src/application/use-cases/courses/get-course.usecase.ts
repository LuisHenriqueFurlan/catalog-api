import { Injectable } from '@nestjs/common';
import { Course } from '../../../domain/entities/course.entity.js';
import { CourseNotFoundError } from '../../../domain/errors.js';
import { ICourseRepository } from '../../../domain/repositories/course.repository.js';

@Injectable()
export class GetCourseUseCase {
  constructor(private readonly courses: ICourseRepository) {}

  async execute(id: number): Promise<Course> {
    const course = await this.courses.findById(id);
    if (!course) throw new CourseNotFoundError();
    return course;
  }
}
