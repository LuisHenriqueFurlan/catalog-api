import {
  Column,
  CreateDateColumn,
  Index,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { EnrollmentOrmEntity } from './enrollment.orm-entity.js';

@Entity('courses')
export class CourseOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'varchar' })
  title: string;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  category: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => EnrollmentOrmEntity, (enrollment) => enrollment.course)
  enrollments: Relation<EnrollmentOrmEntity[]>;
}
