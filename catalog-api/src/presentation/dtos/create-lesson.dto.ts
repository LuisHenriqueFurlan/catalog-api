import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsUrl, MaxLength, Min, MinLength } from 'class-validator';

export class CreateLessonDto {
  @ApiProperty({ example: 'Introdução', minLength: 3 })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 1, minimum: 1, description: 'Posição da aula no curso (única)' })
  @IsInt()
  @Min(1)
  order: number;

  @ApiProperty({ example: 'https://cdn.example.com/aulas/intro.mp4' })
  @IsUrl()
  @MaxLength(500)
  contentUrl: string;
}
