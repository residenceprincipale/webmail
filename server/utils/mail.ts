import { ImapFlow } from "imapflow";
import type { FetchMessageObject, MessageStructureObject } from "imapflow";
import { trackBox } from "./imap-pool";

export type Mailbox = {
  path: string;
  name: string;
  specialUse?: string;
  unseen: number;
  total: number;
};

export type MailSummary = {
  uid: number;
  subject: string;
  threadId: string;
  replyToMessageId: string | null;
  from: { name?: string; address: string } | null;
  to: Array<{ name?: string; address: string }>;
  date: string | null;
  flags: string[];
  seen: boolean;
  preview: string;
  attachments: number;
};

export type MailDetail = MailSummary & {
  html: string | null;
  text: string | null;
  files: Array<{ index: number; partId: string; filename: string; contentType: string; size: number; inline: boolean; contentId: string | null }>;
  messageId: string | null;
  references: string | null;
  cc: Array<{ name?: string; address: string }>;
  bcc: Array<{ name?: string; address: string }>;
};

export type Creds = { host: string; login: string; password: string };

async function openBox(client: ImapFlow, path: string, readOnly: boolean): Promise<void> {
  await client.mailboxOpen(path, { readOnly });
  trackBox(client, path);
}

export async function verifyCredentials(creds: Creds): Promise<void> {
  const client = new ImapFlow({
    host: creds.host,
    port: 993,
    secure: true,
    auth: { user: creds.login, pass: creds.password },
    logger: false,
  });
  try {
    await client.connect();
  } catch (err) {
    const e = err as { message?: string; response?: string; code?: string };
    const msg = e.response ?? e.message ?? String(err);
    if (/AUTHENTICATIONFAILED|AUTHENTICATE|auth/i.test(msg)) {
      throw new Error("Invalid login or password", { cause: err });
    }
    if (/ENOTFOUND|EAI_AGAIN|getaddrinfo/i.test(msg)) {
      throw new Error(`IMAP server not found (${creds.host})`, { cause: err });
    }
    if (/ETIMEDOUT|ECONNREFUSED|timed out/i.test(msg)) {
      throw new Error(`IMAP server unreachable (${creds.host}:993)`, { cause: err });
    }
    throw err;
  } finally {
    await client.logout().catch(() => {});
  }
}

function specialToName(specialUse?: string): string {
  switch (specialUse) {
    case "\\Inbox":
      return "Inbox";
    case "\\Sent":
      return "Sent";
    case "\\Drafts":
      return "Drafts";
    case "\\Trash":
      return "Trash";
    case "\\Junk":
      return "Spam";
    case "\\Archive":
      return "Archive";
    default:
      return "";
  }
}

function boxKey(b: { path: string; name?: string; specialUse?: string }): string {
  if (b.specialUse) return b.specialUse;
  const leaf = (b.path ?? "").split(".").pop() ?? b.path;
  const base = (leaf ?? "").toLowerCase();
  const alias: Record<string, string> = {
    sent: "\\Sent",
    drafts: "\\Drafts",
    trash: "\\Trash",
    junk: "\\Junk",
    archive: "\\Archive",
    inbox: "\\Inbox",
  };
  return alias[base] ?? b.path;
}

export async function listMailboxes(client: ImapFlow): Promise<Mailbox[]> {
  const boxes = await client.list();
  const seen = new Set<string>();
  const out: Mailbox[] = [];
  for (const b of boxes) {
    const displayName = specialToName(b.specialUse) || (b.path === "INBOX" ? "Inbox" : b.name);
    const key = boxKey(b as { path: string; name?: string; specialUse?: string });
    if (seen.has(key)) continue;
    seen.add(key);
    const status = await client.status(b.path, { messages: true, unseen: true }).catch(() => null);
    const st = status && typeof status === "object" ? status : null;
    out.push({
      path: b.path,
      name: displayName,
      specialUse: b.specialUse,
      unseen: st?.unseen ?? 0,
      total: st?.messages ?? 0,
    });
  }
  const rank = (m: Mailbox) => [m.path === "INBOX" ? 0 : 1, m.name].join("|");
  return out.sort((a, z) => rank(a).localeCompare(rank(z)));
}

export async function listMessages(
  client: ImapFlow,
  mailboxPath: string,
  page: number,
  perPage: number,
): Promise<{ messages: MailSummary[]; total: number }> {
  await openBox(client, mailboxPath, true);
  const status = await client.status(mailboxPath, { messages: true });
  const total = (status && typeof status === "object" ? status.messages : 0) ?? 0;
  if (!total) return { messages: [], total: 0 };

  const last = Math.max(1, total - page * perPage);
  const first = Math.max(1, total - (page + 1) * perPage + 1);
  const range = `${last}:${first}`;

  const out: MailSummary[] = [];
  for await (const msg of client.fetch(range, {
    envelope: true,
    flags: true,
    uid: true,
    bodyStructure: true,
    headers: ["references"],
  })) {
    out.push(toSummary(msg));
  }
  out.sort((a, b) => Number(b.uid) - Number(a.uid));
  return { messages: out, total };
}

