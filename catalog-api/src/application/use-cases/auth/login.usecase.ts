import { Injectable } from '@nestjs/common';
import { InvalidCredentialsError, ValidationError } from '../../../domain/errors.js';
import { IUserRepository } from '../../../domain/repositories/user.repository.js';
import { Email } from '../../../domain/value-objects/email.vo.js';
import { IPasswordHasher } from '../../ports/password-hasher.js';
import { ITokenService } from '../../ports/token-service.js';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IPasswordHasher,
    private readonly tokens: ITokenService,
  ) {}

  /** Mesma resposta para e-mail inexistente e senha errada (não revela qual). */
  async execute(input: { email: string; password: string }): Promise<{ accessToken: string }> {
    let email: Email;
    try {
      email = Email.create(input.email);
    } catch (error) {
      if (error instanceof ValidationError) throw new InvalidCredentialsError();
      throw error;
    }
    const user = await this.users.findByEmail(email);
    if (!user || !(await this.hasher.compare(input.password, user.passwordHash))) {
      throw new InvalidCredentialsError();
    }
    const accessToken = await this.tokens.sign({
      userId: user.id!,
      role: user.role,
      studentId: user.studentId,
    });
    return { accessToken };
  }
}
