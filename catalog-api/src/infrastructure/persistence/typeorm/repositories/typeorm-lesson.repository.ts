import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from '../../../../domain/entities/lesson.entity.js';
import { ILessonRepository } from '../../../../domain/repositories/lesson.repository.js';
import { LessonOrmEntity } from '../entities/lesson.orm-entity.js';

@Injectable()
export class TypeOrmLessonRepository implements ILessonRepository {
  constructor(
    @InjectRepository(LessonOrmEntity) private readonly repo: Repository<LessonOrmEntity>,
  ) {}

  async findByCourse(courseId: number): Promise<Lesson[]> {
    const rows = await this.repo.find({ where: { courseId }, order: { order: 'ASC' } });
    return rows.map(toDomain);
  }

  async findById(id: number): Promise<Lesson | null> {
    const row = await this.repo.findOneBy({ id });
    return row ? toDomain(row) : null;
  }

  async findByCourseAndOrder(courseId: number, order: number): Promise<Lesson | null> {
    const row = await this.repo.findOneBy({ courseId, order });
    return row ? toDomain(row) : null;
  }

  countByCourse(courseId: number): Promise<number> {
    return this.repo.countBy({ courseId });
  }

  async findExistingOrders(lessons: Lesson[]): Promise<Set<string>> {
    if (lessons.length === 0) return new Set();
    const courseIds = [...new Set(lessons.map((l) => l.courseId))];
    const orders = lessons.map((l) => l.order);
    const rows = await this.repo
      .createQueryBuilder('l')
      .select(['l.courseId', 'l.order'])
      .where('l.courseId IN (:...courseIds)', { courseIds })
      .andWhere('l.order BETWEEN :min AND :max', {
        min: Math.min(...orders),
        max: Math.max(...orders),
      })
      .getMany();
    return new Set(rows.map((r) => `${r.courseId}:${r.order}`));
  }

  async saveMany(lessons: Lesson[]): Promise<void> {
    if (lessons.length === 0) return;
    await this.repo
      .createQueryBuilder()
      .insert()
      .values(
        lessons.map((l) => ({
          courseId: l.courseId,
          title: l.title,
          order: l.order,
          contentUrl: l.contentUrl,
        })),
      )
      .execute();
  }

  async save(lesson: Lesson): Promise<Lesson> {
    const row = await this.repo.save(
      this.repo.create({
        id: lesson.id,
        courseId: lesson.courseId,
        title: lesson.title,
        order: lesson.order,
        contentUrl: lesson.contentUrl,
      }),
    );
    return toDomain(row);
  }
}

function toDomain(row: LessonOrmEntity): Lesson {
  return Lesson.restore({
    id: row.id,
    courseId: row.courseId,
    title: row.title,
    order: row.order,
    contentUrl: row.contentUrl,
    createdAt: row.createdAt,
  });
}
