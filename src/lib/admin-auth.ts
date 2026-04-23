import { cookies, headers } from "next/headers";

const COOKIE_NAME = "admin_session";
const SESSION_TOKEN = "chrysalis_admin_authenticated";

/**
 * Checks admin auth via cookie OR Authorization header.
 * The admin UI sends `Authorization: Bearer {SESSION_TOKEN}` on every request
 * as a fallback in case the httpOnly cookie isn't forwarded correctly.
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  if (cookieStore.get(COOKIE_NAME)?.value === SESSION_TOKEN) {
    return true;
  }

  const headerStore = await headers();
  const authHeader = headerStore.get("authorization");
  return authHeader === `Bearer ${SESSION_TOKEN}`;
}

export function getSessionToken(): string {
  return SESSION_TOKEN;
}

export function getCookieName(): string {
  return COOKIE_NAME;
}
