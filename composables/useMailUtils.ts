import type { Locale } from "~/lib/i18n";

export const PAGE_SIZE = 50;

export function toLocalInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function plainToHtml(text: string): string {
  const esc = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return esc
    .split(/\n{2,}/)
    .map((chunk) => `<p>${chunk.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function formatSize(bytes: number, locale: Locale = "en"): string {
  const units = locale === "fr" ? ["o", "Ko", "Mo"] : ["B", "KB", "MB"];
  if (!bytes) return `0 ${units[0]}`;
  if (bytes < 1024) return bytes + ` ${units[0]}`;
  if (bytes < 1024 * 1024) return Math.ceil(bytes / 1024) + ` ${units[1]}`;
  return (bytes / (1024 * 1024)).toFixed(1) + ` ${units[2]}`;
}

export function shortDate(iso: string, locale: Locale): string {
  const tag = locale === "fr" ? "fr-FR" : "en-US";
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString(tag, { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString(tag, { day: "2-digit", month: "short" });
}

export const PRESETS: { key: "in1hour" | "tomorrow8am" | "nextMon8am"; value: () => string }[] = [
  {
    key: "in1hour",
    value: () => toLocalInput(new Date(Date.now() + 3600_000)),
  },
  {
    key: "tomorrow8am",
    value: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(8, 0, 0, 0);
      return toLocalInput(d);
    },
  },
  {
    key: "nextMon8am",
    value: () => {
      const d = new Date();
      d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
      d.setHours(8, 0, 0, 0);
      return toLocalInput(d);
    },
  },
];

export const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ color: [] }, { background: [] }],
  ["link", "clean"],
];
