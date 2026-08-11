/**
 * @opsera/shared — type-safety backbone of the Opsera platform.
 *
 * Organized into submodules:
 *   types      — primitive branded types, pagination, sort/filter
 *   dtos       — request/response DTOs with class-validator decorators
 *   errors     — error codes, structured error response, exception classes
 *   events     — Kafka event interfaces for all 6 domain namespaces
 *   rbac       — Role enum, Permission enum, RolePermissionMatrix
 *   compliance — ComplianceFramework, DataClassification, AuditAction enums
 *   adapters   — Git, Identity, Observability adapter interfaces
 *   constants  — platform-wide constants
 */
export * from './types/common.types.js';
export * from './types/pagination.types.js';
export * from './types/sort-filter.types.js';
export * from './dtos/release.dto.js';
export * from './dtos/risk.dto.js';
export * from './errors/error-codes.enum.js';
export * from './errors/error-response.type.js';
export * from './errors/exceptions.js';
export * from './events/base-event.interface.js';
export * from './events/release.events.js';
export * from './events/risk.events.js';
export * from './events/policy.events.js';
export * from './events/audit.events.js';
export * from './events/verification.events.js';
export * from './events/analytics.events.js';
export * from './rbac/roles.enum.js';
export * from './rbac/permissions.enum.js';
export * from './rbac/role-permission-matrix.js';
export * from './compliance/frameworks.enum.js';
export * from './compliance/data-classification.enum.js';
export * from './compliance/audit-action.enum.js';
export * from './adapters/git-provider.adapter.js';
export * from './adapters/identity-provider.adapter.js';
export * from './adapters/observability.adapter.js';
export * from './constants/index.js';
//# sourceMappingURL=index.d.ts.map