import { Course } from './course.entity.js';

export class Enrollment {
  private constructor(
    public id: number | undefined,
    public readonly studentId: number,
    public readonly courseId: number,
    public createdAt: Date | undefined,
    /** Preenchido apenas em consultas que já trazem o curso. */
    public course?: Course,
  ) {}

  static create(studentId: number, courseId: number): Enrollment {
    return new Enrollment(undefined, studentId, courseId, undefined);
  }

  static restore(data: {
    id: number;
    studentId: number;
    courseId: number;
    createdAt: Date;
    course?: Course;
  }): Enrollment {
    return new Enrollment(data.id, data.studentId, data.courseId, data.createdAt, data.course);
  }
}
