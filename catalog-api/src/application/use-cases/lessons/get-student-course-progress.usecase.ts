import { Injectable } from '@nestjs/common';
import {
  CourseNotFoundError,
  NotEnrolledError,
  StudentNotFoundError,
} from '../../../domain/errors.js';
import { ICourseRepository } from '../../../domain/repositories/course.repository.js';
import { IEnrollmentRepository } from '../../../domain/repositories/enrollment.repository.js';
import { ILessonProgressRepository } from '../../../domain/repositories/lesson-progress.repository.js';
import { ILessonRepository } from '../../../domain/repositories/lesson.repository.js';
import { IStudentRepository } from '../../../domain/repositories/student.repository.js';

export interface CourseProgress {
  studentId: number;
  courseId: number;
  totalLessons: number;
  completedLessons: number;
  completedLessonIds: number[];
  percentage: number;
}

@Injectable()
export class GetStudentCourseProgressUseCase {
  constructor(
    private readonly lessons: ILessonRepository,
    private readonly progress: ILessonProgressRepository,
    private readonly students: IStudentRepository,
    private readonly courses: ICourseRepository,
    private readonly enrollments: IEnrollmentRepository,
  ) {}

  async execute(input: { studentId: number; courseId: number }): Promise<CourseProgress> {
    if (!(await this.students.findById(input.studentId))) throw new StudentNotFoundError();
    if (!(await this.courses.findById(input.courseId))) throw new CourseNotFoundError();
    if (!(await this.enrollments.findByPair(input.studentId, input.courseId))) {
      throw new NotEnrolledError();
    }
    const totalLessons = await this.lessons.countByCourse(input.courseId);
    const completedLessonIds = await this.progress.findCompletedLessonIds(
      input.studentId,
      input.courseId,
    );
    const completedLessons = completedLessonIds.length;
    const percentage = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
    return { ...input, totalLessons, completedLessons, completedLessonIds, percentage };
  }
}
