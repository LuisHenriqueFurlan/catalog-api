export abstract class IAuditLog {
  abstract record(
    event: string,
    actorId: number | string | null,
    payload: Record<string, unknown>,
  ): Promise<void>;
}
