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
