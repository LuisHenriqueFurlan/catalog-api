import { Paginated, PageQuery } from '../pagination.js';
import { Student } from '../entities/student.entity.js';
import { Email } from '../value-objects/email.vo.js';

export abstract class IStudentRepository {
  abstract findPage(query: PageQuery): Promise<Paginated<Student>>;
  abstract findById(id: number): Promise<Student | null>;
  abstract findByEmail(email: Email): Promise<Student | null>;
  abstract save(student: Student): Promise<Student>;
  abstract delete(id: number): Promise<void>;
}
