import { ValidationError } from '../errors.js';
import { Email } from '../value-objects/email.vo.js';

export interface StudentProps {
  name: string;
  email: string;
}

export class Student {
  private constructor(
    public id: number | undefined,
    public name: string,
    public email: Email,
    public createdAt: Date | undefined,
  ) {}

  static create(props: StudentProps): Student {
    Student.assertValidName(props.name);
    return new Student(undefined, props.name.trim(), Email.create(props.email), undefined);
  }

  static restore(data: { id: number; name: string; email: string; createdAt: Date }): Student {
    return new Student(data.id, data.name, Email.create(data.email), data.createdAt);
  }

  update(props: StudentProps): void {
    Student.assertValidName(props.name);
    this.name = props.name.trim();
    this.email = Email.create(props.email);
  }

  private static assertValidName(name: string): void {
    if (typeof name !== 'string' || name.trim().length < 2) {
      throw new ValidationError('O nome deve ter ao menos 2 caracteres');
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email.value,
      createdAt: this.createdAt,
    };
  }
}
