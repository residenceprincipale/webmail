import type { H3Event } from "h3";

type OriginCheck = { ok: true } | { ok: false; status: number; error: string };

export function assertSameOrigin(event: H3Event): OriginCheck {
  const origin = getHeader(event, "origin");
  const host = getHeader(event, "x-forwarded-host") ?? getHeader(event, "host") ?? "";

  if (!origin) {
    return { ok: false, status: 403, error: "Unverifiable origin" };
  }

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return { ok: false, status: 403, error: "Invalid origin" };
  }

  if (originHost !== host) {
    return { ok: false, status: 403, error: "Forbidden origin" };
  }
  return { ok: true };
}
