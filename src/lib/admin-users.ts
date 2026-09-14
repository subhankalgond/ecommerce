import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { cookies } from "next/headers";

/**
 * Admin accounts — a proper multi-user admin system, deliberately kept
 * separate from customer accounts (src/lib/auth-users.ts) the way Flipkart /
 * Amazon run their staff panels:
 *
 *   • Admins log in with EMAIL + PASSWORD (not just a shared password).
 *   • Every admin has a NAME and a ROLE (Super Admin / Product Manager /
 *     Order Manager / Support) that controls which dashboard sections they see.
 *   • The FIRST admin is bootstrapped from .env (ADMIN_EMAIL + ADMIN_PASSWORD)
 *     and can invite more admins from Settings. Customers can never sign in here.
 *   • Sessions are 12-hour httpOnly cookies; sign-in events land in an
 *     activity log.
 */

const DATA_DIR = path.join(process.cwd(), ".data");
const USERS_FILE = path.join(DATA_DIR, "admin-users.json");
const LOG_FILE = path.join(DATA_DIR, "admin-activity.json");

export const ADMIN_COOKIE = "admin_session";

export type AdminRole = "super" | "products" | "orders" | "support";

export const ROLE_LABELS: Record<AdminRole, string> = {
  super: "Super Admin",
  products: "Product Manager",
  orders: "Order Manager",
  support: "Support Staff",
};

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  passwordHash: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface AdminSession {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface ActivityEntry {
  at: string;
  admin: string;
  action: string;
  detail?: string;
}

function loadUsers(): AdminUser[] {
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as AdminUser[]) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: AdminUser[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

function loadSessions(): AdminSession[] {
  try {
    const raw = fs.readFileSync(USERS_FILE.replace("admin-users", "admin-sessions"), "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as AdminSession[]) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: AdminSession[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(
    USERS_FILE.replace("admin-users", "admin-sessions"),
    JSON.stringify(sessions, null, 2),
    "utf8"
  );
}

/** ── Password hashing (scrypt, per-user salt — same scheme as customers) */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password.normalize("NFKC"), salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password.normalize("NFKC"), salt, 32).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(candidate, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** ── Bootstrap: seed the first Super Admin from .env ─────────────────── */

const ROLE_ENV: Record<string, AdminRole> = {
  super: "super",
  products: "products",
  orders: "orders",
  support: "support",
};

function envAdminEmail(): string | null {
  const e = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
}

function envAdminPassword(): string | null {
  const p = process.env.ADMIN_PASSWORD;
  return p && p.length >= 6 ? p : null;
}

/** Create the Super Admin from .env if no admins exist yet (idempotent). */
export function ensureBootstrapAdmin(): AdminUser | null {
  const users = loadUsers();
  const email = envAdminEmail();
  const password = envAdminPassword();
  if (!email || !password) return null;

  const existing = users.find((u) => u.email === email);
  if (existing) {
    // Keep the bootstrap account usable if the .env password was rotated
    if (!verifyPassword(password, existing.passwordHash)) {
      existing.passwordHash = hashPassword(password);
      existing.role = "super";
      saveUsers(users);
    }
    return existing;
  }
  const admin: AdminUser = {
    id: crypto.randomUUID(),
    email,
    name: process.env.ADMIN_NAME?.trim() || "Store Owner",
    role: "super",
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  users.push(admin);
  saveUsers(users);
  return admin;
}

function getAdminUser(id: string): AdminUser | undefined {
  return loadUsers().find((u) => u.id === id);
}

/** ── Authentication ──────────────────────────────────────────────────── */

export type AdminAuthResult =
  | { user: AdminUser }
  | { error: string; status: number };

export function authenticateAdmin(email: string, password: string): AdminAuthResult {
  const e = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
    return { error: "Enter your admin email.", status: 400 };
  }
  if (!password) {
    return { error: "Enter your password.", status: 400 };
  }
  const user = loadUsers().find((u) => u.email === e);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Incorrect email or password.", status: 401 };
  }
  const users = loadUsers();
  const fresh = users.find((u) => u.id === user.id)!;
  fresh.lastLoginAt = new Date().toISOString();
  saveUsers(users);
  logActivity(fresh, "Signed in");
  return { user: fresh };
}

/** Public shape for the UI — never the hash. */
export interface PublicAdmin {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  lastLoginAt?: string;
}

export function toPublicAdmin(user: AdminUser): PublicAdmin {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    lastLoginAt: user.lastLoginAt,
  };
}

/** ── Sessions (12 hours) ─────────────────────────────────────────────── */

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function prune(sessions: AdminSession[]): AdminSession[] {
  const now = Date.now();
  return sessions.filter((s) => new Date(s.expiresAt).getTime() > now);
}

export function createAdminSession(userId: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  const sessions = prune(loadSessions());
  sessions.push({
    token,
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  });
  saveSessions(sessions);
  return token;
}

export function destroyAdminSession(token: string | undefined): void {
  if (!token) return;
  saveSessions(loadSessions().filter((s) => s.token !== token));
}

export function getAdminForSession(token: string | undefined): AdminUser | null {
  if (!token) return null;
  const session = loadSessions().find(
    (s) => s.token === token && new Date(s.expiresAt).getTime() > Date.now()
  );
  if (!session) return null;
  return getAdminUser(session.userId) ?? null;
}

/** Read the signed-in admin from the request cookie (server routes/pages). */
export async function currentAdmin(): Promise<AdminUser | null> {
  const store = await cookies();
  return getAdminForSession(store.get(ADMIN_COOKIE)?.value);
}

/** ── Managing the admin team (Super Admin only) ──────────────────────── */

export type TeamResult =
  | { user: PublicAdmin }
  | { error: string; status: number };

export function inviteAdmin(
  actor: AdminUser,
  input: { email: string; name: string; role: string; password: string }
): TeamResult {
  if (actor.role !== "super") {
    return { error: "Only a Super Admin can manage the team.", status: 403 };
  }
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email.", status: 400 };
  }
  if (input.password.length < 6) {
    return { error: "Password must be at least 6 characters.", status: 400 };
  }
  const role = ROLE_ENV[input.role];
  if (!role) {
    return { error: "Unknown role.", status: 400 };
  }
  const users = loadUsers();
  if (users.some((u) => u.email === email)) {
    return { error: "An admin with this email already exists.", status: 409 };
  }
  const admin: AdminUser = {
    id: crypto.randomUUID(),
    email,
    name: input.name.trim().slice(0, 100) || email.split("@")[0],
    role,
    passwordHash: hashPassword(input.password),
    createdAt: new Date().toISOString(),
  };
  users.push(admin);
  saveUsers(users);
  logActivity(actor, "Added admin", `${admin.name} (${admin.email}) as ${ROLE_LABELS[admin.role]}`);
  return { user: toPublicAdmin(admin) };
}

