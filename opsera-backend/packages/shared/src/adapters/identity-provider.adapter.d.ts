import type { UUID } from '../types/common.types.js';
import type { Role } from '../rbac/roles.enum.js';
export interface IdentityUser {
    readonly id: UUID;
    readonly email: string;
    readonly name: string;
    readonly roles: Role[];
}
export interface OidcTokenPayload {
    readonly sub: string;
    readonly email: string;
    readonly name: string;
    readonly iss: string;
    readonly aud: string | string[];
    readonly exp: number;
}
/**
 * Adapter interface for identity providers (Okta, Auth0, Azure AD).
 * Implemented in WO-023.
 */
export interface IdentityProviderAdapter {
    readonly provider: 'okta' | 'auth0' | 'azure-ad' | 'generic-oidc';
    validateToken(rawToken: string): Promise<OidcTokenPayload>;
    getUserById(id: UUID): Promise<IdentityUser>;
    getUserByEmail(email: string): Promise<IdentityUser>;
    assignRole(userId: UUID, role: Role): Promise<void>;
    revokeRole(userId: UUID, role: Role): Promise<void>;
}
//# sourceMappingURL=identity-provider.adapter.d.ts.map