import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ICourseRepository } from '../../domain/repositories/course.repository.js';
import { IEnrollmentRepository } from '../../domain/repositories/enrollment.repository.js';
import { ILessonProgressRepository } from '../../domain/repositories/lesson-progress.repository.js';
import { ILessonRepository } from '../../domain/repositories/lesson.repository.js';
import { IStudentRepository } from '../../domain/repositories/student.repository.js';
import { ormEntities } from './typeorm/entities/index.js';
import { TypeOrmCourseRepository } from './typeorm/repositories/typeorm-course.repository.js';
import { TypeOrmEnrollmentRepository } from './typeorm/repositories/typeorm-enrollment.repository.js';
import { TypeOrmLessonProgressRepository } from './typeorm/repositories/typeorm-lesson-progress.repository.js';
import { TypeOrmLessonRepository } from './typeorm/repositories/typeorm-lesson.repository.js';
import { TypeOrmStudentRepository } from './typeorm/repositories/typeorm-student.repository.js';

/** Liga as portas do domínio às implementações TypeORM. */
@Module({
  imports: [TypeOrmModule.forFeature(ormEntities)],
  providers: [
    { provide: ICourseRepository, useClass: TypeOrmCourseRepository },
    { provide: IStudentRepository, useClass: TypeOrmStudentRepository },
    { provide: IEnrollmentRepository, useClass: TypeOrmEnrollmentRepository },
    { provide: ILessonRepository, useClass: TypeOrmLessonRepository },
    { provide: ILessonProgressRepository, useClass: TypeOrmLessonProgressRepository },
  ],
  exports: [
    ICourseRepository,
    IStudentRepository,
    IEnrollmentRepository,
    ILessonRepository,
    ILessonProgressRepository,
  ],
})
export class PersistenceModule {}
