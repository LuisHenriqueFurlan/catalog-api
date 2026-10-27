import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { StudentsRepository } from './students.repository.js';

@Injectable()
export class StudentsService {
  constructor(private readonly students: StudentsRepository) {}

  findAll(query: PaginationQueryDto) {
    return this.students.findPage(query);
  }

  async findOne(id: number) {
    const student = await this.students.findById(id);
    if (!student) throw new NotFoundException('Estudante não encontrado');
    return student;
  }

  async create(dto: CreateStudentDto) {
    await this.assertEmailAvailable(dto.email);
    return this.students.create(dto);
  }

  async update(id: number, dto: CreateStudentDto) {
    const student = await this.findOne(id);
    await this.assertEmailAvailable(dto.email, id);
    student.name = dto.name;
    student.email = dto.email;
    return this.students.save(student);
  }

  async remove(id: number) {
    await this.students.remove(await this.findOne(id));
  }

  /** A constraint UNIQUE do banco é a garantia final (ver AllExceptionsFilter). */
  private async assertEmailAvailable(email: string, ignoreId?: number) {
    const existing = await this.students.findByEmail(email);
    if (existing && existing.id !== ignoreId) {
      throw new ConflictException('E-mail já cadastrado');
    }
  }
}
