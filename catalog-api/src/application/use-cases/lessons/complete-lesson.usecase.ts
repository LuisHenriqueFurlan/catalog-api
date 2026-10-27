import { Injectable } from '@nestjs/common';
import { LessonProgress } from '../../../domain/entities/lesson-progress.entity.js';
import { LessonNotFoundError, StudentNotFoundError } from '../../../domain/errors.js';
import { IEnrollmentRepository } from '../../../domain/repositories/enrollment.repository.js';
import { ILessonProgressRepository } from '../../../domain/repositories/lesson-progress.repository.js';
import { ILessonRepository } from '../../../domain/repositories/lesson.repository.js';
import { IStudentRepository } from '../../../domain/repositories/student.repository.js';
import { LessonProgressPolicy } from '../../../domain/services/lesson-progress-policy.js';

@Injectable()
export class CompleteLessonUseCase {
  private readonly policy: LessonProgressPolicy;

  constructor(
    private readonly lessons: ILessonRepository,
    private readonly progress: ILessonProgressRepository,
    private readonly students: IStudentRepository,
    enrollments: IEnrollmentRepository,
  ) {
    this.policy = new LessonProgressPolicy(enrollments);
  }

  /** Idempotente: concluir de novo devolve o registro sem alterar completedAt. */
  async execute(input: { studentId: number; lessonId: number }): Promise<LessonProgress> {
    if (!(await this.students.findById(input.studentId))) throw new StudentNotFoundError();
    const lesson = await this.lessons.findById(input.lessonId);
    if (!lesson) throw new LessonNotFoundError();
    await this.policy.assertEnrolled(input.studentId, lesson.courseId);

    const progress =
      (await this.progress.findByStudentAndLesson(input.studentId, input.lessonId)) ??
      LessonProgress.start(input.studentId, input.lessonId);
    progress.complete();
    return this.progress.save(progress);
  }
}
