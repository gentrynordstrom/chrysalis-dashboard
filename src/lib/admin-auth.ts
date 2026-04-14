import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const SESSION_TOKEN = "chrysalis_admin_authenticated";

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === SESSION_TOKEN;
}

export function getSessionToken(): string {
  return SESSION_TOKEN;
}

export function getCookieName(): string {
  return COOKIE_NAME;
}
