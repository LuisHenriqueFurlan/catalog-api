import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './course.entity.js';
import { CreateCourseDto } from './dto/create-course.dto.js';

@Injectable()
export class CoursesRepository {
  constructor(
    @InjectRepository(Course) private readonly repo: Repository<Course>,
  ) {}

  findAll() {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  findById(id: number) {
    return this.repo.findOneBy({ id });
  }

  create(dto: CreateCourseDto) {
    return this.repo.save(this.repo.create(dto));
  }
}
