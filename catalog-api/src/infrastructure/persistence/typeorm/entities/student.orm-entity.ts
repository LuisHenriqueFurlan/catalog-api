import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { EnrollmentOrmEntity } from './enrollment.orm-entity.js';

@Entity('students')
export class StudentOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => EnrollmentOrmEntity, (enrollment) => enrollment.student)
  enrollments: Relation<EnrollmentOrmEntity[]>;
}
