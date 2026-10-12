import { timingSafeEqual } from "node:crypto";
import { flushDue } from "../../utils/scheduled";

export default defineEventHandler(async (event) => {
  const secret = getHeader(event, "authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const expected = process.env.WEBMAIL_CRON_SECRET ?? "";
  const a = Buffer.from(secret);
  const b = Buffer.from(expected);
  if (!expected || a.length !== b.length || !timingSafeEqual(a, b)) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  const result = await flushDue();
  return { ok: true, ...result };
});
