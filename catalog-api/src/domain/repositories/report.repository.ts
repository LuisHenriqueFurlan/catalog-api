export interface CourseEnrollmentCount {
  courseId: number;
  title: string;
  enrollments: number;
}

export abstract class IReportRepository {
  abstract enrollmentsPerCourse(): Promise<CourseEnrollmentCount[]>;
}
