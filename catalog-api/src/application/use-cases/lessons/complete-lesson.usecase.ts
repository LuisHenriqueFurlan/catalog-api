import { Injectable } from '@nestjs/common';
import { IEventPublisher } from '../../ports/event-publisher.js';
import { AUDIT_EVENTS } from '../../../domain/entities/audit-log.entity.js';
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
    private readonly events: IEventPublisher,
  ) {
    this.policy = new LessonProgressPolicy(enrollments);
  }

  async execute(input: {
    studentId: number;
    lessonId: number;
    actorId?: number;
  }): Promise<LessonProgress> {
    if (!(await this.students.findById(input.studentId))) throw new StudentNotFoundError();
    const lesson = await this.lessons.findById(input.lessonId);
    if (!lesson) throw new LessonNotFoundError();
    await this.policy.assertEnrolled(input.studentId, lesson.courseId);

    const progress =
      (await this.progress.findByStudentAndLesson(input.studentId, input.lessonId)) ??
      LessonProgress.start(input.studentId, input.lessonId);
    const alreadyCompleted = progress.isCompleted;
    progress.complete();
    const saved = await this.progress.save(progress);
    if (!alreadyCompleted) {
      await this.events.publish({
        event: AUDIT_EVENTS.LESSON_COMPLETED,
        actorId: input.actorId ?? null,
        payload: {
          studentId: String(input.studentId),
          lessonId: String(input.lessonId),
          courseId: String(lesson.courseId),
        },
      });
    }
    return saved;
  }
}
