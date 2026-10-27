import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CreateEnrollmentDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  studentId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  courseId: number;
}
