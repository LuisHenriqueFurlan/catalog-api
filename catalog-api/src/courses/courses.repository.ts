import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paginated } from '../common/dto/pagination-query.dto.js';
import { Course } from './course.entity.js';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { ListCoursesQueryDto } from './dto/list-courses-query.dto.js';

@Injectable()
export class CoursesRepository {
  constructor(
    @InjectRepository(Course) private readonly repo: Repository<Course>,
  ) {}

  async findPage(query: ListCoursesQueryDto): Promise<Paginated<Course>> {
    const { page, limit, category } = query;
    const [data, total] = await this.repo.findAndCount({
      where: category ? { category } : {},
      order: { id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, page, limit, total };
  }

  findById(id: number) {
    return this.repo.findOneBy({ id });
  }

  create(dto: CreateCourseDto) {
    return this.repo.save(this.repo.create(dto));
  }

  save(course: Course) {
    return this.repo.save(course);
  }

  async remove(course: Course) {
    await this.repo.remove(course);
  }
}
