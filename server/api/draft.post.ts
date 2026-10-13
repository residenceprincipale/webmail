import { currentSession } from "../utils/current-session";
import { assertSameOrigin } from "../utils/csrf";
import { withClient } from "../utils/imap-pool";
import { listMailboxes } from "../utils/mail";

const MAX_ATTACHMENTS = 10;
const MAX_FILE_BYTES = 20 * 1024 * 1024;

type Attachment = { name?: string; type?: string; content?: string; cid?: string; inline?: boolean };

export default defineEventHandler(async (event) => {
  const origin = assertSameOrigin(event);
  if (!origin.ok) throw createError({ statusCode: origin.status, message: origin.error });
  const session = await currentSession(event);
  if (!session) throw createError({ statusCode: 401, message: "Not authenticated" });

  let body: {
    to?: string;
    cc?: string;
    bcc?: string;
    subject?: string;
    text?: string;
    html?: string;
    inReplyTo?: string;
    references?: string;
    attachments?: Attachment[];
    fromName?: string;
    priority?: string;
    receipt?: boolean;
    replyTo?: string;
  };
  try {
    body = await readBody(event);
  } catch {
    throw createError({ statusCode: 400, message: "Invalid JSON" });
  }

  const files = (body.attachments ?? []).filter((a) => a && typeof a.content === "string");
  if (files.length > MAX_ATTACHMENTS) {
    throw createError({ statusCode: 400, message: `Too many attachments (max ${MAX_ATTACHMENTS})` });
  }
  for (const f of files) {
    const bytes = Math.floor((f.content!.length * 3) / 4);
    if (bytes > MAX_FILE_BYTES) {
      throw createError({ statusCode: 400, message: `"${f.name}" exceeds 20 MB` });
    }
  }

  const { readProfile } = await import("../utils/profile");
  const profile = readProfile(session.login);
  const fromName = body.fromName?.trim() || profile.displayName || undefined;

  const headers: Record<string, string> = {};
  if (body.inReplyTo?.trim()) {
    headers["In-Reply-To"] = body.inReplyTo.trim();
    headers["References"] = (body.references?.trim() ? body.references.trim() + " " : "") + body.inReplyTo.trim();
  }
  if (body.receipt) headers["Disposition-Notification-To"] = session.login;
  if (body.replyTo?.trim()) headers["Reply-To"] = body.replyTo.trim();

  const nodemailer = (await import("nodemailer")).default;
  const builder = nodemailer.createTransport({ streamTransport: true, buffer: true });
  const to = body.to?.trim() || "undisclosed-recipients:;";
  const info = await builder.sendMail({
    from: fromName ? { name: fromName, address: session.login } : session.login,
    to,
    cc: body.cc?.trim() || undefined,
    bcc: body.bcc?.trim() || undefined,
    subject: body.subject?.trim() || "(no subject)",
    text: body.text ?? "",
    html: body.html || undefined,
    priority: body.priority === "high" || body.priority === "low" ? body.priority : undefined,
    headers: Object.keys(headers).length ? headers : undefined,
    attachments: files.map((f) => ({
      filename: f.name || "attachment",
      content: Buffer.from(f.content!, "base64"),
      contentType: f.type || undefined,
      cid: f.cid || undefined,
      contentDisposition: f.inline ? "inline" : undefined,
    })),
  });
  const raw = info.message as Buffer;

  try {
    await withClient(session, async (client) => {
      const boxes = await listMailboxes(client);
      const drafts =
        boxes.find((m) => m.specialUse === "\\Drafts")?.path ??
        boxes.find((m) => m.path.toLowerCase().includes("draft"))?.path ??
        "Drafts";
      try {
        await client.append(drafts, raw, ["\\Draft"]);
      } catch (err) {
        if (drafts !== "Drafts" || !/nonexistent|no such|not found|unknown mailbox/i.test(err instanceof Error ? err.message : "")) throw err;
        await client.mailboxCreate("Drafts");
        await client.append("Drafts", raw, ["\\Draft"]);
      }
    });
    return { ok: true };
  } catch (err) {
    throw createError({
      statusCode: 500,
      message: err instanceof Error ? err.message : "Draft save refused",
    });
  }
});
