import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CourseEnrollmentCount,
  IReportRepository,
} from '../../../../domain/repositories/report.repository.js';
import { CourseOrmEntity } from '../entities/course.orm-entity.js';

@Injectable()
export class TypeOrmReportRepository implements IReportRepository {
  constructor(
    @InjectRepository(CourseOrmEntity) private readonly courses: Repository<CourseOrmEntity>,
  ) {}

  async enrollmentsPerCourse(): Promise<CourseEnrollmentCount[]> {
    const rows = await this.courses
      .createQueryBuilder('c')
      .leftJoin('c.enrollments', 'e')
      .select('c.id', 'courseId')
      .addSelect('c.title', 'title')
      .addSelect('COUNT(e.id)', 'enrollments')
      .groupBy('c.id')
      .orderBy('COUNT(e.id)', 'DESC')
      .addOrderBy('c.title', 'ASC')
      .getRawMany<{ courseId: number; title: string; enrollments: string | number }>();
    return rows.map((r) => ({
      courseId: Number(r.courseId),
      title: r.title,
      enrollments: Number(r.enrollments),
    }));
  }
}