export async function searchMessages(
  client: ImapFlow,
  mailboxPath: string,
  query: { subject?: string; from?: string; to?: string; text?: string },
  perPage = 50,
): Promise<{ messages: MailSummary[]; total: number }> {
  await openBox(client, mailboxPath, true);
  const res = await client.search(query, { uid: true });
  const uids = Array.isArray(res) ? res : [];
  if (!uids.length) return { messages: [], total: 0 };

  const recent = [...uids].sort((a, b) => Number(b) - Number(a)).slice(0, perPage);
  const out: MailSummary[] = [];
  for await (const msg of client.fetch(
    recent.join(","),
    {
      envelope: true,
      flags: true,
      uid: true,
      bodyStructure: true,
      headers: ["references"],
    },
    { uid: true },
  )) {
    out.push(toSummary(msg));
  }
  out.sort((a, b) => Number(b.uid) - Number(a.uid));
  return { messages: out, total: uids.length };
}

function baseSubject(subject: string): string {
  let s = (subject || "(no subject)").trim();
  for (let i = 0; i < 5; i++) {
    const next = s.replace(/^(re|fwd?|tr|rv|aw|wg|sv|vs|odp)\s*(\[[^\]]*\]|\([^)]*\))?\s*:\s*/i, "");
    if (next === s) break;
    s = next.trim();
  }
  return s.toLowerCase() || "(no subject)";
}

function threadKey(env: {
  messageId?: string;
  inReplyTo?: string;
  references?: string | string[];
  subject?: string;
}): { threadId: string; replyToMessageId: string | null } {
  const refs = Array.isArray(env.references)
    ? env.references
    : typeof env.references === "string"
      ? env.references.split(/\s+/)
      : [];
  const first = refs.map((r) => r.trim()).find(Boolean) ?? null;
  if (first) return { threadId: first, replyToMessageId: env.inReplyTo ?? first };
  if (env.inReplyTo) return { threadId: env.inReplyTo, replyToMessageId: env.inReplyTo };
  if (env.messageId) return { threadId: env.messageId, replyToMessageId: null };
  return { threadId: "subject:" + baseSubject(env.subject ?? ""), replyToMessageId: null };
}

function toSummary(msg: FetchMessageObject): MailSummary {
  const env = msg.envelope ?? {};
  const flags: string[] = msg.flags ? [...msg.flags] : [];
  const to = (env.to ?? []).map((t) => ({
    name: t.name || undefined,
    address: t.address ?? "",
  }));
  const from0 = env.from?.[0];
  const from = from0 ? { name: from0.name || undefined, address: from0.address ?? "" } : null;
  const refRaw = msg.headers instanceof Buffer ? msg.headers.toString("utf8") : "";
  const refLine = refRaw.replace(/\r?\n[ \t]+/g, " ").split(/\r?\n/).find((l) => /^references\s*:/i.test(l)) ?? "";
  const thread = threadKey({
    messageId: env.messageId,
    inReplyTo: env.inReplyTo,
    references: refLine.replace(/^references\s*:\s*/i, ""),
    subject: env.subject,
  });
  return {
    uid: msg.uid,
    subject: env.subject || "(no subject)",
    threadId: thread.threadId,
    replyToMessageId: thread.replyToMessageId,
    from,
    to: to.map((t) => ({ name: t.name || undefined, address: t.address ?? "" })),
    date: env.date
      ? (typeof env.date === "string" ? env.date : env.date.toISOString())
      : null,
    flags,
    seen: flags.includes("\\Seen"),
    preview: "",
    attachments: msg.bodyStructure ? countAttachments(msg.bodyStructure) : 0,
  };
}

function countAttachments(node: MessageStructureObject): number {
  if (!node?.childNodes?.length) return node?.disposition === "attachment" ? 1 : 0;
  return node.childNodes.reduce((sum: number, n: MessageStructureObject) => sum + countAttachments(n), 0);
}

export async function getMessage(
  client: ImapFlow,
  mailboxPath: string,
  uid: number,
): Promise<MailDetail | null> {
  await openBox(client, mailboxPath, false);
  const msg = await client.fetchOne(
    String(uid),
    { envelope: true, flags: true, source: true, uid: true, headers: ["references"] },
    { uid: true },
  );
  if (!msg) return null;

  const base = toSummary(msg);
  const raw = msg.source && !msg.bodyParts ? msg.source.toString() : "";

  const { simpleParser } = await import("mailparser");
  const parsed = raw
    ? await simpleParser(raw)
    : { html: null, text: null, attachments: [], messageId: undefined, references: undefined } as Awaited<ReturnType<typeof simpleParser>>;
  const html = typeof parsed.html === "string" ? parsed.html : null;
  const text = typeof parsed.text === "string" ? parsed.text : null;
  const addrList = (v: unknown): Array<{ name?: string; address: string }> => {
    const arr = Array.isArray(v) ? v : v ? [v] : [];
    return arr.flatMap((a) => {
      const val = (a as { value?: Array<{ name?: string; address?: string }> }).value ?? [];
      return val.map((e) => ({ name: e.name || undefined, address: e.address ?? "" }));
    });
  };
  const hdrs = parsed.headers as unknown as Map<string, unknown> | undefined;
  const msgId = parsed.messageId ?? null;
  const refList = Array.isArray(parsed.references)
    ? parsed.references
    : typeof parsed.references === "string"
      ? parsed.references.split(/\s+/)
      : [];
  const refsChain = [...refList.filter(Boolean), ...(msgId ? [msgId] : [])].join(" ") || null;
  const files = (parsed.attachments ?? []).map((a, i) => ({
    index: i + 1,
    partId: a.partId ?? String(i + 1),
    filename: a.filename || `attachment-${i + 1}`,
    contentType: a.contentType || "application/octet-stream",
    size: a.size ?? 0,
    inline: a.contentDisposition === "inline",
    contentId: a.contentId?.replace(/^[<>]+|[<>]+$/g, "") ?? null,
  }));

  await client.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true }).catch(() => {});

  return { ...base, html, text, files, messageId: msgId, references: refsChain, cc: addrList(hdrs?.get("cc")), bcc: addrList(hdrs?.get("bcc")) };
}

