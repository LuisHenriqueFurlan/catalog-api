import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  type Relation,
} from 'typeorm';
import { LessonOrmEntity } from './lesson.orm-entity.js';
import { StudentOrmEntity } from './student.orm-entity.js';

@Entity('lesson_progress')
@Unique(['studentId', 'lessonId'])
export class LessonProgressOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  studentId: number;

  @Index()
  @Column({ type: 'integer' })
  lessonId: number;

  @Column({ type: 'varchar', default: 'not_started' })
  status: 'not_started' | 'in_progress' | 'completed';

  @Column({ type: Date, nullable: true })
  completedAt: Date | null;

  @ManyToOne(() => StudentOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Relation<StudentOrmEntity>;

  @ManyToOne(() => LessonOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lessonId' })
  lesson: Relation<LessonOrmEntity>;
}
