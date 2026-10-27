import { TokenPayload } from '../application/ports/token-service.js';
import { ForbiddenError } from '../domain/errors.js';

export function assertSelfOrAdmin(user: TokenPayload, studentId: number): void {
  if (user.role === 'ADMIN') return;
  if (user.studentId !== studentId) {
    throw new ForbiddenError('Você só pode acessar os seus próprios dados');
  }
}
