import { Role } from '../../domain/entities/user.entity.js';

export interface TokenPayload {
  userId: number;
  role: Role;
  studentId: number | null;
}

export abstract class ITokenService {
  abstract sign(payload: TokenPayload): Promise<string>;
  abstract verify(token: string): Promise<TokenPayload | null>;
}
