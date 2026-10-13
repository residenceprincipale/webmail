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

// Quill flattens nested blockquotes on paste (flat document model), so reply
// depth is carried by its native ql-indent-N classes in the editor and
// rebuilt into nested blockquotes on send. Depth capped: Quill ships 1..8.
const MAX_QUOTE_DEPTH = 8;

function indentOf(el: Element): number {
  const m = (el.getAttribute("class") ?? "").match(/ql-indent-([1-8])/);
  return m ? Number(m[1]) + 1 : el.tagName === "BLOCKQUOTE" ? 1 : 0;
}

export function quoteToQuill(html: string): string {
  if (typeof document === "undefined") return html;
  const root = document.createElement("div");
  root.innerHTML = html;
  const out = document.createElement("div");
  const walk = (node: Node, depth: number): void => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 3) {
        if ((child.textContent ?? "").trim()) {
          const bq = document.createElement("blockquote");
          if (depth > 1) bq.className = `ql-indent-${Math.min(depth - 1, MAX_QUOTE_DEPTH - 1)}`;
          bq.textContent = child.textContent;
          out.appendChild(bq);
        }
      } else if (child instanceof Element) {
        if (child.tagName === "BLOCKQUOTE") {
          walk(child, Math.min(depth + 1, MAX_QUOTE_DEPTH));
        } else if (depth > 0 && child.tagName !== "DIV") {
          const bq = document.createElement("blockquote");
          if (depth > 1) bq.className = `ql-indent-${Math.min(depth - 1, MAX_QUOTE_DEPTH - 1)}`;
          bq.appendChild(child.cloneNode(true));
          out.appendChild(bq);
        } else if (depth > 0) {
          walk(child, depth);
        } else {
          out.appendChild(child.cloneNode(true));
        }
      }
    }
  };
  walk(root, 0);
  return out.innerHTML;
}

export function quillToQuote(html: string): string {
  if (typeof document === "undefined") return html;
  const root = document.createElement("div");
  root.innerHTML = html;
  const out = document.createElement("div");
  const stack: Element[] = [out];
  for (const child of [...root.childNodes]) {
    const depth = child instanceof Element ? indentOf(child) : 0;
    while (stack.length > depth + 1) stack.pop();
    while (stack.length < depth + 1) {
      const bq = document.createElement("blockquote");
      stack[stack.length - 1]!.appendChild(bq);
      stack.push(bq);
    }
    const host = stack[stack.length - 1]!;
    if (child instanceof Element && child.tagName === "BLOCKQUOTE") {
      for (const c of [...child.childNodes]) host.appendChild(c.cloneNode(true));
      if (!child.textContent?.trim() && ![...child.childNodes].length) host.appendChild(child.cloneNode(true));
    } else {
      host.appendChild(child.cloneNode(true));
    }
  }
  return out.innerHTML;
}

// Sibling blockquotes (flattened by the editor) read as separate quotes;
// nest each consecutive run so reply levels imbricate.
export function nestQuotes(html: string): string {
  if (typeof document === "undefined") return html;
  const root = document.createElement("div");
  root.innerHTML = html;
  const nest = (parent: Element): void => {
    for (const child of [...parent.children]) nest(child);
    const isGap = (el: Element): boolean =>
      el.tagName === "P" && (el.textContent ?? "").trim() === "";
    let run: Element[] = [];
    const flush = (): void => {
      if (run.length > 1) {
        let host = run[0]!;
        for (const bq of run.slice(1)) {
          host.appendChild(bq);
          host = bq;
        }
      }
      run = [];
    };
    for (const child of [...parent.children]) {
      if (child.tagName === "BLOCKQUOTE") {
        run.push(child);
      } else if (isGap(child) && run.length > 0) {
        const next = child.nextElementSibling;
        if (next?.tagName === "BLOCKQUOTE") child.remove();
        else flush();
      } else {
        flush();
      }
    }
    flush();
  };
  nest(root);
  return root.innerHTML;
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
