import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class UserOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar' })
  passwordHash: string;

  @Column({ type: 'varchar', default: 'STUDENT' })
  role: 'STUDENT' | 'ADMIN';

  @Column({ type: 'integer', nullable: true })
  studentId: number | null;

  @CreateDateColumn()
  createdAt: Date;
}
