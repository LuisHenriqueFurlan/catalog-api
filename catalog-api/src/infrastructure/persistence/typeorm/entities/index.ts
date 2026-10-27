import { CourseOrmEntity } from './course.orm-entity.js';
import { EnrollmentOrmEntity } from './enrollment.orm-entity.js';
import { LessonProgressOrmEntity } from './lesson-progress.orm-entity.js';
import { LessonOrmEntity } from './lesson.orm-entity.js';
import { StudentOrmEntity } from './student.orm-entity.js';
import { UserOrmEntity } from './user.orm-entity.js';

export {
  CourseOrmEntity,
  EnrollmentOrmEntity,
  LessonOrmEntity,
  LessonProgressOrmEntity,
  StudentOrmEntity,
  UserOrmEntity,
};
export const ormEntities = [
  CourseOrmEntity,
  StudentOrmEntity,
  EnrollmentOrmEntity,
  LessonOrmEntity,
  LessonProgressOrmEntity,
  UserOrmEntity,
];
