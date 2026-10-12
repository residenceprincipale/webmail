import { currentSession } from "../utils/current-session";
import { withClient } from "../utils/imap-pool";
import { searchMessages } from "../utils/mail";

type Parsed = {
  subject?: string;
  from?: string;
  to?: string;
  body?: string;
  text?: string;
  flagged?: boolean;
};

function parseQuery(raw: string): Parsed {
  const out: Parsed = {};
  const rest: string[] = [];
  for (const token of raw.match(/(\S+:"[^"]*"|\S+:\S+|\S+)/g) ?? []) {
    const m = token.match(/^(subject|from|to|body|text|label|is):(.*)$/i);
    if (!m) {
      rest.push(token);
      continue;
    }
    const key = m[1]!.toLowerCase();
    const value = m[2]!.replace(/^"|"$/g, "");
    if (key === "is" && /flag|star/i.test(value)) {
      out.flagged = true;
    } else if (key === "label") {
      out.text = value;
    } else if (key === "from" || key === "to" || key === "subject" || key === "body" || key === "text") {
      out[key] = value;
    }
  }
  if (rest.length) out.text = [out.text, rest.join(" ")].filter(Boolean).join(" ");
  return out;
}

export default defineEventHandler(async (event) => {
  const session = await currentSession(event);
  if (!session) throw createError({ statusCode: 401, message: "Not authenticated" });

  const q = getQuery(event);
  const raw = typeof q.q === "string" ? q.q.trim() : "";
  if (!raw) return { results: [], total: 0 };
  const mailbox = typeof q.mailbox === "string" ? q.mailbox : "INBOX";
  const parsed = parseQuery(raw);

  try {
    const { messages, total } = await withClient(session, (client) =>
      searchMessages(client, mailbox, {
        subject: parsed.subject,
        from: parsed.from,
        to: parsed.to,
        text: parsed.text ?? parsed.body,
      }),
    );
    const results = parsed.flagged ? messages.filter((m) => m.flags.includes("\\Flagged")) : messages;
    return { results, total: parsed.flagged ? results.length : total, parsed };
  } catch (err) {
    throw createError({
      statusCode: 500,
      message: err instanceof Error ? err.message : "Search failed",
    });
  }
});
