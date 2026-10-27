import { Paginated, PageQuery } from '../pagination.js';
import { Course } from '../entities/course.entity.js';

export interface CourseFilter extends PageQuery {
  category?: string;
  search?: string;
}

export abstract class ICourseRepository {
  abstract findPage(filter: CourseFilter): Promise<Paginated<Course>>;
  abstract findById(id: number): Promise<Course | null>;
  abstract save(course: Course): Promise<Course>;
  abstract delete(id: number): Promise<void>;
}
