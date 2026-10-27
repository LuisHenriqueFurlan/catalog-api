import { request, requestText } from './http';
import type {
  AuditLog,
  AuditLogFilter,
  Course,
  CourseEnrollmentCount,
  CourseInput,
  CourseProgress,
  Enrollment,
  HealthReport,
  Lesson,
  LessonInput,
  LessonProgress,
  LoginResponse,
  Paginated,
  Student,
  StudentInput,
  User,
} from './types';

export interface PageParams {
  page?: number;
  limit?: number;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<LoginResponse>('/api/auth/login', { method: 'POST', body: { email, password } }),
    register: (name: string, email: string, password: string) =>
      request<User>('/api/auth/register', { method: 'POST', body: { name, email, password } }),
  },
  courses: {
    list: (params: PageParams & { category?: string; search?: string }) =>
      request<Paginated<Course>>('/api/courses', { query: { ...params } }),
    get: (id: number) => request<Course>(`/api/courses/${id}`),
    create: (input: CourseInput) => request<Course>('/api/courses', { method: 'POST', body: input }),
    update: (id: number, input: CourseInput) =>
      request<Course>(`/api/courses/${id}`, { method: 'PUT', body: input }),
    remove: (id: number) => request<void>(`/api/courses/${id}`, { method: 'DELETE' }),
    lessons: (id: number) => request<Lesson[]>(`/api/courses/${id}/lessons`),
    addLesson: (id: number, input: LessonInput) =>
      request<Lesson>(`/api/courses/${id}/lessons`, { method: 'POST', body: input }),
  },
  students: {
    list: (params: PageParams) => request<Paginated<Student>>('/api/students', { query: { ...params } }),
    create: (input: StudentInput) => request<Student>('/api/students', { method: 'POST', body: input }),
    update: (id: number, input: StudentInput) =>
      request<Student>(`/api/students/${id}`, { method: 'PUT', body: input }),
    remove: (id: number) => request<void>(`/api/students/${id}`, { method: 'DELETE' }),
    enrollments: (id: number) => request<Enrollment[]>(`/api/students/${id}/enrollments`),
    progress: (studentId: number, courseId: number) =>
      request<CourseProgress>(`/api/students/${studentId}/courses/${courseId}/progress`),
  },
  enrollments: {
    list: (params: PageParams) =>
      request<Paginated<Enrollment>>('/api/enrollments', { query: { ...params } }),
    create: (studentId: number, courseId: number) =>
      request<Enrollment>('/api/enrollments', { method: 'POST', body: { studentId, courseId } }),
    cancel: (id: number) => request<void>(`/api/enrollments/${id}`, { method: 'DELETE' }),
  },
  lessons: {
    complete: (lessonId: number, studentId: number) =>
      request<LessonProgress>(`/api/lessons/${lessonId}/complete`, {
        method: 'POST',
        body: { studentId },
      }),
  },
  reports: {
    enrollmentsPerCourse: () => request<CourseEnrollmentCount[]>('/api/reports/courses/enrollments'),
  },
  audit: {
    list: (filter: AuditLogFilter) =>
      request<Paginated<AuditLog>>('/api/audit-logs', { query: { ...filter } }),
  },
  system: {
    health: () => request<HealthReport>('/health', { acceptStatuses: [503] }),
    metrics: () => requestText('/metrics'),
  },
};
