declare module "mailparser" {
  export function simpleParser(
    source: string | Buffer,
    options?: Record<string, unknown>,
  ): Promise<{
    subject?: string;
    text?: string | false | null;
    textAsHtml?: string | false | null;
    html?: string | false | null;
    attachments?: Array<{
      filename?: string | null;
      contentType?: string;
      contentDisposition?: string;
      size?: number;
      contentId?: string;
      partId?: string;
    }>;
    from?: { text?: string };
    messageId?: string;
    inReplyTo?: string | string[];
    references?: string | string[];
    headers?: Map<string, string | string[]>;
  }>;
}
