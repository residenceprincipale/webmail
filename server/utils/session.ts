import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export type MailSession = {
  id: string;
  host: string;
  login: string;
  password: string;
};

export const WMSESSION_COOKIE = "wmsession";
const TTL_MS = 12 * 60 * 60 * 1000;
const REMEMBER_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function key(): Buffer {
  const secret = process.env.WEBMAIL_SESSION_SECRET;
  if (secret && secret.length >= 16) return Buffer.from(secret);
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "WEBMAIL_SESSION_SECRET missing in production (min 16 random chars)",
    );
  }
  return Buffer.from("dev-only-insecure-secret-change-me");
}

function sign(body: string): string {
  return createHmac("sha256", key()).update(body).digest("base64url");
}

export function encodeSession(s: MailSession, remember = false): string {
  const ttl = remember ? REMEMBER_TTL_MS : TTL_MS;
  const payload = { ...s, id: s.id || randomUUID(), exp: Date.now() + ttl };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodeSession(token: string | undefined): MailSession | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  if (!safeEqual(token.slice(dot + 1), sign(body))) return null;
  let p: Record<string, unknown>;
  try {
    p = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof p.exp !== "number" || p.exp < Date.now()) return null;
  if (typeof p.login !== "string" || typeof p.password !== "string" || typeof p.host !== "string") {
    return null;
  }
  return {
    id: typeof p.id === "string" ? p.id : "",
    host: p.host,
    login: p.login,
    password: p.password,
  };
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
