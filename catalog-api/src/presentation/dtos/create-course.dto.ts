import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 'NestJS na prática', minLength: 3 })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Backend' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ example: 'APIs com NestJS' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
