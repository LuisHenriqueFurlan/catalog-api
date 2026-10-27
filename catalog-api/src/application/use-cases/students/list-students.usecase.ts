import { Injectable } from '@nestjs/common';
import { Student } from '../../../domain/entities/student.entity.js';
import { Paginated, PageQuery } from '../../../domain/pagination.js';
import { IStudentRepository } from '../../../domain/repositories/student.repository.js';

@Injectable()
export class ListStudentsUseCase {
  constructor(private readonly students: IStudentRepository) {}

  execute(query: PageQuery): Promise<Paginated<Student>> {
    return this.students.findPage(query);
  }
}
