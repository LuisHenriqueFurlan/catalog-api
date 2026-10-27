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
import { CourseOrmEntity } from './course.orm-entity.js';
import { StudentOrmEntity } from './student.orm-entity.js';

@Entity('enrollments')
@Unique(['studentId', 'courseId'])
export class EnrollmentOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  studentId: number;

  @Column({ type: 'integer' })
  courseId: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => StudentOrmEntity, (student) => student.enrollments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'studentId' })
  student: Relation<StudentOrmEntity>;

  @ManyToOne(() => CourseOrmEntity, (course) => course.enrollments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'courseId' })
  course: Relation<CourseOrmEntity>;
}
