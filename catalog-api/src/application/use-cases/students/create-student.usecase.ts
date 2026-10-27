import { Injectable } from '@nestjs/common';
import { Student, StudentProps } from '../../../domain/entities/student.entity.js';
import { IStudentRepository } from '../../../domain/repositories/student.repository.js';
import { StudentEmailPolicy } from '../../../domain/services/student-email-policy.js';

@Injectable()
export class CreateStudentUseCase {
  private readonly emailPolicy: StudentEmailPolicy;

  constructor(private readonly students: IStudentRepository) {
    this.emailPolicy = new StudentEmailPolicy(students);
  }

  async execute(input: StudentProps): Promise<Student> {
    const student = Student.create(input);
    await this.emailPolicy.assertAvailable(student.email);
    return this.students.save(student);
  }
}
