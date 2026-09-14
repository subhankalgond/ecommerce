/**
 * Back-compat shim — the real admin auth lives in src/lib/admin-users.ts
 * (multi-account, email+password, roles). Login rate limiting stays here.
 */
export {
  ADMIN_COOKIE,
  canAccess,
  currentAdmin,
  type AdminRole,
  type AdminSection,
  type AdminUser,
  type PublicAdmin,
} from "./admin-users";

import crypto from "node:crypto";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map<string, { count: number; resetAt: number }>();

/** Brute-force protection for the admin login route (per IP). */
export function rateLimit(ip: string): { allowed: boolean; retryInMs: number } {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryInMs: 0 };
  }
  entry.count += 1;
  if (entry.count > MAX_ATTEMPTS) {
    return { allowed: false, retryInMs: entry.resetAt - now };
  }
  return { allowed: true, retryInMs: 0 };
}

/** Random helper retained for tests/dev tooling. */
export function randomToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
