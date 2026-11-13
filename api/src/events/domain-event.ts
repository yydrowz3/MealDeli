export interface DomainEvent {
  readonly eventId: string;
  readonly occurredAt: string;
  readonly type: string;
}
