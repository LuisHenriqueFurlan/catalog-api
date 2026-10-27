import { Injectable } from '@nestjs/common';
import { Enrollment } from '../../../domain/entities/enrollment.entity.js';
import { StudentNotFoundError } from '../../../domain/errors.js';
import { IEnrollmentRepository } from '../../../domain/repositories/enrollment.repository.js';
import { IStudentRepository } from '../../../domain/repositories/student.repository.js';

@Injectable()
export class ListStudentEnrollmentsUseCase {
  constructor(
    private readonly enrollments: IEnrollmentRepository,
    private readonly students: IStudentRepository,
  ) {}

  async execute(studentId: number): Promise<Enrollment[]> {
    if (!(await this.students.findById(studentId))) throw new StudentNotFoundError();
    return this.enrollments.findByStudentWithCourse(studentId);
  }
}
