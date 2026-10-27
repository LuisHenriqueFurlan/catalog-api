import { Course } from '../../../domain/entities/course.entity.js';
import { Enrollment } from '../../../domain/entities/enrollment.entity.js';
import { Student } from '../../../domain/entities/student.entity.js';
import {
  AlreadyEnrolledError,
  CourseNotFoundError,
  StudentNotFoundError,
} from '../../../domain/errors.js';
import { ICourseRepository } from '../../../domain/repositories/course.repository.js';
import { IEnrollmentRepository } from '../../../domain/repositories/enrollment.repository.js';
import { IStudentRepository } from '../../../domain/repositories/student.repository.js';
import { IAuditLog } from '../../ports/audit-log.js';
import { EnrollStudentUseCase } from './enroll-student.usecase.js';

describe('EnrollStudentUseCase', () => {
  const saved: Enrollment[] = [];
  const students = {
    findById: async (id: number) =>
      id === 1 ? Student.restore({ id: 1, name: 'Ana', email: 'a@a.com', createdAt: new Date() }) : null,
  } as unknown as IStudentRepository;
  const courses = {
    findById: async (id: number) =>
      id === 1
        ? Course.restore({ id: 1, title: 'Nest', category: null, description: null, createdAt: new Date() })
        : null,
  } as unknown as ICourseRepository;
  const enrollments = {
    findByPair: async (s: number, c: number) =>
      saved.find((e) => e.studentId === s && e.courseId === c) ?? null,
    save: async (e: Enrollment) => {
      saved.push(e);
      return e;
    },
  } as unknown as IEnrollmentRepository;
  const events: string[] = [];
  const audit = {
    record: async (event: string) => {
      events.push(event);
    },
  } as unknown as IAuditLog;
  const useCase = new EnrollStudentUseCase(enrollments, students, courses, audit);

  it('matricula e depois rejeita duplicidade', async () => {
    await useCase.execute({ studentId: 1, courseId: 1 });
    await expect(useCase.execute({ studentId: 1, courseId: 1 })).rejects.toThrow(AlreadyEnrolledError);
    expect(saved).toHaveLength(1);
    expect(events).toEqual(['student.enrolled']);
  });

  it('estudante ou curso inexistente', async () => {
    await expect(useCase.execute({ studentId: 9, courseId: 1 })).rejects.toThrow(StudentNotFoundError);
    await expect(useCase.execute({ studentId: 1, courseId: 9 })).rejects.toThrow(CourseNotFoundError);
  });
});
