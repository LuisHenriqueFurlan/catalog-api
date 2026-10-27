import { Module } from '@nestjs/common';
import { CompleteLessonUseCase } from '../../application/use-cases/lessons/complete-lesson.usecase.js';
import { CreateLessonUseCase } from '../../application/use-cases/lessons/create-lesson.usecase.js';
import { GetStudentCourseProgressUseCase } from '../../application/use-cases/lessons/get-student-course-progress.usecase.js';
import { ListCourseLessonsUseCase } from '../../application/use-cases/lessons/list-course-lessons.usecase.js';
import { PersistenceModule } from '../../infrastructure/persistence/persistence.module.js';
import { LessonsController } from '../controllers/lessons.controller.js';

@Module({
  imports: [PersistenceModule],
  controllers: [LessonsController],
  providers: [
    CreateLessonUseCase,
    ListCourseLessonsUseCase,
    CompleteLessonUseCase,
    GetStudentCourseProgressUseCase,
  ],
})
export class LessonsModule {}
