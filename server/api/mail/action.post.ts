import { currentSession } from "../../utils/current-session";
import { assertSameOrigin } from "../../utils/csrf";
import { withClient } from "../../utils/imap-pool";
import { setFlags, moveMessage, deleteMessage, listMailboxes } from "../../utils/mail";

export default defineEventHandler(async (event) => {
  const origin = assertSameOrigin(event);
  if (!origin.ok) throw createError({ statusCode: origin.status, message: origin.error });
  const session = await currentSession(event);
  if (!session) throw createError({ statusCode: 401, message: "Not authenticated" });

  let body: {
    action?: "flag" | "unflag" | "move" | "delete" | "seen" | "unseen";
    mailbox?: string;
    uid?: number;
    uids?: number[];
    target?: string;
  };
  try {
    body = await readBody(event);
  } catch {
    throw createError({ statusCode: 400, message: "Invalid JSON" });
  }
  const mailbox = body.mailbox ?? "INBOX";
  const uids = [...(Array.isArray(body.uids) ? body.uids : []), ...(body.uid !== undefined ? [body.uid] : [])]
    .map(Number)
    .filter(Number.isFinite);
  if (!uids.length) throw createError({ statusCode: 400, message: "Invalid uid" });
  const range = [...new Set(uids)].sort((a, b) => a - b).join(",");

  let trashPath: string | undefined;
  if (body.action === "delete") {
    trashPath = (await withClient(session, (client) => listMailboxes(client)))
      .find((m) => m.specialUse === "\\Trash")?.path;
  }

  try {
    await withClient(session, async (client) => {
      switch (body.action) {
        case "flag":
          await setFlags(client, mailbox, range, "add", ["\\Flagged"]);
          break;
        case "unflag":
          await setFlags(client, mailbox, range, "remove", ["\\Flagged"]);
          break;
        case "seen":
          await setFlags(client, mailbox, range, "add", ["\\Seen"]);
          break;
        case "unseen":
          await setFlags(client, mailbox, range, "remove", ["\\Seen"]);
          break;
        case "move":
          if (!body.target) throw new Error("Missing target");
          await moveMessage(client, mailbox, range, body.target);
          break;
        case "delete":
          await deleteMessage(client, mailbox, range, trashPath);
          break;
        default:
          throw new Error("Unknown action");
      }
    });
    return { ok: true };
  } catch (err) {
    if (err && typeof err === "object" && "statusCode" in err) throw err;
    throw createError({
      statusCode: 500,
      message: err instanceof Error ? err.message : "IMAP error",
    });
  }
});
