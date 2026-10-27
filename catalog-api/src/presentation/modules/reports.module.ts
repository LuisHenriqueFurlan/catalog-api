import { Module } from '@nestjs/common';
import { EnrollmentsPerCourseUseCase } from '../../application/use-cases/reports/enrollments-per-course.usecase.js';
import { PersistenceModule } from '../../infrastructure/persistence/persistence.module.js';
import { ReportsController } from '../controllers/reports.controller.js';

@Module({
  imports: [PersistenceModule],
  controllers: [ReportsController],
  providers: [EnrollmentsPerCourseUseCase],
})
export class ReportsModule {}
