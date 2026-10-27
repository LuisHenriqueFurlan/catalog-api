import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LessonProgress } from '../../../../domain/entities/lesson-progress.entity.js';
import { ILessonProgressRepository } from '../../../../domain/repositories/lesson-progress.repository.js';
import { LessonProgressOrmEntity } from '../entities/lesson-progress.orm-entity.js';

@Injectable()
export class TypeOrmLessonProgressRepository implements ILessonProgressRepository {
  constructor(
    @InjectRepository(LessonProgressOrmEntity)
    private readonly repo: Repository<LessonProgressOrmEntity>,
  ) {}

  async findByStudentAndLesson(
    studentId: number,
    lessonId: number,
  ): Promise<LessonProgress | null> {
    const row = await this.repo.findOneBy({ studentId, lessonId });
    return row ? toDomain(row) : null;
  }

  countCompletedInCourse(studentId: number, courseId: number): Promise<number> {
    return this.repo
      .createQueryBuilder('p')
      .innerJoin('p.lesson', 'l')
      .where('p.studentId = :studentId', { studentId })
      .andWhere('l.courseId = :courseId', { courseId })
      .andWhere('p.status = :status', { status: 'completed' })
      .getCount();
  }

  async save(progress: LessonProgress): Promise<LessonProgress> {
    const row = await this.repo.save(
      this.repo.create({
        id: progress.id,
        studentId: progress.studentId,
        lessonId: progress.lessonId,
        status: progress.status,
        completedAt: progress.completedAt,
      }),
    );
    return toDomain(row);
  }
}

function toDomain(row: LessonProgressOrmEntity): LessonProgress {
  return LessonProgress.restore({
    id: row.id,
    studentId: row.studentId,
    lessonId: row.lessonId,
    status: row.status,
    completedAt: row.completedAt ? new Date(row.completedAt) : null,
  });
}
