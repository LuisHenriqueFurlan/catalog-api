import { ValidationError } from '../errors.js';
import { Email } from '../value-objects/email.vo.js';

export type Role = 'STUDENT' | 'ADMIN';

export class User {
  private constructor(
    public id: number | undefined,
    public readonly email: Email,
    public readonly passwordHash: string,
    public role: Role,
    public readonly studentId: number | null,
    public createdAt: Date | undefined,
  ) {}

  static create(props: {
    email: string;
    passwordHash: string;
    role?: Role;
    studentId?: number | null;
  }): User {
    if (!props.passwordHash) throw new ValidationError('Hash de senha obrigatório');
    return new User(
      undefined,
      Email.create(props.email),
      props.passwordHash,
      props.role ?? 'STUDENT',
      props.studentId ?? null,
      undefined,
    );
  }

  static restore(data: {
    id: number;
    email: string;
    passwordHash: string;
    role: Role;
    studentId: number | null;
    createdAt: Date;
  }): User {
    return new User(
      data.id,
      Email.create(data.email),
      data.passwordHash,
      data.role,
      data.studentId,
      data.createdAt,
    );
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email.value,
      role: this.role,
      studentId: this.studentId,
      createdAt: this.createdAt,
    };
  }
}
