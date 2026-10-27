import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CompleteLessonDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  studentId: number;
}
