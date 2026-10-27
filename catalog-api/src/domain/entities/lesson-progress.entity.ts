export type LessonStatus = 'not_started' | 'in_progress' | 'completed';

export class LessonProgress {
  private constructor(
    public id: number | undefined,
    public readonly studentId: number,
    public readonly lessonId: number,
    public status: LessonStatus,
    public completedAt: Date | null,
  ) {}

  static start(studentId: number, lessonId: number): LessonProgress {
    return new LessonProgress(undefined, studentId, lessonId, 'in_progress', null);
  }

  static restore(data: {
    id: number;
    studentId: number;
    lessonId: number;
    status: LessonStatus;
    completedAt: Date | null;
  }): LessonProgress {
    return new LessonProgress(
      data.id,
      data.studentId,
      data.lessonId,
      data.status,
      data.completedAt,
    );
  }

  get isCompleted(): boolean {
    return this.status === 'completed';
  }

  /** Marca a aula como concluída; repetir a chamada preserva o completedAt original. */
  complete(now: Date = new Date()): void {
    if (this.isCompleted) return;
    this.status = 'completed';
    this.completedAt = now;
  }
}