export async function setFlags(
  client: ImapFlow,
  mailboxPath: string,
  range: string,
  op: "add" | "remove",
  flags: string[],
) {
  await openBox(client, mailboxPath, false);
  if (op === "add") await client.messageFlagsAdd(range, flags, { uid: true });
  else await client.messageFlagsRemove(range, flags, { uid: true });
}

export async function moveMessage(
  client: ImapFlow,
  mailboxPath: string,
  range: string,
  target: string,
) {
  await openBox(client, mailboxPath, false);
  await client.messageMove(range, target, { uid: true });
}

const SYSTEM_LEAVES = new Set(["inbox", "sent", "drafts", "trash", "junk", "spam", "archive"]);
const FOLDER_NAME_RE = /^[\p{L}\p{N}][\p{L}\p{N} _-]{0,63}$/u;

export function cleanFolderName(name: unknown): string {
  const n = typeof name === "string" ? name.trim().replace(/\s+/g, " ") : "";
  if (!FOLDER_NAME_RE.test(n)) throw new Error("Invalid folder name");
  return n;
}

export function isSystemMailbox(m: { path: string; specialUse?: string }): boolean {
  if (m.specialUse) return true;
  const leaf = (m.path ?? "").split(".").pop()?.toLowerCase() ?? "";
  return SYSTEM_LEAVES.has(leaf);
}

export async function createMailbox(client: ImapFlow, name: unknown): Promise<string> {
  const path = cleanFolderName(name);
  await client.mailboxCreate(path);
  return path;
}

export async function renameMailbox(client: ImapFlow, oldPath: string, newName: unknown): Promise<string> {
  const box = (await listMailboxes(client)).find((b) => b.path === oldPath);
  if (!box) throw new Error("Mailbox not found");
  if (isSystemMailbox(box)) throw new Error("System mailbox");
  const next = cleanFolderName(newName);
  if (next === oldPath) return next;
  await client.mailboxRename(oldPath, next);
  return next;
}

export async function deleteMailbox(client: ImapFlow, path: string): Promise<void> {
  const box = (await listMailboxes(client)).find((b) => b.path === path);
  if (!box) throw new Error("Mailbox not found");
  if (isSystemMailbox(box)) throw new Error("System mailbox");
  const status = await client.status(path, { messages: true }).catch(() => null);
  const count = status && typeof status === "object" ? (status.messages ?? 0) : 0;
  if (count > 0) throw new Error("Folder not empty");
  await client.mailboxDelete(path);
}

const TRASH_ALIASES = ["INBOX.Trash", "INBOX.INBOX.Trash"];

function isTrash(path: string): boolean {
  const leaf = (path ?? "").split(".").pop()?.toLowerCase() ?? "";
  return leaf === "trash";
}

export async function deleteMessage(
  client: ImapFlow,
  mailboxPath: string,
  range: string,
  trashPath?: string,
) {
  if (!isTrash(mailboxPath)) {
    const target = trashPath ?? TRASH_ALIASES[0]!;
    await openBox(client, mailboxPath, false);
    await client.messageMove(range, target, { uid: true });
    return;
  }
  await openBox(client, mailboxPath, false);
  await client.messageDelete(range, { uid: true });
}

const TRASH_RETENTION_DAYS = 30;
const PURGE_THROTTLE_MS = 24 * 60 * 60 * 1000;
const lastPurge = new Map<string, number>();

export async function purgeOldTrash(client: ImapFlow, trashPath: string, login: string): Promise<number> {
  const last = lastPurge.get(login) ?? 0;
  if (Date.now() - last < PURGE_THROTTLE_MS) return 0;
  lastPurge.set(login, Date.now());
  const cutoff = new Date(Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  await openBox(client, trashPath, false);
  const found = await client.search({ before: cutoff }, { uid: true });
  const uids = Array.isArray(found) ? found : [];
  if (!uids.length) return 0;
  await client.messageDelete(uids.join(","), { uid: true });
  return uids.length;
}
