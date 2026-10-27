import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { StudentsService } from './students.service.js';

@Controller('students')
export class StudentsController {
  constructor(private readonly service: StudentsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateStudentDto) {
    return this.service.create(dto);
  }
}
