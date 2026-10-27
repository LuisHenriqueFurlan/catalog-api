import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from './enrollment.entity.js';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto.js';

@Injectable()
export class EnrollmentsRepository {
  constructor(
    @InjectRepository(Enrollment) private readonly repo: Repository<Enrollment>,
  ) {}

  findAll() {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  findById(id: number) {
    return this.repo.findOneBy({ id });
  }

  findByPair(studentId: number, courseId: number) {
    return this.repo.findOneBy({ studentId, courseId });
  }

  create(dto: CreateEnrollmentDto) {
    return this.repo.save(this.repo.create(dto));
  }
}
