import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from '../../../../domain/entities/enrollment.entity.js';
import { Paginated, PageQuery } from '../../../../domain/pagination.js';
import { IEnrollmentRepository } from '../../../../domain/repositories/enrollment.repository.js';
import { EnrollmentOrmEntity } from '../entities/enrollment.orm-entity.js';
import { toDomain as courseToDomain } from './typeorm-course.repository.js';

@Injectable()
export class TypeOrmEnrollmentRepository implements IEnrollmentRepository {
  constructor(
    @InjectRepository(EnrollmentOrmEntity)
    private readonly repo: Repository<EnrollmentOrmEntity>,
  ) {}

  async findPage({ page, limit }: PageQuery): Promise<Paginated<Enrollment>> {
    const [rows, total] = await this.repo.findAndCount({
      order: { id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: rows.map(toDomain), page, limit, total };
  }

  async findById(id: number): Promise<Enrollment | null> {
    const row = await this.repo.findOneBy({ id });
    return row ? toDomain(row) : null;
  }

  async findByPair(studentId: number, courseId: number): Promise<Enrollment | null> {
    const row = await this.repo.findOneBy({ studentId, courseId });
    return row ? toDomain(row) : null;
  }

  async findByStudentWithCourse(studentId: number): Promise<Enrollment[]> {
    const rows = await this.repo.find({
      where: { studentId },
      relations: { course: true },
      order: { id: 'ASC' },
    });
    return rows.map(toDomain);
  }

  async save(enrollment: Enrollment): Promise<Enrollment> {
    const row = await this.repo.save(
      this.repo.create({
        id: enrollment.id,
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
      }),
    );
    return toDomain(row);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete({ id });
  }
}

function toDomain(row: EnrollmentOrmEntity): Enrollment {
  return Enrollment.restore({
    id: row.id,
    studentId: row.studentId,
    courseId: row.courseId,
    createdAt: row.createdAt,
    course: row.course ? courseToDomain(row.course) : undefined,
  });
}
