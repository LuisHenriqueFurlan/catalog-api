import { Injectable } from '@nestjs/common';
import { EnrollmentNotFoundError } from '../../../domain/errors.js';
import { IEnrollmentRepository } from '../../../domain/repositories/enrollment.repository.js';

@Injectable()
export class CancelEnrollmentUseCase {
  constructor(private readonly enrollments: IEnrollmentRepository) {}

  async execute(id: number): Promise<void> {
    if (!(await this.enrollments.findById(id))) throw new EnrollmentNotFoundError();
    await this.enrollments.delete(id);
  }
}
