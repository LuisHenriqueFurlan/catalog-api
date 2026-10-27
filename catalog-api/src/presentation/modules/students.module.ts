import { Module } from '@nestjs/common';
import { CreateStudentUseCase } from '../../application/use-cases/students/create-student.usecase.js';
import { DeleteStudentUseCase } from '../../application/use-cases/students/delete-student.usecase.js';
import { GetStudentUseCase } from '../../application/use-cases/students/get-student.usecase.js';
import { ListStudentsUseCase } from '../../application/use-cases/students/list-students.usecase.js';
import { UpdateStudentUseCase } from '../../application/use-cases/students/update-student.usecase.js';
import { PersistenceModule } from '../../infrastructure/persistence/persistence.module.js';
import { StudentsController } from '../controllers/students.controller.js';

@Module({
  imports: [PersistenceModule],
  controllers: [StudentsController],
  providers: [
    CreateStudentUseCase,
    ListStudentsUseCase,
    GetStudentUseCase,
    UpdateStudentUseCase,
    DeleteStudentUseCase,
  ],
})
export class StudentsModule {}
