import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CancelEnrollmentUseCase } from '../../application/use-cases/enrollments/cancel-enrollment.usecase.js';
import { EnrollStudentUseCase } from '../../application/use-cases/enrollments/enroll-student.usecase.js';
import { GetEnrollmentUseCase } from '../../application/use-cases/enrollments/get-enrollment.usecase.js';
import { ListEnrollmentsUseCase } from '../../application/use-cases/enrollments/list-enrollments.usecase.js';
import { ListStudentEnrollmentsUseCase } from '../../application/use-cases/enrollments/list-student-enrollments.usecase.js';
import { CreateEnrollmentDto } from '../dtos/create-enrollment.dto.js';
import { PaginationQueryDto } from '../dtos/pagination-query.dto.js';

@ApiTags('enrollments')
@Controller()
export class EnrollmentsController {
  constructor(
    private readonly enrollStudent: EnrollStudentUseCase,
    private readonly listEnrollments: ListEnrollmentsUseCase,
    private readonly getEnrollment: GetEnrollmentUseCase,
    private readonly listStudentEnrollments: ListStudentEnrollmentsUseCase,
    private readonly cancelEnrollment: CancelEnrollmentUseCase,
  ) {}

  @Get('enrollments')
  @ApiOperation({ summary: 'Lista matrículas (paginação)' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.listEnrollments.execute(query);
  }

  @Get('enrollments/:id')
  @ApiOperation({ summary: 'Busca matrícula por id' })
  @ApiNotFoundResponse({ description: 'Matrícula não encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.getEnrollment.execute(id);
  }

  @Get('students/:id/enrollments')
  @ApiOperation({ summary: 'Lista as matrículas (com curso) de um estudante' })
  @ApiNotFoundResponse({ description: 'Estudante não encontrado' })
  findByStudent(@Param('id', ParseIntPipe) id: number) {
    return this.listStudentEnrollments.execute(id);
  }

  @Post('enrollments')
  @ApiOperation({ summary: 'Matricula um estudante em um curso' })
  @ApiNotFoundResponse({ description: 'Estudante ou curso não encontrado' })
  @ApiConflictResponse({ description: 'Estudante já matriculado no curso' })
  create(@Body() dto: CreateEnrollmentDto) {
    return this.enrollStudent.execute(dto);
  }

  @Delete('enrollments/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Cancela uma matrícula' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'Matrícula não encontrada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.cancelEnrollment.execute(id);
  }
}
