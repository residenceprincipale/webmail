import { currentSession } from "../utils/current-session";
import { withClient } from "../utils/imap-pool";
import { listMailboxes, listMessages, getMessage } from "../utils/mail";

export default defineEventHandler(async (event) => {
  const session = await currentSession(event);
  if (!session) throw createError({ statusCode: 401, message: "Not authenticated" });
  const q = getQuery(event);
  const mailbox = typeof q.mailbox === "string" ? q.mailbox : "INBOX";
  const page = Math.max(0, Number(q.page ?? 0));
  const uidParam = typeof q.uid === "string" ? q.uid : null;

  try {
    return await withClient(session, async (client) => {
      if (uidParam) {
        const uid = Number(uidParam);
        if (!Number.isFinite(uid)) {
          throw createError({ statusCode: 400, message: "Invalid uid" });
        }
        return { mail: await getMessage(client, mailbox, uid) };
      }
      if (q.summary === "1") {
        return { mailboxes: await listMailboxes(client) };
      }
      return await listMessages(client, mailbox, page, 50);
    });
  } catch (err) {
    if (err && typeof err === "object" && "statusCode" in err) throw err;
    throw createError({
      statusCode: 500,
      message: err instanceof Error ? err.message : "IMAP error",
    });
  }
});
