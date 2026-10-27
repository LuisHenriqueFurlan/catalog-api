import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles } from '../../infrastructure/auth/decorators.js';
import type { TokenPayload } from '../../application/ports/token-service.js';
import { assertSelfOrAdmin } from '../ownership.js';
import { CompleteLessonUseCase } from '../../application/use-cases/lessons/complete-lesson.usecase.js';
import { CreateLessonUseCase } from '../../application/use-cases/lessons/create-lesson.usecase.js';
import { GetStudentCourseProgressUseCase } from '../../application/use-cases/lessons/get-student-course-progress.usecase.js';
import { ListCourseLessonsUseCase } from '../../application/use-cases/lessons/list-course-lessons.usecase.js';
import { CompleteLessonDto } from '../dtos/complete-lesson.dto.js';
import { CreateLessonDto } from '../dtos/create-lesson.dto.js';

@ApiBearerAuth()
@ApiTags('lessons')
@Controller()
export class LessonsController {
  constructor(
    private readonly createLesson: CreateLessonUseCase,
    private readonly listCourseLessons: ListCourseLessonsUseCase,
    private readonly completeLesson: CompleteLessonUseCase,
    private readonly getProgress: GetStudentCourseProgressUseCase,
  ) {}

  @Get('courses/:courseId/lessons')
  @ApiOperation({ summary: 'Lista as aulas de um curso (por ordem)' })
  @ApiNotFoundResponse({ description: 'Curso não encontrado' })
  list(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.listCourseLessons.execute(courseId);
  }

  @Roles('ADMIN')
  @Post('courses/:courseId/lessons')
  @ApiOperation({ summary: 'Cria uma aula no curso' })
  @ApiNotFoundResponse({ description: 'Curso não encontrado' })
  create(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() dto: CreateLessonDto,
  ) {
    return this.createLesson.execute({ courseId, ...dto });
  }

  @Post('lessons/:lessonId/complete')
  @HttpCode(200)
  @ApiOperation({ summary: 'Marca a aula como concluída (idempotente)' })
  @ApiNotFoundResponse({ description: 'Estudante ou aula não encontrados' })
  @ApiForbiddenResponse({ description: 'Estudante não matriculado no curso' })
  complete(
    @Param('lessonId', ParseIntPipe) lessonId: number,
    @Body() dto: CompleteLessonDto,
    @CurrentUser() user: TokenPayload,
  ) {
    assertSelfOrAdmin(user, dto.studentId);
    return this.completeLesson.execute({
      studentId: dto.studentId,
      lessonId,
      actorId: user.userId,
    });
  }

  @Get('students/:studentId/courses/:courseId/progress')
  @ApiOperation({ summary: 'Progresso (%) do estudante em um curso' })
  @ApiNotFoundResponse({ description: 'Estudante ou curso não encontrado' })
  @ApiForbiddenResponse({ description: 'Estudante não matriculado no curso' })
  progress(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('courseId', ParseIntPipe) courseId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    assertSelfOrAdmin(user, studentId);
    return this.getProgress.execute({ studentId, courseId });
  }
}
