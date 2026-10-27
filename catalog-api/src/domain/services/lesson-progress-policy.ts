import { NotEnrolledError } from '../errors.js';
import { IEnrollmentRepository } from '../repositories/enrollment.repository.js';

/** Regra de domínio: só registra progresso quem está matriculado no curso. */
export class LessonProgressPolicy {
  constructor(private readonly enrollments: IEnrollmentRepository) {}

  async assertEnrolled(studentId: number, courseId: number): Promise<void> {
    if (!(await this.enrollments.findByPair(studentId, courseId))) {
      throw new NotEnrolledError();
    }
  }
}
