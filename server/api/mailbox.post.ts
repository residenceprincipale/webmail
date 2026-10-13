import { currentSession } from "../utils/current-session";
import { assertSameOrigin } from "../utils/csrf";
import { withClient } from "../utils/imap-pool";
import { createMailbox, renameMailbox, deleteMailbox } from "../utils/mail";

export default defineEventHandler(async (event) => {
  const origin = assertSameOrigin(event);
  if (!origin.ok) throw createError({ statusCode: origin.status, message: origin.error });
  const session = await currentSession(event);
  if (!session) throw createError({ statusCode: 401, message: "Not authenticated" });

  let body: { op?: string; name?: unknown; path?: unknown; newName?: unknown };
  try {
    body = await readBody(event);
  } catch {
    throw createError({ statusCode: 400, message: "Invalid JSON" });
  }

  try {
    const out = await withClient(session, async (client) => {
      switch (body.op) {
        case "create":
          return { path: await createMailbox(client, body.name) };
        case "rename":
          return { path: await renameMailbox(client, String(body.path ?? ""), body.newName) };
        case "delete":
          await deleteMailbox(client, String(body.path ?? ""));
          return {};
        default:
          throw new Error("Unknown op");
      }
    });
    return { ok: true, ...out };
  } catch (err) {
    if (err && typeof err === "object" && "statusCode" in err) throw err;
    const msg = err instanceof Error ? err.message : "IMAP error";
    const statusCode = /not empty/i.test(msg)
      ? 409
      : /invalid|not found|system|unknown/i.test(msg)
        ? 400
        : 500;
    throw createError({ statusCode, message: msg });
  }
});
