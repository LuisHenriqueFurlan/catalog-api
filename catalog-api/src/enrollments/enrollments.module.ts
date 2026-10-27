import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enrollment } from './enrollment.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Enrollment])],
  exports: [TypeOrmModule],
})
export class EnrollmentsModule {}
