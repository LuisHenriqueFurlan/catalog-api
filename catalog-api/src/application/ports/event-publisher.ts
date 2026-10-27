export interface DomainEventMessage {
  event: string;
  actorId: number | string | null;
  payload: Record<string, unknown>;
}

export abstract class IEventPublisher {
  abstract publish(message: DomainEventMessage): Promise<void>;
}
