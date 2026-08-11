"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// Types
__exportStar(require("./types/common.types.js"), exports);
__exportStar(require("./types/pagination.types.js"), exports);
__exportStar(require("./types/sort-filter.types.js"), exports);
// DTOs
__exportStar(require("./dtos/release.dto.js"), exports);
__exportStar(require("./dtos/risk.dto.js"), exports);
// Errors
__exportStar(require("./errors/error-codes.enum.js"), exports);
__exportStar(require("./errors/error-response.type.js"), exports);
__exportStar(require("./errors/exceptions.js"), exports);
// Events
__exportStar(require("./events/base-event.interface.js"), exports);
__exportStar(require("./events/release.events.js"), exports);
__exportStar(require("./events/risk.events.js"), exports);
__exportStar(require("./events/policy.events.js"), exports);
__exportStar(require("./events/audit.events.js"), exports);
__exportStar(require("./events/verification.events.js"), exports);
__exportStar(require("./events/analytics.events.js"), exports);
// RBAC
__exportStar(require("./rbac/roles.enum.js"), exports);
__exportStar(require("./rbac/permissions.enum.js"), exports);
__exportStar(require("./rbac/role-permission-matrix.js"), exports);
// Compliance
__exportStar(require("./compliance/frameworks.enum.js"), exports);
__exportStar(require("./compliance/data-classification.enum.js"), exports);
__exportStar(require("./compliance/audit-action.enum.js"), exports);
// Adapters
__exportStar(require("./adapters/git-provider.adapter.js"), exports);
__exportStar(require("./adapters/identity-provider.adapter.js"), exports);
__exportStar(require("./adapters/observability.adapter.js"), exports);
// Constants
__exportStar(require("./constants/index.js"), exports);
//# sourceMappingURL=index.js.map