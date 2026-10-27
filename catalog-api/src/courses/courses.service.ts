import { Injectable, NotFoundException } from '@nestjs/common';
import { CoursesRepository } from './courses.repository.js';
import { CreateCourseDto } from './dto/create-course.dto.js';

@Injectable()
export class CoursesService {
  constructor(private readonly courses: CoursesRepository) {}

  findAll() {
    return this.courses.findAll();
  }

  async findOne(id: number) {
    const course = await this.courses.findById(id);
    if (!course) throw new NotFoundException('Curso não encontrado');
    return course;
  }

  create(dto: CreateCourseDto) {
    return this.courses.create(dto);
  }
}
