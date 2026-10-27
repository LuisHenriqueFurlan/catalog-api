import { Module } from '@nestjs/common';
import { CreateCourseUseCase } from '../../application/use-cases/courses/create-course.usecase.js';
import { DeleteCourseUseCase } from '../../application/use-cases/courses/delete-course.usecase.js';
import { GetCourseUseCase } from '../../application/use-cases/courses/get-course.usecase.js';
import { ListCoursesUseCase } from '../../application/use-cases/courses/list-courses.usecase.js';
import { UpdateCourseUseCase } from '../../application/use-cases/courses/update-course.usecase.js';
import { PersistenceModule } from '../../infrastructure/persistence/persistence.module.js';
import { CoursesController } from '../controllers/courses.controller.js';

@Module({
  imports: [PersistenceModule],
  controllers: [CoursesController],
  providers: [
    CreateCourseUseCase,
    ListCoursesUseCase,
    GetCourseUseCase,
    UpdateCourseUseCase,
    DeleteCourseUseCase,
  ],
})
export class CoursesModule {}
