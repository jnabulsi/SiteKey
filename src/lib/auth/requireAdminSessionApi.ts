import { getSession } from "@/lib/auth/getSession";

/**
 * Like requireAdminSession but for JSON API endpoints.
 * Returns the session if valid, or null (so the caller can return a JSON error).
 */
export async function requireAdminSessionApi(orgId: string) {
  const session = await getSession();

  const ok =
    session &&
    session.session_type === "admin" &&
    session.org_id === orgId &&
    session.expires_at > new Date();

  return ok ? session : null;
}
