import { Injectable } from '@nestjs/common';
import { Student } from '../../../domain/entities/student.entity.js';
import { StudentNotFoundError } from '../../../domain/errors.js';
import { IStudentRepository } from '../../../domain/repositories/student.repository.js';

@Injectable()
export class GetStudentUseCase {
  constructor(private readonly students: IStudentRepository) {}

  async execute(id: number): Promise<Student> {
    const student = await this.students.findById(id);
    if (!student) throw new StudentNotFoundError();
    return student;
  }
}
