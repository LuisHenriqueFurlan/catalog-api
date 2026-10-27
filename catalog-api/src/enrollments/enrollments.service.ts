import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { CoursesService } from '../courses/courses.service.js';
import { StudentsService } from '../students/students.service.js';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto.js';
import { EnrollmentsRepository } from './enrollments.repository.js';

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly enrollments: EnrollmentsRepository,
    private readonly students: StudentsService,
    private readonly courses: CoursesService,
  ) {}

  findAll(query: PaginationQueryDto) {
    return this.enrollments.findPage(query);
  }

  async findOne(id: number) {
    const enrollment = await this.enrollments.findById(id);
    if (!enrollment) throw new NotFoundException('Matrícula não encontrada');
    return enrollment;
  }

  async findByStudent(studentId: number) {
    await this.students.findOne(studentId);
    return this.enrollments.findByStudent(studentId);
  }

  /** 404 se aluno/curso não existirem; 409 se a matrícula já existir (nunca duplica). */
  async create(dto: CreateEnrollmentDto) {
    await this.students.findOne(dto.studentId);
    await this.courses.findOne(dto.courseId);
    if (await this.enrollments.findByPair(dto.studentId, dto.courseId)) {
      throw new ConflictException('Estudante já matriculado neste curso');
    }
    return this.enrollments.create(dto);
  }

  async remove(id: number) {
    await this.enrollments.remove(await this.findOne(id));
  }
}
