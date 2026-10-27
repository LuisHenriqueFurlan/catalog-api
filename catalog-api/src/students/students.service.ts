import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { StudentsRepository } from './students.repository.js';

@Injectable()
export class StudentsService {
  constructor(private readonly students: StudentsRepository) {}

  findAll() {
    return this.students.findAll();
  }

  async findOne(id: number) {
    const student = await this.students.findById(id);
    if (!student) throw new NotFoundException('Estudante não encontrado');
    return student;
  }

  async create(dto: CreateStudentDto) {
    if (await this.students.findByEmail(dto.email)) {
      throw new ConflictException('E-mail já cadastrado');
    }
    return this.students.create(dto);
  }
}
