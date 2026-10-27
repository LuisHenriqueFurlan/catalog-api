import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './student.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Student])],
  exports: [TypeOrmModule],
})
export class StudentsModule {}
