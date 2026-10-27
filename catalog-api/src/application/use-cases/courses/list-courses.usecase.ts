import { Injectable } from '@nestjs/common';
import { Course } from '../../../domain/entities/course.entity.js';
import { Paginated } from '../../../domain/pagination.js';
import {
  CourseFilter,
  ICourseRepository,
} from '../../../domain/repositories/course.repository.js';

@Injectable()
export class ListCoursesUseCase {
  constructor(private readonly courses: ICourseRepository) {}

  execute(filter: CourseFilter): Promise<Paginated<Course>> {
    return this.courses.findPage(filter);
  }
}
