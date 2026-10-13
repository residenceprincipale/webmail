<template>
  <div
    ref="box"
    :class="`fixed z-30 flex flex-col border border-neutral-300 bg-white ${expanded ? 'compose-large inset-2 top-4 bottom-4 sm:inset-x-6 sm:top-6 sm:bottom-6' : 'inset-x-0 bottom-0 max-h-[92dvh] sm:inset-x-auto sm:right-6 sm:w-[600px] sm:max-h-[85vh]'}`"
    :style="!expanded && (boxW || boxH) ? { width: boxW ? `${boxW}px` : undefined, height: boxH ? `${boxH}px` : undefined, maxHeight: 'calc(100vh - 48px)' } : undefined"
  >
    <div
      v-if="!expanded"
      class="absolute -left-1 -top-1 z-40 h-4 w-4 cursor-nwse-resize"
      :title="t('resizeCompose')"
      @mousedown="startResize"
    />
    <div class="flex items-center justify-between rounded-t-lg bg-black px-4 py-2 text-sm text-white">
      <span>{{ t("newMessage") }}</span>
      <div class="flex items-center gap-1">
        <button class="cursor-pointer px-2 text-xs text-white hover:text-white" :aria-expanded="showCc" @click="showCc = !showCc">
          {{ showCc ? t("hide") : t("ccBcc") }}
        </button>
        <button :aria-expanded="optOpen" :class="`cursor-pointer px-2 text-xs ${optOpen ? 'text-white underline' : 'text-white'} hover:text-white`" @click="optOpen = !optOpen">
          {{ optOpen ? t("hide") : t("show") }}
        </button>
        <button :aria-label="expanded ? t('shrinkCompose') : t('expandCompose')" :title="expanded ? t('shrinkCompose') : t('expandCompose')" class="cursor-pointer" @click="expanded = !expanded">
          <component :is="expanded ? ShrinkIcon : ExpandIcon" />
        </button>
        <button :aria-label="t('close')" class="cursor-pointer" @click="closeCompose">
          <CloseIcon />
        </button>
      </div>
    </div>
    <div
      class="relative flex min-h-0 flex-1 flex-col overflow-y-auto"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop.prevent="onDrop"
    >
      <RecipientInput v-model="to" :placeholder="t('recipientsPh')" :label="t('recipientsPh')" :suggestions="contacts ?? []" />
      <template v-if="showCc">
        <RecipientInput v-model="cc" placeholder="Cc" label="Cc" :suggestions="contacts ?? []" />
        <RecipientInput v-model="bcc" :placeholder="t('bcc')" :label="t('bcc')" :suggestions="contacts ?? []" />
      </template>
      <div class="border-b border-neutral-300">
        <input v-model="subject" :placeholder="t('subject')" :aria-label="t('subject')" class="w-full px-4 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black" >
      </div>
      <div v-if="optOpen" class="flex flex-col gap-2 border-b border-neutral-300 bg-white px-4 py-3">
        <label class="text-xs text-neutral-700">
          {{ t("senderName") }}
          <input
            v-model="fromName"
            type="text"
            :placeholder="login"
            class="mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-black"
          >
        </label>
        <div class="flex items-center gap-2 text-xs text-neutral-700">
          <span>{{ t("priority") }}</span>
          <button
            v-for="p in (['normal', 'high', 'low'] as const)"
            :key="p"
            type="button"
            :aria-pressed="priority === p"
            :class="`cursor-pointer rounded-full px-2.5 py-1 text-[11px] ${priority === p ? 'bg-black text-white' : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'}`"
            @click="priority = p"
          >
            {{ p === "normal" ? t("prioNormal") : p === "high" ? t("prioHigh") : t("prioLow") }}
          </button>
        </div>
        <label class="text-xs text-neutral-700">
          {{ t("replyToLabel") }}
          <input
            v-model="replyTo"
            type="email"
            :placeholder="login"
            class="mt-1 w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-black"
          >
        </label>
        <label class="flex cursor-pointer items-center gap-2 text-xs text-neutral-700">
          <input v-model="receipt" type="checkbox" class="wm-check cursor-pointer" >
          {{ t("receipt") }}
        </label>
      </div>
      <div ref="quillBounds" class="relative flex min-h-0 flex-1 flex-col">
        <div class="flex min-h-0 flex-1 flex-col [&_.ql-container]:flex [&_.ql-container]:min-h-0 [&_.ql-container]:flex-1 [&_.ql-container]:flex-col [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[240px] [&_.ql-editor]:flex-1 [&_.ql-editor]:overflow-y-auto [&_.ql-editor]:text-sm [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-neutral-300">
          <div ref="editor" class="flex min-h-0 flex-1 flex-col [&_.ql-container]:flex [&_.ql-container]:min-h-0 [&_.ql-container]:flex-1 [&_.ql-container]:flex-col [&_.ql-editor]:flex-1" />
        </div>
      </div>
      <div
        v-if="dragging"
        class="pointer-events-none absolute inset-0 z-50 flex items-center justify-center rounded-lg border-2 border-dashed border-black bg-white/90 text-sm font-medium text-black"
      >
        {{ t("dropFiles") }}
      </div>
      <ul v-if="files.length > 0" class="flex flex-wrap gap-2 border-t border-neutral-300 px-4 py-3">
        <li v-for="(f, i) in files" :key="`${f.name}-${i}`" class="flex items-center gap-2 border border-neutral-300 bg-white px-3 py-2 text-xs">
          <PaperclipIcon />
          <span class="max-w-[180px] truncate">{{ f.name }}</span>
          <span class="text-neutral-700">{{ Math.ceil(f.size / 1024) }} {{ t("kb") }}</span>
          <button
            class="cursor-pointer text-neutral-700 hover:text-black"
            :aria-label="`${t('remove')} ${f.name}`"
            @click="files = files.filter((_, j) => j !== i)"
          >
            &times;
          </button>
        </li>
      </ul>
    </div>
    <div class="flex flex-wrap items-center gap-2 border-t border-neutral-300 px-3 py-3 sm:gap-3 sm:px-4">
      <button
        :disabled="busy"
        class="cursor-pointer bg-black px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60"
        @click="send"
      >
        {{ t("send") }}
      </button>
      <div class="relative">
        <button
          class="flex cursor-pointer items-center gap-1.5 border border-neutral-300 px-4 py-2 text-sm font-medium text-black hover:bg-neutral-100"
          @click="scheduleOpen = !scheduleOpen"
        >
          <ClockIcon /> {{ t("sendLater") }}
        </button>
        <div v-if="scheduleOpen" class="absolute bottom-12 left-0 z-40 w-64 rounded-lg border border-neutral-300 bg-white p-3 sm:w-72">
          <label class="block text-xs text-neutral-700">
            {{ t("sendDateTime") }}
            <input
              v-model="scheduleAt"
              type="datetime-local"
              class="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black"
            >
          </label>
          <div class="mt-2 flex flex-wrap gap-1.5">
            <button
              v-for="p in PRESETS"
              :key="p.key"
              type="button"
              class="cursor-pointer border border-neutral-300 px-2.5 py-1 text-[11px] text-black hover:bg-neutral-100"
              @click="scheduleAt = p.value()"
            >
              {{ t(p.key) }}
            </button>
          </div>
          <button
            :disabled="!scheduleAt || busy"
            class="mt-3 w-full cursor-pointer bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            @click="schedule"
          >
            {{ t("scheduleBtn") }}
          </button>
        </div>
      </div>
      <label class="cursor-pointer rounded-full p-2 text-neutral-700 hover:bg-neutral-100">
        <input type="file" multiple :aria-label="t('attach')" class="hidden" @change="addFiles(($event.target as HTMLInputElement).files)" >
        <span class="flex items-center gap-2 text-sm">
          <PaperclipIcon /> {{ t("attach") }}
        </span>
      </label>
      <span v-if="status" role="status" class="text-xs text-neutral-700">{{ status }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type Quill from "quill";
import { PRESETS, TOOLBAR, nestQuotes, quillToQuote, quoteToQuill } from "~/composables/useMailUtils";
import { CloseIcon, ClockIcon, PaperclipIcon, ExpandIcon, ShrinkIcon } from "./mail-ui";

type Attachment = { name: string; type: string; size: number; content: string; cid?: string | null; inline?: boolean };

const props = defineProps<{
  initial: { key?: string; to?: string; cc?: string; bcc?: string; subject?: string; body?: string; inReplyTo?: string; references?: string; draftUid?: number; draftMailbox?: string; attachments?: Attachment[] };
  contacts?: string[];
  displayName?: string;
  login: string;
}>();

const emit = defineEmits<{ (e: "close"): void; (e: "sent"): void; (e: "drafted"): void }>();

const { t, dateLocale } = useI18n();
const to = ref(props.initial.to ?? "");
const cc = ref(props.initial.cc ?? "");
const bcc = ref(props.initial.bcc ?? "");
const showCc = ref(Boolean(props.initial.cc || props.initial.bcc));
const subject = ref(props.initial.subject ?? "");
const files = ref<Attachment[]>(props.initial.attachments ?? []);
const status = ref<string | null>(null);
const busy = ref(false);
const editor = ref<HTMLDivElement | null>(null);
const quillRef = shallowRef<Quill | null>(null);
const quillBounds = ref<HTMLDivElement | null>(null);
const dragging = ref(false);
const scheduleOpen = ref(false);
const scheduleAt = ref("");
const optOpen = ref(false);
const fromName = ref(props.displayName);
const priority = ref<"normal" | "high" | "low">("normal");
const receipt = ref(false);
const replyTo = ref("");
const done = ref(false);
const expanded = ref(false);
const box = ref<HTMLDivElement | null>(null);
const boxW = ref<number | null>(null);
const boxH = ref<number | null>(null);

function startResize(e: MouseEvent) {
  e.preventDefault();
  const el = box.value;
  if (!el) return;
  const startX = e.clientX;
  const startY = e.clientY;
  const startW = el.offsetWidth;
  const startH = el.offsetHeight;
  const onMove = (ev: MouseEvent): void => {
    boxW.value = Math.min(Math.max(startW + (startX - ev.clientX), 360), window.innerWidth - 48);
    boxH.value = Math.min(Math.max(startH + (startY - ev.clientY), 300), window.innerHeight - 48);
  };
  const onUp = (): void => {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  };
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
}

function hasContent(): boolean {
  const html = quillRef.value ? quillRef.value.root.innerHTML : "";
  return Boolean(
    to.value.trim() || cc.value.trim() || bcc.value.trim() ||
    subject.value.trim() || files.value.length > 0 ||
    htmlToText(html),
  );
}

async function closeCompose() {
  if (done.value || !hasContent()) {
    emit("close");
    return;
  }
  busy.value = true;
  try {
    const raw = quillRef.value ? quillRef.value.root.innerHTML : "";
    const html = nestQuotes(quillToQuote(raw));
    await $fetch("/api/draft", {
      method: "POST",
      body: {
        to: to.value || undefined,
        cc: cc.value || undefined,
        bcc: bcc.value || undefined,
        subject: subject.value,
        html,
        text: htmlToText(html),
        attachments: files.value.map((f) => ({ name: f.name, type: f.type, content: f.content, cid: f.cid ?? undefined, inline: f.inline })),
        fromName: fromName.value || undefined,
        priority: priority.value,
        receipt: receipt.value,
        replyTo: replyTo.value || undefined,
        inReplyTo: props.initial.inReplyTo,
        references: props.initial.references,
      },
    }).catch((e: unknown) => {
      const d = (e as { data?: { error?: unknown; message?: string } })?.data;
      throw new Error((typeof d?.error === "string" ? d.error : d?.message) ?? t("draftError"));
    });
    if (props.initial.draftUid && props.initial.draftMailbox) {
      await $fetch("/api/mail/action", {
        method: "POST",
        body: { action: "delete", mailbox: props.initial.draftMailbox, uid: props.initial.draftUid },
      }).catch(() => null);
    }
    emit("drafted");
  } catch (e) {
    status.value = e instanceof Error ? e.message : t("draftError");
    return;
  } finally {
    busy.value = false;
  }
  emit("close");
}

onMounted(async () => {
  if (!editor.value || quillRef.value) return;
  const { default: QuillCtor } = await import("quill");
  if (!editor.value || quillRef.value) return;
  const q = new QuillCtor(editor.value, {
    theme: "snow",
    placeholder: t("yourMessage"),
    modules: { toolbar: TOOLBAR },
    bounds: quillBounds.value ?? undefined,
  });
  quillRef.value = q;
  if (props.initial.body) q.clipboard.dangerouslyPasteHTML(quoteToQuill(props.initial.body));
});

onUnmounted(() => {
  quillRef.value = null;
});

function htmlToText(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent ?? "").replace(/\u00a0/g, " ").trim();
}

