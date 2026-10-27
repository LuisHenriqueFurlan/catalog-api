import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  type Relation,
} from 'typeorm';
import { Course } from '../courses/course.entity.js';
import { Student } from '../students/student.entity.js';

@Entity('enrollments')
@Unique(['studentId', 'courseId'])
export class Enrollment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  studentId: number;

  @Column({ type: 'integer' })
  courseId: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Student, (student) => student.enrollments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'studentId' })
  student: Relation<Student>;

  @ManyToOne(() => Course, (course) => course.enrollments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'courseId' })
  course: Relation<Course>;
}
