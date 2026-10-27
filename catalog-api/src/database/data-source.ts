import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Course } from '../courses/course.entity.js';
import { Student } from '../students/student.entity.js';
import { Enrollment } from '../enrollments/enrollment.entity.js';

export const entities = [Course, Student, Enrollment];

// Usado pela CLI do TypeORM (migrations) e pelo seed.
export default new DataSource({
  type: 'better-sqlite3',
  database: (process.env.DATABASE_URL ?? 'file:./data/catalog.db').replace(
    /^file:/,
    '',
  ),
  entities,
  migrations: ['src/database/migrations/*.ts'],
});
