import { Module } from '@nestjs/common';
import { CancelEnrollmentUseCase } from '../../application/use-cases/enrollments/cancel-enrollment.usecase.js';
import { EnrollStudentUseCase } from '../../application/use-cases/enrollments/enroll-student.usecase.js';
import { GetEnrollmentUseCase } from '../../application/use-cases/enrollments/get-enrollment.usecase.js';
import { ListEnrollmentsUseCase } from '../../application/use-cases/enrollments/list-enrollments.usecase.js';
import { ListStudentEnrollmentsUseCase } from '../../application/use-cases/enrollments/list-student-enrollments.usecase.js';
import { PersistenceModule } from '../../infrastructure/persistence/persistence.module.js';
import { EnrollmentsController } from '../controllers/enrollments.controller.js';

@Module({
  imports: [PersistenceModule],
  controllers: [EnrollmentsController],
  providers: [
    EnrollStudentUseCase,
    ListEnrollmentsUseCase,
    GetEnrollmentUseCase,
    ListStudentEnrollmentsUseCase,
    CancelEnrollmentUseCase,
  ],
})
export class EnrollmentsModule {}
