import { ImapFlow } from "imapflow";
import { createHash } from "node:crypto";
import type { Creds } from "./mail";

type Entry = {
  client: ImapFlow;
  box: string | null;
  lastUsed: number;
};

const IDLE_MS = 5 * 60 * 1000;
const pool = new Map<string, Entry>();

function key(creds: Creds): string {
  const pw = createHash("sha256").update(creds.password).digest("hex").slice(0, 16);
  return `${creds.host}|${creds.login}|${pw}`;
}

async function open(creds: Creds): Promise<Entry> {
  const client = new ImapFlow({
    host: creds.host,
    port: 993,
    secure: true,
    auth: { user: creds.login, pass: creds.password },
    logger: false,
  });
  await client.connect();
  return { client, box: null, lastUsed: Date.now() };
}

function expired(e: Entry): boolean {
  return Date.now() - e.lastUsed > IDLE_MS;
}

async function sweep(): Promise<void> {
  for (const [k, e] of [...pool]) {
    if (!expired(e)) continue;
    pool.delete(k);
    await e.client.logout().catch(() => {});
  }
}

setInterval(() => void sweep(), 60_000).unref?.();

/** Reuses the open IMAP connection for these credentials. */
export async function withClient<R>(creds: Creds, fn: (c: ImapFlow) => Promise<R>): Promise<R> {
  await sweep();
  const k = key(creds);
  let entry = pool.get(k);
  if (!entry || !entry.client.usable) {
    if (entry) pool.delete(k);
    entry = await open(creds);
    pool.set(k, entry);
  }
  entry.lastUsed = Date.now();
  const boxBefore = entry.box;
  try {
    return await fn(entry.client);
  } finally {
    try {
      if (entry.box && entry.box !== boxBefore) await entry.client.mailboxClose();
    } catch {
      pool.delete(k);
      await entry.client.logout().catch(() => {});
    }
  }
}

export function trackBox(client: ImapFlow, box: string): void {
  for (const e of pool.values()) {
    if (e.client === client) e.box = box;
  }
}

export function poolStats(): { connections: number } {
  return { connections: pool.size };
}
