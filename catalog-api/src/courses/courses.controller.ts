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
import { CoursesService } from './courses.service.js';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { ListCoursesQueryDto } from './dto/list-courses-query.dto.js';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly service: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista cursos (filtro por category e paginação)' })
  findAll(@Query() query: ListCoursesQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca curso por id' })
  @ApiNotFoundResponse({ description: 'Curso não encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Cria curso' })
  create(@Body() dto: CreateCourseDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza curso' })
  @ApiNotFoundResponse({ description: 'Curso não encontrado' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateCourseDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove curso (e suas matrículas)' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'Curso não encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
