import type { UUID, ISO8601Timestamp } from '../types/common.types.js';
import type { Role } from '../rbac/roles.enum.js';
/** Actor who triggered the event — embedded in every Opsera domain event. */
export interface EventActor {
    readonly id: UUID;
    readonly role: Role;
    readonly email?: string;
}
/**
 * Base interface for all Opsera domain events published to Kafka.
 * T is the event-specific payload type.
 */
export interface OpseraEvent<T = unknown> {
    /** Globally unique event ID (UUID v4). */
    readonly id: UUID;
    /** Fully qualified event type string, e.g. 'opsera.release.created'. */
    readonly type: string;
    /** ISO 8601 UTC timestamp of when the event occurred. */
    readonly timestamp: ISO8601Timestamp;
    /** Correlation ID linking this event to a distributed trace. */
    readonly correlationId: UUID;
    /** The authenticated user/service that caused this event. */
    readonly actor: EventActor;
    /** Schema version — increment when payload shape changes. */
    readonly version: '1.0';
    /** Event-specific payload. */
    readonly payload: T;
}
//# sourceMappingURL=base-event.interface.d.ts.map