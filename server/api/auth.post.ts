import { encodeSession, WMSESSION_COOKIE } from "../utils/session";
import { assertSameOrigin } from "../utils/csrf";
import { rateLimit } from "../utils/rate-limit";
import { DEFAULT_IMAP_HOST, allowedImapHosts } from "../utils/provider";

function validHost(host: string): boolean {
  if (!/^[a-z0-9.-]{1,253}$/i.test(host)) return false;
  const allow = allowedImapHosts();
  if (allow.length && !allow.includes(host.toLowerCase())) return false;
  return true;
}

export default defineEventHandler(async (event) => {
  const origin = assertSameOrigin(event);
  if (!origin.ok) throw createError({ statusCode: origin.status, message: origin.error });

  if (!rateLimit(`auth:${getRequestIP(event)}`).ok) {
    throw createError({ statusCode: 429, message: "Too many attempts. Retry in a minute." });
  }

  let body: { login?: string; password?: string; host?: string; remember?: boolean };
  try {
    body = await readBody(event);
  } catch {
    throw createError({ statusCode: 400, message: "Invalid JSON" });
  }

  const login = body.login?.trim();
  const password = body.password ?? "";
  const host = body.host?.trim() || DEFAULT_IMAP_HOST;
  const remember = body.remember === true;
  if (!login || !password) {
    throw createError({ statusCode: 400, message: "Login and password required" });
  }
  if (!validHost(host)) {
    throw createError({ statusCode: 400, message: "Invalid IMAP host" });
  }

  try {
    const { verifyCredentials } = await import("../utils/mail");
    await verifyCredentials({ host, login, password });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connection refused";
    throw createError({ statusCode: 401, message });
  }

  const token = encodeSession({ id: "", host, login, password }, remember);
  setCookie(event, WMSESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.WEBMAIL_SECURE_COOKIES === "true",
    path: "/",
    maxAge: remember ? 60 * 60 * 24 * 30 : 43200,
  });
  return { ok: true, login, host };
});
