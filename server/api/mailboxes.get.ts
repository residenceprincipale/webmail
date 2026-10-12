import { currentSession } from "../utils/current-session";
import { withClient } from "../utils/imap-pool";
import { listMailboxes } from "../utils/mail";

export default defineEventHandler(async (event) => {
  const session = await currentSession(event);
  if (!session) throw createError({ statusCode: 401, message: "Not authenticated" });
  try {
    const mailboxes = await withClient(session, listMailboxes);
    return { mailboxes };
  } catch (err) {
    throw createError({
      statusCode: 500,
      message: err instanceof Error ? err.message : "IMAP error",
    });
  }
});
