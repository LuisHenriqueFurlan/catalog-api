import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { IPasswordHasher } from '../../application/ports/password-hasher.js';

@Injectable()
export class BcryptPasswordHasher implements IPasswordHasher {
  private static readonly ROUNDS = 10;

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, BcryptPasswordHasher.ROUNDS);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
