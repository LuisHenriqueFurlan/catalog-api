import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../../../../domain/entities/course.entity.js';
import { Paginated } from '../../../../domain/pagination.js';
import {
  CourseFilter,
  ICourseRepository,
} from '../../../../domain/repositories/course.repository.js';
import { CourseOrmEntity } from '../entities/course.orm-entity.js';

@Injectable()
export class TypeOrmCourseRepository implements ICourseRepository {
  constructor(
    @InjectRepository(CourseOrmEntity) private readonly repo: Repository<CourseOrmEntity>,
  ) {}

  async findPage({ page, limit, category, search }: CourseFilter): Promise<Paginated<Course>> {
    const qb = this.repo.createQueryBuilder('c');
    if (category) qb.andWhere('c.category = :category', { category });
    if (search) {
      const term = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
      qb.andWhere(
        "(LOWER(c.title) LIKE LOWER(:term) ESCAPE '\\' OR LOWER(c.description) LIKE LOWER(:term) ESCAPE '\\')",
        { term },
      );
    }
    const [rows, total] = await qb
      .orderBy('c.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data: rows.map(toDomain), page, limit, total };
  }

  async findById(id: number): Promise<Course | null> {
    const row = await this.repo.findOneBy({ id });
    return row ? toDomain(row) : null;
  }

  async save(course: Course): Promise<Course> {
    const row = await this.repo.save(
      this.repo.create({
        id: course.id,
        title: course.title,
        category: course.category,
        description: course.description,
      }),
    );
    return toDomain(row);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete({ id });
  }
}

export function toDomain(row: CourseOrmEntity): Course {
  return Course.restore({
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description,
    createdAt: row.createdAt,
  });
}
