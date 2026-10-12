import { currentSession } from "../../utils/current-session";

export default defineEventHandler(async (event) => {
  const session = await currentSession(event);
  return { authenticated: !!session };
});
