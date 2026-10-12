import { currentSession } from "../utils/current-session";
import { withClient } from "../utils/imap-pool";
import type { DownloadNotFound, DownloadObject } from "imapflow";

export default defineEventHandler(async (event) => {
  const session = await currentSession(event);
  if (!session) throw createError({ statusCode: 401, message: "Not authenticated" });

  const q = getQuery(event);
  const mailbox = typeof q.mailbox === "string" ? q.mailbox : "INBOX";
  const uid = Number(q.uid);
  if (!Number.isFinite(uid)) throw createError({ statusCode: 400, message: "Invalid uid" });
  // part = MIME part id (detail f.partId, e.g. "2"; absent = whole message)
  const partRaw = typeof q.part === "string" ? q.part : null;
  if (partRaw !== null && partRaw !== "" && !/^[\w.-]{1,32}$/.test(partRaw)) {
    throw createError({ statusCode: 400, message: "Invalid part" });
  }
  const part = partRaw === null || partRaw === "" ? undefined : partRaw;

  try {
    const data = await withClient(session, async (client) => {
      await client.mailboxOpen(mailbox, { readOnly: true }).catch(() => {});
      const dl: DownloadObject | DownloadNotFound =
        part === undefined
          ? await client.download(String(uid), undefined, { uid: true })
          : await client.download(String(uid), part, { uid: true });
      if (!dl || !dl.content) return null;
      const chunks: Buffer[] = [];
      for await (const chunk of dl.content) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      }
      return {
        buf: Buffer.concat(chunks),
        filename: String(dl.meta?.filename ?? "message.eml"),
        contentType: dl.meta?.contentType || "application/octet-stream",
      };
    });
    if (!data) throw createError({ statusCode: 404, message: "Message not found" });
    setHeader(event, "Content-Type", data.contentType);
    const safeName = data.filename.replace(/["\r\n]/g, "").slice(0, 200) || "message.eml";
    setHeader(event, "Content-Disposition", `attachment; filename="${encodeURIComponent(safeName)}"`);
    return data.buf;
  } catch (err) {
    if (err && typeof err === "object" && "statusCode" in err) throw err;
    throw createError({
      statusCode: 500,
      message: err instanceof Error ? err.message : "Download failed",
    });
  }
});
