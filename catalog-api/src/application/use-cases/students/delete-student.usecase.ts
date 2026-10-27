import { Injectable } from '@nestjs/common';
import { StudentNotFoundError } from '../../../domain/errors.js';
import { IStudentRepository } from '../../../domain/repositories/student.repository.js';

@Injectable()
export class DeleteStudentUseCase {
  constructor(private readonly students: IStudentRepository) {}

  async execute(id: number): Promise<void> {
    if (!(await this.students.findById(id))) throw new StudentNotFoundError();
    await this.students.delete(id);
  }
}
