import { Injectable } from '@nestjs/common';
import { IEventPublisher } from '../../ports/event-publisher.js';
import { AUDIT_EVENTS } from '../../../domain/entities/audit-log.entity.js';
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
    private readonly events: IEventPublisher,
  ) {
    this.policy = new EnrollmentPolicy(enrollments);
  }

  async execute(input: {
    studentId: number;
    courseId: number;
    actorId?: number;
  }): Promise<Enrollment> {
    if (!(await this.students.findById(input.studentId))) throw new StudentNotFoundError();
    if (!(await this.courses.findById(input.courseId))) throw new CourseNotFoundError();
    await this.policy.assertCanEnroll(input.studentId, input.courseId);
    const enrollment = await this.enrollments.save(
      Enrollment.create(input.studentId, input.courseId),
    );
    await this.events.publish({
      event: AUDIT_EVENTS.STUDENT_ENROLLED,
      actorId: input.actorId ?? null,
      payload: {
        studentId: String(input.studentId),
        courseId: String(input.courseId),
        enrollmentId: String(enrollment.id),
      },
    });
    return enrollment;
  }
}
