import { Injectable } from '@nestjs/common';
import { Student } from '../../../domain/entities/student.entity.js';
import { Role, User } from '../../../domain/entities/user.entity.js';
import { EmailAlreadyInUseError, ValidationError } from '../../../domain/errors.js';
import { IStudentRepository } from '../../../domain/repositories/student.repository.js';
import { IUserRepository } from '../../../domain/repositories/user.repository.js';
import { StudentEmailPolicy } from '../../../domain/services/student-email-policy.js';
import { IPasswordHasher } from '../../ports/password-hasher.js';

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

@Injectable()
export class RegisterUserUseCase {
  private readonly emailPolicy: StudentEmailPolicy;

  constructor(
    private readonly users: IUserRepository,
    private readonly students: IStudentRepository,
    private readonly hasher: IPasswordHasher,
  ) {
    this.emailPolicy = new StudentEmailPolicy(students);
  }

  /** Cria o usuário (role padrão STUDENT) e o perfil de estudante vinculado. */
  async execute(input: RegisterUserInput): Promise<User> {
    if (input.password.length < 8) {
      throw new ValidationError('A senha deve ter ao menos 8 caracteres');
    }
    const student = Student.create({ name: input.name, email: input.email });
    if (await this.users.findByEmail(student.email)) throw new EmailAlreadyInUseError();
    await this.emailPolicy.assertAvailable(student.email);

    const savedStudent = await this.students.save(student);
    return this.users.save(
      User.create({
        email: input.email,
        passwordHash: await this.hasher.hash(input.password),
        role: input.role,
        studentId: savedStudent.id!,
      }),
    );
  }
}
