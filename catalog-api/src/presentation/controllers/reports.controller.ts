import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EnrollmentsPerCourseUseCase } from '../../application/use-cases/reports/enrollments-per-course.usecase.js';
import { Roles } from '../../infrastructure/auth/decorators.js';

@ApiBearerAuth()
@ApiTags('reports')
@Roles('ADMIN')
@Controller('reports')
export class ReportsController {
  constructor(private readonly enrollmentsPerCourse: EnrollmentsPerCourseUseCase) {}

  @Get('courses/enrollments')
  @ApiOperation({ summary: 'Número de matrículas por curso' })
  enrollments() {
    return this.enrollmentsPerCourse.execute();
  }
}
