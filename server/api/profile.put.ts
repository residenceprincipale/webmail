import { currentSession } from "../utils/current-session";
import { assertSameOrigin } from "../utils/csrf";
import { readProfile, writeProfile, type Profile } from "../utils/profile";

export default defineEventHandler(async (event) => {
  if (event.method === "GET") {
    const session = await currentSession(event);
    if (!session) throw createError({ statusCode: 401, message: "Not authenticated" });
    return readProfile(session.login);
  }

  const origin = assertSameOrigin(event);
  if (!origin.ok) throw createError({ statusCode: origin.status, message: origin.error });
  const session = await currentSession(event);
  if (!session) throw createError({ statusCode: 401, message: "Not authenticated" });

  let body: { displayName?: unknown; photo?: unknown };
  try {
    body = await readBody(event);
  } catch {
    throw createError({ statusCode: 400, message: "Invalid JSON" });
  }

  const displayName = typeof body.displayName === "string" ? body.displayName.slice(0, 120).trim() : "";
  if (body.photo !== null && body.photo !== undefined && typeof body.photo !== "string") {
    throw createError({ statusCode: 400, message: "Invalid photo" });
  }
  const photo =
    body.photo && typeof body.photo === "string" && /^data:image\/[a-z+]+;base64,/i.test(body.photo)
      ? body.photo
      : null;

  const saved: Profile = writeProfile({ login: session.login, displayName, photo });
  return { ok: true, profile: saved };
});
