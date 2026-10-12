<template>
  <pre v-if="!bodyView" class="whitespace-pre-wrap text-sm">{{ mail.text ?? t("empty") }}</pre>
  <div v-else @click="onBodyClick">
    <div class="prose max-w-none text-sm thread-html" v-html="bodyView.html" />
    <button
      v-if="bodyView.hasQuotes"
      class="mt-2 cursor-pointer text-sm text-neutral-700 hover:text-black"
      @click="collapsed = !collapsed"
    >
      {{ collapsed ? `${t("showQuoted")} (${bodyView.nestedCount || bodyView.quoteCount})` : t("hideQuoted") }}
    </button>
  </div>
</template>

<script setup lang="ts">
import DOMPurify from "isomorphic-dompurify";
import type { MailDetail } from "~/lib/types";

const props = defineProps<{ mail: MailDetail }>();
const { t } = useI18n();

const sanitized = computed(() =>
  props.mail.html
    ? DOMPurify.sanitize(props.mail.html, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: ["form", "input", "button", "select", "textarea", "option", "label", "fieldset"],
        FORBID_ATTR: ["srcset", "formaction", "ping"],
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|cid|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i,
      })
    : null,
);

const collapsed = ref(true);

const bodyView = computed(() => {
  if (!sanitized.value) return null;
  if (typeof document === "undefined") return { html: sanitized.value, hasQuotes: false, quoteCount: 0, nestedCount: 0 };
  const root = document.createElement("div");
  root.innerHTML = sanitized.value;
  for (const img of [...root.querySelectorAll('img[src^="cid:"]')]) {
    const cid = (img.getAttribute("src") ?? "").slice(4).replace(/^[<>]+|[<>]+$/g, "");
    const match = (props.mail.files ?? []).find((f) => f.contentId === cid);
    if (!match && !img.getAttribute("alt")) {
      const span = document.createElement("span");
      span.className = "text-xs text-neutral-700";
      span.textContent = t("missingImage");
      img.replaceWith(span);
    }
  }
  const hidden: string[] = [];
  const topQuotes = [...root.children].filter((el) => el.tagName === "BLOCKQUOTE");
  const nested: Element[] = [];
  for (const q of topQuotes) nested.push(...[...q.querySelectorAll("blockquote")]);
  for (const el of [...root.querySelectorAll(".gmail_quote, .gmail_extra, .moz-cite-prefix")]) {
    if (el.closest("blockquote")) {
      nested.push(el as HTMLElement);
    } else {
      hidden.push((el as HTMLElement).outerHTML);
      el.remove();
    }
  }
  const quoteMarkers = [...root.querySelectorAll("*")].filter(
    (el) =>
      !el.children.length &&
      !el.closest("blockquote") &&
      /^\s*(Le\s.+a\s+écrit\s*:|On\s.+\swrote\s*:|-.{0,60}wrote\s*:)/i.test(el.textContent ?? ""),
  );
  for (const el of quoteMarkers) {
    let node: Element | null = el;
    while (node && node.parentElement && node.parentElement !== root) node = node.parentElement;
    if (node) {
      hidden.push(node.outerHTML);
      node.remove();
    }
  }
  for (const el of nested) {
    const btn = document.createElement("button");
    btn.textContent = "...";
    btn.className = "quoted-toggle";
    btn.setAttribute("data-quoted", "1");
    el.replaceWith(btn);
  }
  const quoteCount = hidden.length + nested.length;
  return {
    html: collapsed.value ? root.innerHTML : sanitized.value,
    hasQuotes: quoteCount > 0,
    quoteCount,
    nestedCount: nested.length,
  };
});

function onBodyClick(e: MouseEvent) {
  const btn = (e.target as HTMLElement).closest("[data-quoted]");
  if (btn) collapsed.value = !collapsed.value;
}
</script>
