import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ICourseRepository } from '../../domain/repositories/course.repository.js';
import { IEnrollmentRepository } from '../../domain/repositories/enrollment.repository.js';
import { IStudentRepository } from '../../domain/repositories/student.repository.js';
import { ormEntities } from './typeorm/entities/index.js';
import { TypeOrmCourseRepository } from './typeorm/repositories/typeorm-course.repository.js';
import { TypeOrmEnrollmentRepository } from './typeorm/repositories/typeorm-enrollment.repository.js';
import { TypeOrmStudentRepository } from './typeorm/repositories/typeorm-student.repository.js';

/** Liga as portas do domínio às implementações TypeORM. */
@Module({
  imports: [TypeOrmModule.forFeature(ormEntities)],
  providers: [
    { provide: ICourseRepository, useClass: TypeOrmCourseRepository },
    { provide: IStudentRepository, useClass: TypeOrmStudentRepository },
    { provide: IEnrollmentRepository, useClass: TypeOrmEnrollmentRepository },
  ],
  exports: [ICourseRepository, IStudentRepository, IEnrollmentRepository],
})
export class PersistenceModule {}
