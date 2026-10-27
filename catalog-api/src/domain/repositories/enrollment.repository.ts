import { Paginated, PageQuery } from '../pagination.js';
import { Enrollment } from '../entities/enrollment.entity.js';

export abstract class IEnrollmentRepository {
  abstract findPage(query: PageQuery): Promise<Paginated<Enrollment>>;
  abstract findById(id: number): Promise<Enrollment | null>;
  abstract findByPair(studentId: number, courseId: number): Promise<Enrollment | null>;
  abstract findByStudentWithCourse(studentId: number): Promise<Enrollment[]>;
  abstract save(enrollment: Enrollment): Promise<Enrollment>;
  abstract delete(id: number): Promise<void>;
}
