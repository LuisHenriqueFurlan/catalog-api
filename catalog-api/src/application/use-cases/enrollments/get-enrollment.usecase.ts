import { Injectable } from '@nestjs/common';
import { Enrollment } from '../../../domain/entities/enrollment.entity.js';
import { EnrollmentNotFoundError } from '../../../domain/errors.js';
import { IEnrollmentRepository } from '../../../domain/repositories/enrollment.repository.js';

@Injectable()
export class GetEnrollmentUseCase {
  constructor(private readonly enrollments: IEnrollmentRepository) {}

  async execute(id: number): Promise<Enrollment> {
    const enrollment = await this.enrollments.findById(id);
    if (!enrollment) throw new EnrollmentNotFoundError();
    return enrollment;
  }
}
