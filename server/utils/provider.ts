export const DEFAULT_IMAP_HOST = process.env.WEBMAIL_IMAP_HOST || "ssl0.ovh.net";

export const SMTP_PORT = Number(process.env.WEBMAIL_SMTP_PORT || 465);

export function smtpHost(fallback: string): string {
  return process.env.WEBMAIL_SMTP_HOST || fallback;
}

export function passwordProvider(): string {
  return process.env.WEBMAIL_PASSWORD_PROVIDER ?? "ovh";
}

export function allowedImapHosts(): string[] {
  return (process.env.WEBMAIL_ALLOWED_IMAP_HOSTS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}
