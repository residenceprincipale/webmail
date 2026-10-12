import { createHash } from "node:crypto";
import { currentSession } from "../utils/current-session";
import { assertSameOrigin } from "../utils/csrf";

const ENDPOINTS: Record<string, string> = {
  "ovh-eu": "https://eu.api.ovh.com/1.0",
  "ovh-ca": "https://ca.api.ovh.com/1.0",
  "ovh-us": "https://api.us.ovhcloud.com/1.0",
};

export default defineEventHandler(async (event) => {
  const origin = assertSameOrigin(event);
  if (!origin.ok) throw createError({ statusCode: origin.status, message: origin.error });
  const session = await currentSession(event);
  if (!session) throw createError({ statusCode: 401, message: "Not authenticated" });

  const provider = (process.env.WEBMAIL_PASSWORD_PROVIDER ?? "ovh").toLowerCase();
  if (provider !== "ovh") {
    throw createError({ statusCode: 501, message: "Password change is not configured for this provider" });
  }

  let body: { current?: string; next?: string };
  try {
    body = await readBody(event);
  } catch {
    throw createError({ statusCode: 400, message: "Invalid JSON" });
  }
  const current = body.current ?? "";
  const next = body.next ?? "";
  if (current !== session.password) {
    throw createError({ statusCode: 403, message: "Current password is incorrect" });
  }
  if (next.length < 12) {
    throw createError({ statusCode: 400, message: "12 characters minimum" });
  }
  if (next === current) {
    throw createError({ statusCode: 400, message: "The new password must be different" });
  }

  const appKey = process.env.OVH_APP_KEY;
  const appSecret = process.env.OVH_APP_SECRET;
  const consumerKey = process.env.OVH_CONSUMER_KEY;
  if (!appKey || !appSecret || !consumerKey) {
    throw createError({
      statusCode: 501,
      message: "Provider API keys are not configured on the server (OVH_APP_KEY/SECRET/CONSUMER_KEY)",
    });
  }
  const base = ENDPOINTS[process.env.OVH_API_ENDPOINT ?? "ovh-eu"] ?? ENDPOINTS["ovh-eu"]!;

  const at = session.login.lastIndexOf("@");
  if (at <= 0 || at === session.login.length - 1) {
    throw createError({ statusCode: 400, message: "Invalid session email address" });
  }
  const domain = session.login.slice(at + 1).toLowerCase();
  const account = session.login.slice(0, at);
  const path = `/email/domain/${encodeURIComponent(domain)}/account/${encodeURIComponent(account)}/changePassword`;
  const payload = JSON.stringify({ password: next });
  const now = String(Math.floor(Date.now() / 1000));
  const signature =
    "$1$" +
    createHash("sha1")
      .update(`${appSecret}+${consumerKey}+POST+${base}${path}+${payload}+${now}`)
      .digest("hex");

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Ovh-Application": appKey,
        "X-Ovh-Consumer": consumerKey,
        "X-Ovh-Signature": signature,
        "X-Ovh-Timestamp": now,
      },
      body: payload,
    });
  } catch {
    throw createError({ statusCode: 502, message: "Provider API unreachable" });
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg =
      typeof data.message === "string" && data.message
        ? data.message
        : `Provider API: error ${res.status}`;
    throw createError({ statusCode: res.status >= 500 ? 502 : res.status, message: msg });
  }
  return { ok: true };
});
