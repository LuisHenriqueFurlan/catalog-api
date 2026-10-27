import { NotEnrolledError } from '../errors.js';
import { IEnrollmentRepository } from '../repositories/enrollment.repository.js';

export class LessonProgressPolicy {
  constructor(private readonly enrollments: IEnrollmentRepository) {}

  async assertEnrolled(studentId: number, courseId: number): Promise<void> {
    if (!(await this.enrollments.findByPair(studentId, courseId))) {
      throw new NotEnrolledError();
    }
  }
}
