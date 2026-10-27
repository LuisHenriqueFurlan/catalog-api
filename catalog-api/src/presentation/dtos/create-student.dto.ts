import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({ example: 'Ana Souza', minLength: 2 })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'ana@example.com', description: 'Único' })
  @IsEmail()
  @MaxLength(254)
  email: string;
}
