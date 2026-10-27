import { Injectable } from '@nestjs/common';
import { Enrollment } from '../../../domain/entities/enrollment.entity.js';
import { Paginated, PageQuery } from '../../../domain/pagination.js';
import { IEnrollmentRepository } from '../../../domain/repositories/enrollment.repository.js';

@Injectable()
export class ListEnrollmentsUseCase {
  constructor(private readonly enrollments: IEnrollmentRepository) {}

  execute(query: PageQuery): Promise<Paginated<Enrollment>> {
    return this.enrollments.findPage(query);
  }
}
