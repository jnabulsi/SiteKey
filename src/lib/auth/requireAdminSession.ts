import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";

export async function requireAdminSession(orgId: string, orgSlug: string) {
  const session = await getSession();

  const ok =
    session &&
    session.session_type === "admin" &&
    session.org_id === orgId &&
    session.expires_at > new Date();

  if (!ok) {
    redirect(`/o/${encodeURIComponent(orgSlug)}/login`);
  }

  return session;
}

