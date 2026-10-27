import { User } from '../entities/user.entity.js';
import { Email } from '../value-objects/email.vo.js';

export abstract class IUserRepository {
  abstract findByEmail(email: Email): Promise<User | null>;
  abstract findById(id: number): Promise<User | null>;
  abstract save(user: User): Promise<User>;
}
