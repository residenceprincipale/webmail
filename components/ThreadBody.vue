<template>
  <pre v-if="!bodyView" class="whitespace-pre-wrap text-sm">{{ mail.text ?? t("empty") }}</pre>
  <div v-else @click="onBodyClick">
    <div class="prose max-w-none overflow-x-auto text-sm thread-html break-words" v-html="bodyView.html" />
    <button
      v-if="!collapsed && bodyView.hasQuotes"
      class="mt-2 cursor-pointer text-sm text-neutral-700 hover:text-black"
      @click="collapsed = true"
    >
      {{ `${t("hideQuoted")} (${bodyView.quoteCount})` }}
    </button>
  </div>
</template>

<script setup lang="ts">
import DOMPurify from "isomorphic-dompurify";
import type { MailDetail } from "~/lib/types";
import { nestQuotes } from "~/composables/useMailUtils";

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
  if (typeof document === "undefined") return { html: sanitized.value, hasQuotes: false, quoteCount: 0 };
  const root = document.createElement("div");
  root.innerHTML = nestQuotes(sanitized.value);
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
  const targets: Element[] = [];
  const pushUnique = (el: Element): void => {
    if (!targets.includes(el)) targets.push(el);
  };
  for (const q of [...root.children].filter((el) => el.tagName === "BLOCKQUOTE")) pushUnique(q);
  for (const el of [...root.querySelectorAll(".gmail_quote, .gmail_extra, .moz-cite-prefix")]) {
    if (!el.closest("blockquote")) pushUnique(el);
  }
  for (const el of [...root.querySelectorAll("*")].filter(
    (el) =>
      !el.children.length &&
      !el.closest("blockquote") &&
      /^\s*(Le\s.+a\s+écrit\s*:|On\s.+\swrote\s*:|-.{0,60}wrote\s*:)/i.test(el.textContent ?? ""),
  )) {
    let node: Element | null = el;
    while (node && node.parentElement && node.parentElement !== root) node = node.parentElement;
    if (node && node !== root) pushUnique(node);
  }
  const quoteCount = targets.length;
  if (!collapsed.value) return { html: nestQuotes(sanitized.value), hasQuotes: quoteCount > 0, quoteCount };
  const tops: Element[] = [];
  for (const el of targets) {
    let node: Element | null = el;
    while (node && node.parentElement && node.parentElement !== root) node = node.parentElement;
    if (node && node !== root && !tops.includes(node)) tops.push(node);
  }
  let runs = 0;
  let prev: Element | null = null;
  const flush = (run: Element[]): void => {
    if (!run.length) return;
    runs++;
    const btn = document.createElement("button");
    btn.textContent = "...";
    btn.className = "quoted-toggle";
    btn.setAttribute("data-quoted", "1");
    run[0]!.replaceWith(btn);
    for (const el of run.slice(1)) el.remove();
  };
  const run: Element[] = [];
  for (const el of [...root.children].filter((c) => tops.includes(c))) {
    if (prev && prev.nextElementSibling !== el) flush(run.splice(0));
    run.push(el);
    prev = el;
  }
  flush(run);
  return { html: root.innerHTML, hasQuotes: runs > 0, quoteCount: runs };
});

function onBodyClick(e: MouseEvent) {
  const btn = (e.target as HTMLElement).closest("[data-quoted]");
  if (btn) collapsed.value = false;
}
</script>
