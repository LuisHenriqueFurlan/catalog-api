export const EVENTS_EXCHANGE = 'catalog.events';
export const AUDIT_QUEUE = 'audit.events';
export const AUDIT_DEAD_LETTER_QUEUE = 'audit.events.dlq';
export const DEAD_LETTER_EXCHANGE = 'catalog.events.dlx';

export interface EventEnvelope {
  eventId: string;
  event: string;
  occurredAt: string;
  actorId: string | null;
  payload: Record<string, unknown>;
}