export function removeAdmin(actor: AdminUser, id: string): TeamResult {
  if (actor.role !== "super") {
    return { error: "Only a Super Admin can manage the team.", status: 403 };
  }
  if (id === actor.id) {
    return { error: "You cannot remove your own account.", status: 400 };
  }
  const users = loadUsers();
  const target = users.find((u) => u.id === id);
  if (!target) return { error: "Admin not found.", status: 404 };
  const remaining = users.filter((u) => u.id !== id);
  saveUsers(remaining);
  saveSessions(loadSessions().filter((s) => s.userId !== id));
  logActivity(actor, "Removed admin", `${target.name} (${target.email})`);
  return { user: toPublicAdmin(target) };
}

export function changeRole(actor: AdminUser, id: string, role: string): TeamResult {
  if (actor.role !== "super") {
    return { error: "Only a Super Admin can change roles.", status: 403 };
  }
  if (id === actor.id) {
    return { error: "You cannot change your own role.", status: 400 };
  }
  const r = ROLE_ENV[role];
  if (!r) return { error: "Unknown role.", status: 400 };
  const users = loadUsers();
  const target = users.find((u) => u.id === id);
  if (!target) return { error: "Admin not found.", status: 404 };
  target.role = r;
  saveUsers(users);
  logActivity(actor, "Changed role", `${target.name} → ${ROLE_LABELS[r]}`);
  return { user: toPublicAdmin(target) };
}

export function changeOwnPassword(
  user: AdminUser,
  current: string,
  next: string
): { ok: boolean; error?: string } {
  if (next.length < 6) return { ok: false, error: "New password must be at least 6 characters." };
  const users = loadUsers();
  const fresh = users.find((u) => u.id === user.id);
  if (!fresh) return { ok: false, error: "Account not found." };
  if (!verifyPassword(current, fresh.passwordHash)) {
    return { ok: false, error: "Current password is incorrect." };
  }
  fresh.passwordHash = hashPassword(next);
  saveUsers(users);
  logActivity(fresh, "Changed own password");
  return { ok: true };
}

export function updateOwnProfile(
  user: AdminUser,
  patch: { name?: string }
): PublicAdmin | undefined {
  const users = loadUsers();
  const fresh = users.find((u) => u.id === user.id);
  if (!fresh) return undefined;
  if (patch.name !== undefined && patch.name.trim()) {
    fresh.name = patch.name.trim().slice(0, 100);
  }
  saveUsers(users);
  return toPublicAdmin(fresh);
}

/** ── Activity log (shown in Settings) ────────────────────────────────── */

function logActivity(user: AdminUser, action: string, detail?: string): void {
  try {
    const log: ActivityEntry[] = loadActivity();
    log.unshift({ at: new Date().toISOString(), admin: user.name, action, detail });
    saveActivity(log.slice(0, 200));
  } catch {
    // logging must never break auth
  }
}

export function loadActivity(): ActivityEntry[] {
  try {
    const raw = fs.readFileSync(LOG_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as ActivityEntry[]) : [];
  } catch {
    return [];
  }
}

function saveActivity(log: ActivityEntry[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2), "utf8");
}

/** ── Role-based section access (unchanged model, now per-account) ────── */

export type AdminSection =
  | "orders"
  | "products"
  | "inventory"
  | "customers"
  | "coupons"
  | "settings";

const SECTION_ACCESS: Record<AdminSection, AdminRole[]> = {
  orders: ["super", "orders", "support"],
  products: ["super", "products"],
  inventory: ["super", "products"],
  customers: ["super", "support", "orders"],
  coupons: ["super"],
  settings: ["super"],
};

export function canAccess(role: AdminRole, section: AdminSection): boolean {
  return SECTION_ACCESS[section].includes(role);
}

export function listAdmins(): PublicAdmin[] {
  ensureBootstrapAdmin();
  return loadUsers()
    .map(toPublicAdmin)
    .sort((a, b) => (a.role === "super" ? -1 : b.role === "super" ? 1 : 0));
}
