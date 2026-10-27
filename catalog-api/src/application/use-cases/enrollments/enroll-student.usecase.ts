import { Injectable } from '@nestjs/common';
import { Enrollment } from '../../../domain/entities/enrollment.entity.js';
import { CourseNotFoundError, StudentNotFoundError } from '../../../domain/errors.js';
import { ICourseRepository } from '../../../domain/repositories/course.repository.js';
import { IEnrollmentRepository } from '../../../domain/repositories/enrollment.repository.js';
import { IStudentRepository } from '../../../domain/repositories/student.repository.js';
import { EnrollmentPolicy } from '../../../domain/services/enrollment-policy.js';

@Injectable()
export class EnrollStudentUseCase {
  private readonly policy: EnrollmentPolicy;

  constructor(
    private readonly enrollments: IEnrollmentRepository,
    private readonly students: IStudentRepository,
    private readonly courses: ICourseRepository,
  ) {
    this.policy = new EnrollmentPolicy(enrollments);
  }

  /** 404 se aluno/curso não existirem; 409 se a matrícula já existir. */
  async execute(input: { studentId: number; courseId: number }): Promise<Enrollment> {
    if (!(await this.students.findById(input.studentId))) throw new StudentNotFoundError();
    if (!(await this.courses.findById(input.courseId))) throw new CourseNotFoundError();
    await this.policy.assertCanEnroll(input.studentId, input.courseId);
    return this.enrollments.save(Enrollment.create(input.studentId, input.courseId));
  }
}
