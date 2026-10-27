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

  async findPage({ page, limit, category }: CourseFilter): Promise<Paginated<Course>> {
    const [rows, total] = await this.repo.findAndCount({
      where: category ? { category } : {},
      order: { id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
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
