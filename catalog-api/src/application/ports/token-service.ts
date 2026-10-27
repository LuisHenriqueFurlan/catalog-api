import { Role } from '../../domain/entities/user.entity.js';

export interface TokenPayload {
  userId: number;
  role: Role;
  studentId: number | null;
}

/** Porta: emissão e verificação de tokens de acesso (JWT na infraestrutura). */
export abstract class ITokenService {
  abstract sign(payload: TokenPayload): Promise<string>;
  /** Devolve o payload ou null se o token for inválido/expirado. */
  abstract verify(token: string): Promise<TokenPayload | null>;
}
