export type Role = 'STUDENT' | 'ADMIN';

export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

export interface Course {
  id: number;
  title: string;
  category: string | null;
  description: string | null;
  createdAt: string;
}

export interface CourseInput {
  title: string;
  category?: string;
  description?: string;
}

export interface Student {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

export interface StudentInput {
  name: string;
  email: string;
}

export interface Enrollment {
  id: number;
  studentId: number;
  courseId: number;
  createdAt: string;
  course?: Course;
}

export interface Lesson {
  id: number;
  courseId: number;
  title: string;
  order: number;
  contentUrl: string;
  createdAt: string;
}

export interface LessonInput {
  title: string;
  order: number;
  contentUrl: string;
}

export interface LessonProgress {
  id: number;
  studentId: number;
  lessonId: number;
  status: 'not_started' | 'in_progress' | 'completed';
  completedAt: string | null;
}

export interface CourseProgress {
  studentId: number;
  courseId: number;
  totalLessons: number;
  completedLessons: number;
  completedLessonIds: number[];
  percentage: number;
}

export interface User {
  id: number;
  email: string;
  role: Role;
  studentId: number | null;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
}

export interface CourseEnrollmentCount {
  courseId: number;
  title: string;
  enrollments: number;
}

export interface AuditLog {
  eventId?: string;
  event: string;
  timestamp: string;
  actorId: string | null;
  payload: Record<string, unknown>;
}

export interface AuditLogFilter {
  event?: string;
  studentId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export type ComponentState = 'up' | 'down' | 'disabled';

export interface ComponentHealth {
  status: ComponentState;
  latencyMs?: number;
  error?: string;
}

export interface HealthReport {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  uptimeSeconds: number;
  components: {
    database: ComponentHealth;
    mongo: ComponentHealth;
    broker: ComponentHealth;
  };
}

export interface ApiErrorBody {
  message: string;
  details?: string[];
  path?: string;
  timestamp?: string;
  requestId?: string;
}
