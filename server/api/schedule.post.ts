import { currentSession } from "../utils/current-session";
import { assertSameOrigin } from "../utils/csrf";
import { saveDraft, stashSession } from "../utils/scheduled";

type Attachment = { name?: string; type?: string; content?: string };

/** Planifie un envoi : le message est conserve jusqu'a son heure d'envoi. */
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
    sendAt?: string;
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

  const to = body.to?.trim();
  if (!to) throw createError({ statusCode: 400, message: "Recipient required" });
  const sendAt = new Date(body.sendAt ?? "");
  if (Number.isNaN(sendAt.getTime())) {
    throw createError({ statusCode: 400, message: "Invalid date" });
  }
  if (sendAt.getTime() <= Date.now()) {
    throw createError({ statusCode: 400, message: "Date must be in the future" });
  }

  const files = (body.attachments ?? []).filter((a) => a && typeof a.content === "string");
  stashSession(session);
  const id = saveDraft({
    login: session.login,
    to,
    cc: body.cc?.trim() || undefined,
    bcc: body.bcc?.trim() || undefined,
    subject: body.subject?.trim() || "(no subject)",
    text: body.text ?? "",
    html: body.html || undefined,
    sendAt: sendAt.getTime(),
    inReplyTo: body.inReplyTo?.trim() || undefined,
    references: body.references?.trim() || undefined,
    attachments: files.map((f) => ({
      name: f.name || "attachment",
      type: f.type || undefined,
      content: f.content!,
    })),
    fromName: body.fromName?.trim() || undefined,
    priority: body.priority === "high" || body.priority === "low" ? body.priority : undefined,
    receipt: body.receipt === true,
    replyTo: body.replyTo?.trim() || undefined,
  });

  return { ok: true, id, sendAt: sendAt.toISOString() };
});
