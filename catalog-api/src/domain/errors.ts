/** Erros de domínio: independentes de HTTP. A infraestrutura os traduz em status. */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends DomainError {}
export class NotFoundError extends DomainError {}
export class ConflictError extends DomainError {}
export class ForbiddenError extends DomainError {}

export class CourseNotFoundError extends NotFoundError {
  constructor() {
    super('Curso não encontrado');
  }
}
export class StudentNotFoundError extends NotFoundError {
  constructor() {
    super('Estudante não encontrado');
  }
}
export class EnrollmentNotFoundError extends NotFoundError {
  constructor() {
    super('Matrícula não encontrada');
  }
}
export class EmailAlreadyInUseError extends ConflictError {
  constructor() {
    super('E-mail já cadastrado');
  }
}
export class AlreadyEnrolledError extends ConflictError {
  constructor() {
    super('Estudante já matriculado neste curso');
  }
}
export class LessonNotFoundError extends NotFoundError {
  constructor() {
    super('Aula não encontrada');
  }
}
export class NotEnrolledError extends ForbiddenError {
  constructor() {
    super('Estudante não está matriculado neste curso');
  }
}
export class DuplicateLessonOrderError extends ConflictError {
  constructor() {
    super('Já existe uma aula com esta ordem no curso');
  }
}
export class UnauthorizedError extends DomainError {}

export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super('Credenciais inválidas');
  }
}
