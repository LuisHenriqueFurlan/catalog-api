import { EmailAlreadyInUseError } from '../errors.js';
import { IStudentRepository } from '../repositories/student.repository.js';
import { Email } from '../value-objects/email.vo.js';

/** Regra de domínio: e-mail único entre estudantes. */
export class StudentEmailPolicy {
  constructor(private readonly students: IStudentRepository) {}

  async assertAvailable(email: Email, ignoreStudentId?: number): Promise<void> {
    const existing = await this.students.findByEmail(email);
    if (existing && existing.id !== ignoreStudentId) {
      throw new EmailAlreadyInUseError();
    }
  }
}
