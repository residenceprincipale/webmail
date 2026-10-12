import { currentSession } from "../utils/current-session";
import { readProfile } from "../utils/profile";

export default defineEventHandler(async (event) => {
  const session = await currentSession(event);
  if (!session) throw createError({ statusCode: 401, message: "Not authenticated" });
  return { login: session.login, host: session.host, profile: readProfile(session.login) };
});
