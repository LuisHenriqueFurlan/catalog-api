import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from './course.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Course])],
  exports: [TypeOrmModule],
})
export class CoursesModule {}
