import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { isBlocked } from "@/lib/orders";
import type { SavedAddress } from "@/lib/order-types";

/**
 * Customer accounts — completely separate from the admin user store
 * (src/lib/admin-users.ts). Passwords are salted scrypt hashes; sessions are
 * random 32-byte tokens stored in an httpOnly cookie. Everything persists to
 * .data/customer-users.json so accounts survive server restarts.
 */

const DATA_DIR = path.join(process.cwd(), ".data");
const USERS_FILE = path.join(DATA_DIR, "customer-users.json");
const SESSIONS_FILE = path.join(DATA_DIR, "customer-sessions.json");

export const CUSTOMER_COOKIE = "customer_session";

export interface CustomerUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  passwordHash: string; // scrypt: salt:hex
  addresses: SavedAddress[];
  blocked?: boolean;
  createdAt: string;
}

interface Session {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

function loadUsers(): CustomerUser[] {
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as CustomerUser[]) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: CustomerUser[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

function loadSessions(): Session[] {
  try {
    const raw = fs.readFileSync(SESSIONS_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Session[]) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: Session[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), "utf8");
}

/** ── Password hashing (scrypt, per-user random salt) ─────────────────── */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .scryptSync(password.normalize("NFKC"), salt, 32)
    .toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto
    .scryptSync(password.normalize("NFKC"), salt, 32)
    .toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(candidate, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/** ── Accounts ────────────────────────────────────────────────────────── */

export function findUserByEmail(email: string): CustomerUser | undefined {
  const e = email.trim().toLowerCase();
  return loadUsers().find((u) => u.email === e);
}

export function findUserById(id: string): CustomerUser | undefined {
  return loadUsers().find((u) => u.id === id);
}

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}

export type AuthResult =
  | { user: CustomerUser }
  | { error: string; status: number };

export function registerUser(input: RegisterInput): AuthResult {
  const email = input.email.trim().toLowerCase();
  if (!isValidEmail(email)) {
    return { error: "Please enter a valid email address.", status: 400 };
  }
  if (input.password.length < 6) {
    return { error: "Password must be at least 6 characters.", status: 400 };
  }
  if (findUserByEmail(email)) {
    return { error: "An account with this email already exists. Please log in.", status: 409 };
  }
  const user: CustomerUser = {
    id: crypto.randomUUID(),
    email,
    name: input.name?.trim().slice(0, 100) || email.split("@")[0],
    phone: input.phone?.replace(/\D/g, "").slice(0, 10) || undefined,
    passwordHash: hashPassword(input.password),
    addresses: [],
    createdAt: new Date().toISOString(),
  };
  const users = loadUsers();
  users.push(user);
  saveUsers(users);
  return { user };
}

export function authenticateUser(email: string, password: string): AuthResult {
  const user = findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Incorrect email or password.", status: 401 };
  }
  if (user.blocked) {
    return { error: "This account has been blocked. Contact support.", status: 403 };
  }
  return { user };
}

/** Public shape sent to the browser — never the password hash. */
export interface PublicCustomer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  addresses: SavedAddress[];
}

export function toPublic(user: CustomerUser): PublicCustomer {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    addresses: user.addresses ?? [],
  };
}

export function updateProfile(
  userId: string,
  patch: { name?: string; phone?: string }
): PublicCustomer | undefined {
  const users = loadUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return undefined;
  if (patch.name !== undefined && patch.name.trim()) user.name = patch.name.trim().slice(0, 100);
  if (patch.phone !== undefined) user.phone = patch.phone.replace(/\D/g, "").slice(0, 10) || undefined;
  saveUsers(users);
  return toPublic(user);
}

export function changePassword(
  userId: string,
  current: string,
  next: string
): { ok: boolean; error?: string } {
  if (next.length < 6) return { ok: false, error: "New password must be at least 6 characters." };
  const users = loadUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return { ok: false, error: "Account not found." };
  if (!verifyPassword(current, user.passwordHash)) {
    return { ok: false, error: "Current password is incorrect." };
  }
  user.passwordHash = hashPassword(next);
  saveUsers(users);
  return { ok: true };
}

/** ── Saved addresses ─────────────────────────────────────────────────── */

export function saveAddress(
  userId: string,
  address: Omit<SavedAddress, "id"> & { id?: string }
): PublicCustomer | undefined {
  const users = loadUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return undefined;
  user.addresses = user.addresses ?? [];
  if (address.id) {
    const idx = user.addresses.findIndex((a) => a.id === address.id);
    if (idx >= 0) {
      user.addresses[idx] = { ...user.addresses[idx], ...address, id: address.id };
    }
  } else {
    const full: SavedAddress = {
      ...address,
      id: `adr_${crypto.randomBytes(4).toString("hex")}`,
    };
    // Flipkart-style: most recently added address appears first
    user.addresses.unshift(full);
  }
  if (user.addresses.length > 6) user.addresses.length = 6;
  saveUsers(users);
  return toPublic(user);
}

export function deleteAddress(userId: string, addressId: string): PublicCustomer | undefined {
  const users = loadUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return undefined;
  user.addresses = (user.addresses ?? []).filter((a) => a.id !== addressId);
  saveUsers(users);
  return toPublic(user);
}

/** ── Sessions (30 days) ──────────────────────────────────────────────── */

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function pruneSessions(sessions: Session[]): Session[] {
  const now = Date.now();
  return sessions.filter((s) => new Date(s.expiresAt).getTime() > now);
}

export function createSession(userId: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  const sessions = pruneSessions(loadSessions());
  sessions.push({
    token,
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  });
  saveSessions(sessions);
  return token;
}

export function destroySession(token: string | undefined): void {
  if (!token) return;
  saveSessions(loadSessions().filter((s) => s.token !== token));
}

export function getUserForSession(token: string | undefined): CustomerUser | null {
  if (!token) return null;
  const session = loadSessions().find(
    (s) => s.token === token && new Date(s.expiresAt).getTime() > Date.now()
  );
  if (!session) return null;
  const user = findUserById(session.userId);
  if (!user || user.blocked) return null;
  return user;
}

/** Re-export so order APIs can gate blocked accounts in one place. */
export { isBlocked };
