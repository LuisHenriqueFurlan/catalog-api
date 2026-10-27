export const AUDIT_EVENTS = {
  STUDENT_ENROLLED: 'student.enrolled',
  LESSON_COMPLETED: 'lesson.completed',
} as const;

export type AuditEvent = (typeof AUDIT_EVENTS)[keyof typeof AUDIT_EVENTS];

export interface AuditLogEntry {
  eventId?: string;
  event: string;
  timestamp: Date;
  actorId: string | null;
  payload: Record<string, unknown>;
}