async function addFiles(list: FileList | null) {
  if (!list?.length) return;
  const added: Attachment[] = [];
  let error: string | null = null;
  for (const f of [...list]) {
    if (f.size > 20 * 1024 * 1024) {
      error = `"${f.name}" ${t("exceeds20MB")}`;
      continue;
    }
    added.push({
      name: f.name,
      type: f.type,
      size: f.size,
      content: await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
        r.readAsDataURL(f);
      }),
    });
  }
  files.value = [...files.value, ...added];
  status.value = error;
}

async function schedule() {
  if (!to.value.trim() || !scheduleAt.value) {
    status.value = t("needRecipientDate");
    return;
  }
  busy.value = true;
  status.value = t("savingDraft");
  try {
    const raw = quillRef.value ? quillRef.value.root.innerHTML : "";
    const html = nestQuotes(quillToQuote(raw));
    const res = await $fetch("/api/schedule", {
      method: "POST",
      body: {
        to: to.value,
        cc: cc.value || undefined,
        bcc: bcc.value || undefined,
        subject: subject.value,
        html,
        text: htmlToText(html),
        sendAt: new Date(scheduleAt.value).toISOString(),
        attachments: files.value.map((f) => ({ name: f.name, type: f.type, content: f.content })),
        fromName: fromName.value || undefined,
        priority: priority.value,
        receipt: receipt.value,
        replyTo: replyTo.value || undefined,
        inReplyTo: props.initial.inReplyTo,
        references: props.initial.references,
      },
    }).catch((e: unknown) => {
      const d = (e as { data?: { error?: unknown; message?: string } })?.data;
      throw new Error((typeof d?.error === "string" ? d.error : d?.message) ?? t("scheduleError"));
    });
    void res;
    done.value = true;
    status.value = `${t("scheduledFor")} ${new Date(scheduleAt.value).toLocaleString(dateLocale.value)}`;
    emit("sent");
    setTimeout(() => emit("close"), 900);
  } catch (e) {
    status.value = e instanceof Error ? e.message : t("scheduleError");
  } finally {
    busy.value = false;
  }
}

