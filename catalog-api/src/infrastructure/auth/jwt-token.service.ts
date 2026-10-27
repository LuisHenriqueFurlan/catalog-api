import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ITokenService, TokenPayload } from '../../application/ports/token-service.js';

@Injectable()
export class JwtTokenService implements ITokenService {
  constructor(private readonly jwt: JwtService) {}

  sign(payload: TokenPayload): Promise<string> {
    return this.jwt.signAsync({
      sub: payload.userId,
      role: payload.role,
      studentId: payload.studentId,
    });
  }

  async verify(token: string): Promise<TokenPayload | null> {
    try {
      const data = await this.jwt.verifyAsync<{
        sub: number;
        role: TokenPayload['role'];
        studentId: number | null;
      }>(token);
      return { userId: data.sub, role: data.role, studentId: data.studentId };
    } catch {
      return null;
    }
  }
}
