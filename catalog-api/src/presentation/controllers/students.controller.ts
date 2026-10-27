import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../infrastructure/auth/decorators.js';
import { CreateStudentUseCase } from '../../application/use-cases/students/create-student.usecase.js';
import { DeleteStudentUseCase } from '../../application/use-cases/students/delete-student.usecase.js';
import { GetStudentUseCase } from '../../application/use-cases/students/get-student.usecase.js';
import { ListStudentsUseCase } from '../../application/use-cases/students/list-students.usecase.js';
import { UpdateStudentUseCase } from '../../application/use-cases/students/update-student.usecase.js';
import { CreateStudentDto } from '../dtos/create-student.dto.js';
import { PaginationQueryDto } from '../dtos/pagination-query.dto.js';

@ApiBearerAuth()
@Roles('ADMIN')
@ApiTags('students')
@Controller('students')
export class StudentsController {
  constructor(
    private readonly createStudent: CreateStudentUseCase,
    private readonly listStudents: ListStudentsUseCase,
    private readonly getStudent: GetStudentUseCase,
    private readonly updateStudent: UpdateStudentUseCase,
    private readonly deleteStudent: DeleteStudentUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista estudantes (paginação)' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.listStudents.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca estudante por id' })
  @ApiNotFoundResponse({ description: 'Estudante não encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.getStudent.execute(id);
  }

  @Post()
  @ApiOperation({ summary: 'Cria estudante' })
  @ApiConflictResponse({ description: 'E-mail já cadastrado' })
  create(@Body() dto: CreateStudentDto) {
    return this.createStudent.execute(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza estudante' })
  @ApiNotFoundResponse({ description: 'Estudante não encontrado' })
  @ApiConflictResponse({ description: 'E-mail já cadastrado' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateStudentDto) {
    return this.updateStudent.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove estudante (e suas matrículas)' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'Estudante não encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.deleteStudent.execute(id);
  }
}
