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

// Types
export * from './types/common.types.js';
export * from './types/pagination.types.js';
export * from './types/sort-filter.types.js';

// DTOs
export * from './dtos/release.dto.js';
export * from './dtos/risk.dto.js';

// Errors
export * from './errors/error-codes.enum.js';
export * from './errors/error-response.type.js';
export * from './errors/exceptions.js';

// Events
export * from './events/base-event.interface.js';
export * from './events/release.events.js';
export * from './events/risk.events.js';
export * from './events/policy.events.js';
export * from './events/audit.events.js';
export * from './events/verification.events.js';
export * from './events/analytics.events.js';

// RBAC
export * from './rbac/roles.enum.js';
export * from './rbac/permissions.enum.js';
export * from './rbac/role-permission-matrix.js';

// Compliance
export * from './compliance/frameworks.enum.js';
export * from './compliance/data-classification.enum.js';
export * from './compliance/audit-action.enum.js';

// Adapters
export * from './adapters/git-provider.adapter.js';
export * from './adapters/identity-provider.adapter.js';
export * from './adapters/observability.adapter.js';

// Constants
export * from './constants/index.js';
