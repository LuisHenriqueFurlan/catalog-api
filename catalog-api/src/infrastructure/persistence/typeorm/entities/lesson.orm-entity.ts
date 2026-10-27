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

@Entity('lessons')
@Unique(['courseId', 'order'])
export class LessonOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  courseId: number;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'integer' })
  order: number;

  @Column({ type: 'varchar' })
  contentUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => CourseOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Relation<CourseOrmEntity>;
}
