import { CourseOrmEntity } from './course.orm-entity.js';
import { EnrollmentOrmEntity } from './enrollment.orm-entity.js';
import { StudentOrmEntity } from './student.orm-entity.js';

export { CourseOrmEntity, EnrollmentOrmEntity, StudentOrmEntity };
export const ormEntities = [CourseOrmEntity, StudentOrmEntity, EnrollmentOrmEntity];
