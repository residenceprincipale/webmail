import type { H3Event } from "h3";
import { decodeSession, WMSESSION_COOKIE, type MailSession } from "./session";

export async function currentSession(event: H3Event): Promise<MailSession | null> {
  return decodeSession(getCookie(event, WMSESSION_COOKIE));
}
