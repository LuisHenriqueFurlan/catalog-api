import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../../domain/entities/user.entity.js';
import { IUserRepository } from '../../../../domain/repositories/user.repository.js';
import { Email } from '../../../../domain/value-objects/email.vo.js';
import { UserOrmEntity } from '../entities/user.orm-entity.js';

@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity) private readonly repo: Repository<UserOrmEntity>,
  ) {}

  async findByEmail(email: Email): Promise<User | null> {
    const row = await this.repo.findOneBy({ email: email.value });
    return row ? toDomain(row) : null;
  }

  async findById(id: number): Promise<User | null> {
    const row = await this.repo.findOneBy({ id });
    return row ? toDomain(row) : null;
  }

  async save(user: User): Promise<User> {
    const row = await this.repo.save(
      this.repo.create({
        id: user.id,
        email: user.email.value,
        passwordHash: user.passwordHash,
        role: user.role,
        studentId: user.studentId,
      }),
    );
    return toDomain(row);
  }
}

function toDomain(row: UserOrmEntity): User {
  return User.restore({
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role,
    studentId: row.studentId,
    createdAt: row.createdAt,
  });
}
