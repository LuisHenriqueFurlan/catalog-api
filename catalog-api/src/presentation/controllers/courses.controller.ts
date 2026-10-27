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
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateCourseUseCase } from '../../application/use-cases/courses/create-course.usecase.js';
import { DeleteCourseUseCase } from '../../application/use-cases/courses/delete-course.usecase.js';
import { GetCourseUseCase } from '../../application/use-cases/courses/get-course.usecase.js';
import { ListCoursesUseCase } from '../../application/use-cases/courses/list-courses.usecase.js';
import { UpdateCourseUseCase } from '../../application/use-cases/courses/update-course.usecase.js';
import { CreateCourseDto } from '../dtos/create-course.dto.js';
import { ListCoursesQueryDto } from '../dtos/list-courses-query.dto.js';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(
    private readonly createCourse: CreateCourseUseCase,
    private readonly listCourses: ListCoursesUseCase,
    private readonly getCourse: GetCourseUseCase,
    private readonly updateCourse: UpdateCourseUseCase,
    private readonly deleteCourse: DeleteCourseUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista cursos (filtro por category e paginação)' })
  findAll(@Query() query: ListCoursesQueryDto) {
    return this.listCourses.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca curso por id' })
  @ApiNotFoundResponse({ description: 'Curso não encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.getCourse.execute(id);
  }

  @Post()
  @ApiOperation({ summary: 'Cria curso' })
  create(@Body() dto: CreateCourseDto) {
    return this.createCourse.execute(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza curso' })
  @ApiNotFoundResponse({ description: 'Curso não encontrado' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateCourseDto) {
    return this.updateCourse.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove curso (e suas matrículas)' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'Curso não encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.deleteCourse.execute(id);
  }
}
