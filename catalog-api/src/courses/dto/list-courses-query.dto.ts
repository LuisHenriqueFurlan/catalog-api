import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export class ListCoursesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtra por categoria exata' })
  @IsOptional()
  @IsString()
  category?: string;
}
