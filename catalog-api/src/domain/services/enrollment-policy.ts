import { AlreadyEnrolledError } from '../errors.js';
import { IEnrollmentRepository } from '../repositories/enrollment.repository.js';

export class EnrollmentPolicy {
  constructor(private readonly enrollments: IEnrollmentRepository) {}

  async assertCanEnroll(studentId: number, courseId: number): Promise<void> {
    if (await this.enrollments.findByPair(studentId, courseId)) {
      throw new AlreadyEnrolledError();
    }
  }
}
