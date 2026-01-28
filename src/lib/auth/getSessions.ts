import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { findValidSessionByRawToken } from "@/lib/auth/sessionRepo";

export async function getSession() {
  const cookie = await cookies();
  const rawToken = cookie.get(SESSION_COOKIE_NAME)?.value;
  if (!rawToken) return null;

  return findValidSessionByRawToken(rawToken);
}

