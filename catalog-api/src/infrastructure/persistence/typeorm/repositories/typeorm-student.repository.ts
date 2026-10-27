import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../../../../domain/entities/student.entity.js';
import { Paginated, PageQuery } from '../../../../domain/pagination.js';
import { IStudentRepository } from '../../../../domain/repositories/student.repository.js';
import { Email } from '../../../../domain/value-objects/email.vo.js';
import { StudentOrmEntity } from '../entities/student.orm-entity.js';

@Injectable()
export class TypeOrmStudentRepository implements IStudentRepository {
  constructor(
    @InjectRepository(StudentOrmEntity) private readonly repo: Repository<StudentOrmEntity>,
  ) {}

  async findPage({ page, limit }: PageQuery): Promise<Paginated<Student>> {
    const [rows, total] = await this.repo.findAndCount({
      order: { id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: rows.map(toDomain), page, limit, total };
  }

  async findById(id: number): Promise<Student | null> {
    const row = await this.repo.findOneBy({ id });
    return row ? toDomain(row) : null;
  }

  async findByEmail(email: Email): Promise<Student | null> {
    const row = await this.repo.findOneBy({ email: email.value });
    return row ? toDomain(row) : null;
  }

  async save(student: Student): Promise<Student> {
    const row = await this.repo.save(
      this.repo.create({ id: student.id, name: student.name, email: student.email.value }),
    );
    return toDomain(row);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete({ id });
  }
}

function toDomain(row: StudentOrmEntity): Student {
  return Student.restore({
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.createdAt,
  });
}
