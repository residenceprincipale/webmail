import { writeFileSync, readFileSync, existsSync, mkdirSync, unlinkSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import nodemailer from "nodemailer";
import type { MailSession } from "./session";

export type ScheduledMessage = {
  id: string;
  login: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  text: string;
  html?: string;
  sendAt: number;
  inReplyTo?: string;
  references?: string;
  attachments: { name: string; type?: string; content: string }[];
  fromName?: string;
  priority?: "high" | "low";
  receipt?: boolean;
  replyTo?: string;
};

const DIR = process.env.WEBMAIL_SCHEDULE_DIR ?? join(process.cwd(), ".scheduled");
const SESSION_DIR = process.env.WEBMAIL_SESSION_DIR ?? join(process.cwd(), ".sessions");

function ensureDir() {
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
}

export function saveDraft(msg: Omit<ScheduledMessage, "id">): string {
  ensureDir();
  const id = randomUUID();
  const file = join(DIR, `${id}.json`);
  writeFileSync(file, JSON.stringify({ ...msg, id }, null, 2), "utf8");
  return id;
}

function removeDraft(id: string): void {
  const file = join(DIR, `${id}.json`);
  if (existsSync(file)) unlinkSync(file);
}

function listAll(): ScheduledMessage[] {
  if (!existsSync(DIR)) return [];
  return readdirSync(DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      try {
        return JSON.parse(readFileSync(join(DIR, f), "utf8")) as ScheduledMessage;
      } catch {
        return null;
      }
    })
    .filter((m): m is ScheduledMessage => m !== null);
}

export type SendOutcome = { sent: number; failed: number; errors: string[] };

export async function flushDue(now = Date.now()): Promise<SendOutcome> {
  const due = listAll().filter((m) => typeof m.sendAt === "number" && m.sendAt <= now);
  const out: SendOutcome = { sent: 0, failed: 0, errors: [] };
  for (const msg of due) {
    const auth = readSessionFor(msg.login);
    if (!auth) {
      removeDraft(msg.id);
      out.failed += 1;
      out.errors.push(`${msg.id}: session lost, message dropped`);
      continue;
    }
    try {
      await sendOne(msg, auth);
      removeDraft(msg.id);
      out.sent += 1;
    } catch (err) {
      out.failed += 1;
      out.errors.push(`${msg.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return out;
}

async function sendOne(msg: ScheduledMessage, auth: MailSession): Promise<void> {
  const transport = nodemailer.createTransport({
    host: process.env.WEBMAIL_SMTP_HOST || auth.host,
    port: Number(process.env.WEBMAIL_SMTP_PORT || 465),
    secure: true,
    auth: { user: auth.login, pass: auth.password },
  });
  const headers: Record<string, string> = {};
  if (msg.inReplyTo) {
    headers["In-Reply-To"] = msg.inReplyTo;
    headers["References"] = (msg.references ? msg.references + " " : "") + msg.inReplyTo;
  }
  if (msg.receipt) headers["Disposition-Notification-To"] = auth.login;
  if (msg.replyTo) headers["Reply-To"] = msg.replyTo;
  await transport.sendMail({
    from: { name: msg.fromName || "Webmail", address: auth.login },
    to: msg.to,
    cc: msg.cc || undefined,
    bcc: msg.bcc || undefined,
    subject: msg.subject,
    text: msg.text,
    html: msg.html || undefined,
    priority: msg.priority,
    headers: Object.keys(headers).length ? headers : undefined,
    attachments: msg.attachments.map((a) => ({
      filename: a.name,
      content: Buffer.from(a.content, "base64"),
      contentType: a.type || undefined,
    })),
  });
}

export function stashSession(s: MailSession): void {
  if (!existsSync(SESSION_DIR)) mkdirSync(SESSION_DIR, { recursive: true });
  const file = join(SESSION_DIR, `${encodeURIComponent(s.login)}.json`);
  writeFileSync(file, JSON.stringify(s, null, 2), { encoding: "utf8", mode: 0o600 });
}

function readSessionFor(login: string): MailSession | null {
  const file = join(SESSION_DIR, `${encodeURIComponent(login)}.json`);
  if (!existsSync(file)) return null;
  try {
    const s = JSON.parse(readFileSync(file, "utf8")) as MailSession;
    unlinkSync(file);
    return s;
  } catch {
    return null;
  }
}
