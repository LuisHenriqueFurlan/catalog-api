import { Injectable } from '@nestjs/common';
import { Student, StudentProps } from '../../../domain/entities/student.entity.js';
import { StudentNotFoundError } from '../../../domain/errors.js';
import { IStudentRepository } from '../../../domain/repositories/student.repository.js';
import { StudentEmailPolicy } from '../../../domain/services/student-email-policy.js';

@Injectable()
export class UpdateStudentUseCase {
  private readonly emailPolicy: StudentEmailPolicy;

  constructor(private readonly students: IStudentRepository) {
    this.emailPolicy = new StudentEmailPolicy(students);
  }

  async execute(id: number, input: StudentProps): Promise<Student> {
    const student = await this.students.findById(id);
    if (!student) throw new StudentNotFoundError();
    student.update(input);
    await this.emailPolicy.assertAvailable(student.email, id);
    return this.students.save(student);
  }
}
