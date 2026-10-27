import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Paginated,
  PaginationQueryDto,
} from '../common/dto/pagination-query.dto.js';
import { Enrollment } from './enrollment.entity.js';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto.js';

@Injectable()
export class EnrollmentsRepository {
  constructor(
    @InjectRepository(Enrollment) private readonly repo: Repository<Enrollment>,
  ) {}

  async findPage({ page, limit }: PaginationQueryDto): Promise<Paginated<Enrollment>> {
    const [data, total] = await this.repo.findAndCount({
      order: { id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, page, limit, total };
  }

  findById(id: number) {
    return this.repo.findOneBy({ id });
  }

  findByPair(studentId: number, courseId: number) {
    return this.repo.findOneBy({ studentId, courseId });
  }

  /** Matrículas do estudante já com o curso carregado. */
  findByStudent(studentId: number) {
    return this.repo.find({
      where: { studentId },
      relations: { course: true },
      order: { id: 'ASC' },
    });
  }

  create(dto: CreateEnrollmentDto) {
    return this.repo.save(this.repo.create(dto));
  }

  async remove(enrollment: Enrollment) {
    await this.repo.remove(enrollment);
  }
}
