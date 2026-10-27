import { Injectable } from '@nestjs/common';
import { CourseNotFoundError } from '../../../domain/errors.js';
import { ICourseRepository } from '../../../domain/repositories/course.repository.js';

@Injectable()
export class DeleteCourseUseCase {
  constructor(private readonly courses: ICourseRepository) {}

  async execute(id: number): Promise<void> {
    if (!(await this.courses.findById(id))) throw new CourseNotFoundError();
    await this.courses.delete(id);
  }
}