async function send() {
  if (!to.value.trim()) {
    status.value = t("needRecipient");
    return;
  }
  busy.value = true;
  status.value = t("sending");
  try {
    const html = nestQuotes(quillToQuote(quillRef.value ? quillRef.value.root.innerHTML : ""));
    const text = htmlToText(html);
    await $fetch("/api/send", {
      method: "POST",
      body: {
        to: to.value,
        cc: cc.value || undefined,
        bcc: bcc.value || undefined,
        subject: subject.value,
        text,
        html,
        attachments: files.value.map((f) => ({ name: f.name, type: f.type, content: f.content, cid: f.cid ?? undefined, inline: f.inline })),
        fromName: fromName.value || undefined,
        priority: priority.value,
        receipt: receipt.value,
        replyTo: replyTo.value || undefined,
        inReplyTo: props.initial.inReplyTo,
        references: props.initial.references,
      },
    }).catch((e: unknown) => {
      const d = (e as { data?: { error?: unknown; message?: string } })?.data;
      throw new Error((typeof d?.error === "string" ? d.error : d?.message) ?? t("sendError"));
    });
    if (props.initial.draftUid && props.initial.draftMailbox) {
      await $fetch("/api/mail/action", {
        method: "POST",
        body: { action: "delete", mailbox: props.initial.draftMailbox, uid: props.initial.draftUid },
      }).catch(() => null);
    }
    status.value = t("sent");
    done.value = true;
    emit("sent");
    setTimeout(() => emit("close"), 800);
  } catch (e) {
    status.value = e instanceof Error ? e.message : t("sendError");
  } finally {
    busy.value = false;
  }
}

function onDragOver(e: DragEvent) {
  if (![...(e.dataTransfer?.types ?? [])].includes("Files")) {
    dragging.value = false;
    return;
  }
  e.preventDefault();
  dragging.value = true;
}

function onDragLeave(e: DragEvent) {
  if ((e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) return;
  dragging.value = false;
}

function onDrop(e: DragEvent) {
  dragging.value = false;
  if (!e.dataTransfer?.files?.length) return;
  void addFiles(e.dataTransfer.files);
}
</script>
