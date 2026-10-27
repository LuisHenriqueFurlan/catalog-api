import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  findAll() {
    return this.enrollments.findAll();
  }

  async findOne(id: number) {
    const enrollment = await this.enrollments.findById(id);
    if (!enrollment) throw new NotFoundException('Matrícula não encontrada');
    return enrollment;
  }

  async create(dto: CreateEnrollmentDto) {
    await this.students.findOne(dto.studentId);
    await this.courses.findOne(dto.courseId);
    if (await this.enrollments.findByPair(dto.studentId, dto.courseId)) {
      throw new ConflictException('Estudante já matriculado neste curso');
    }
    return this.enrollments.create(dto);
  }
}
