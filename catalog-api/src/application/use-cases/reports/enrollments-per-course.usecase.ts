import { Injectable } from '@nestjs/common';
import {
  CourseEnrollmentCount,
  IReportRepository,
} from '../../../domain/repositories/report.repository.js';

@Injectable()
export class EnrollmentsPerCourseUseCase {
  constructor(private readonly reports: IReportRepository) {}

  execute(): Promise<CourseEnrollmentCount[]> {
    return this.reports.enrollmentsPerCourse();
  }
}
