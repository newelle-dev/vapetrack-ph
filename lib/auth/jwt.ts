import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
    process.env.SUPABASE_JWT_SECRET!
);

// Staff sessions last 8 hours, no refresh
const STAFF_SESSION_DURATION = "8h";

interface StaffJwtPayload {
    sub: string; // user ID
    role: string; // "authenticated" — required by Supabase RLS
    aud: string; // "authenticated"
    organization_id: string;
    user_role: string; // "staff" — application-level role
}

/**
 * Create a custom Supabase-compatible JWT for a staff user.
 * The token includes `app_metadata.organization_id` so `get_user_organization_id()`
 * works in RLS policies, and `role: "authenticated"` / `aud: "authenticated"` so
 * Supabase PostgREST accepts the token.
 */
export async function createStaffJwt(payload: {
    userId: string;
    organizationId: string;
    userRole: string;
}): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    return new SignJWT({
        sub: payload.userId,
        role: "authenticated",
        aud: "authenticated",
        user_role: payload.userRole,
        app_metadata: {
            organization_id: payload.organizationId,
        },
        iat: now,
    })
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setIssuedAt(now)
        .setExpirationTime(STAFF_SESSION_DURATION)
        .sign(JWT_SECRET);
}

/**
 * Verify and decode a staff JWT.
 * @returns The decoded payload or null if invalid/expired.
 */
export async function verifyStaffJwt(
    token: string
): Promise<StaffJwtPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET, {
            audience: "authenticated",
        });
        return payload as unknown as StaffJwtPayload;
    } catch {
        return null;
    }
}
