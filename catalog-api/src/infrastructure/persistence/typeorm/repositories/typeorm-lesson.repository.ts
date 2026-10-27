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
