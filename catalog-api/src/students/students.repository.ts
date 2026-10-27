import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './student.entity.js';
import { CreateStudentDto } from './dto/create-student.dto.js';

@Injectable()
export class StudentsRepository {
  constructor(
    @InjectRepository(Student) private readonly repo: Repository<Student>,
  ) {}

  findAll() {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  findById(id: number) {
    return this.repo.findOneBy({ id });
  }

  findByEmail(email: string) {
    return this.repo.findOneBy({ email });
  }

  create(dto: CreateStudentDto) {
    return this.repo.save(this.repo.create(dto));
  }
}
