import { Injectable, NotFoundException } from '@nestjs/common';
import { CoursesRepository } from './courses.repository.js';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { ListCoursesQueryDto } from './dto/list-courses-query.dto.js';

@Injectable()
export class CoursesService {
  constructor(private readonly courses: CoursesRepository) {}

  findAll(query: ListCoursesQueryDto) {
    return this.courses.findPage(query);
  }

  async findOne(id: number) {
    const course = await this.courses.findById(id);
    if (!course) throw new NotFoundException('Curso não encontrado');
    return course;
  }

  create(dto: CreateCourseDto) {
    return this.courses.create(dto);
  }

  /** PUT: substitui os campos editáveis (opcionais ausentes viram null). */
  async update(id: number, dto: CreateCourseDto) {
    const course = await this.findOne(id);
    course.title = dto.title;
    course.category = dto.category ?? null;
    course.description = dto.description ?? null;
    return this.courses.save(course);
  }

  async remove(id: number) {
    await this.courses.remove(await this.findOne(id));
  }
}
