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

export type MailAttachment = {
  index: number;
  partId: string;
  filename: string;
  contentType: string;
  size: number;
  inline: boolean;
  contentId: string | null;
};

export type MailDetail = MailSummary & {
  html: string | null;
  text: string | null;
  files: MailAttachment[];
};
