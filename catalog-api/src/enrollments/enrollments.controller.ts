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
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto.js';
import { EnrollmentsService } from './enrollments.service.js';

@ApiTags('enrollments')
@Controller()
export class EnrollmentsController {
  constructor(private readonly service: EnrollmentsService) {}

  @Get('enrollments')
  @ApiOperation({ summary: 'Lista matrículas (paginação)' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get('enrollments/:id')
  @ApiOperation({ summary: 'Busca matrícula por id' })
  @ApiNotFoundResponse({ description: 'Matrícula não encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Get('students/:id/enrollments')
  @ApiOperation({ summary: 'Lista as matrículas (com curso) de um estudante' })
  @ApiNotFoundResponse({ description: 'Estudante não encontrado' })
  findByStudent(@Param('id', ParseIntPipe) id: number) {
    return this.service.findByStudent(id);
  }

  @Post('enrollments')
  @ApiOperation({ summary: 'Matricula um estudante em um curso' })
  @ApiNotFoundResponse({ description: 'Estudante ou curso não encontrado' })
  @ApiConflictResponse({ description: 'Estudante já matriculado no curso' })
  create(@Body() dto: CreateEnrollmentDto) {
    return this.service.create(dto);
  }

  @Delete('enrollments/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Cancela uma matrícula' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'Matrícula não encontrada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
