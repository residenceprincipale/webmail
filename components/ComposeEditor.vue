<template>
  <div class="fixed bottom-0 right-6 z-30 flex max-h-[85vh] w-[600px] flex-col rounded-t-lg border border-neutral-300 bg-white">
    <div class="flex items-center justify-between rounded-t-lg bg-black px-4 py-2 text-sm text-white">
      <span>{{ t("newMessage") }}</span>
      <div class="flex items-center gap-1">
        <button class="cursor-pointer px-2 text-xs text-white hover:text-white" :aria-expanded="showCc" @click="showCc = !showCc">
          {{ showCc ? t("hide") : t("ccBcc") }}
        </button>
        <button :aria-expanded="optOpen" :class="`cursor-pointer px-2 text-xs ${optOpen ? 'text-white underline' : 'text-white'} hover:text-white`" @click="optOpen = !optOpen">
          {{ optOpen ? t("hide") : t("show") }}
        </button>
        <button :aria-label="t('close')" class="cursor-pointer" @click="$emit('close')">
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
      <div ref="quillBounds" class="relative">
        <div class="[&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-neutral-300 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[240px] [&_.ql-editor]:text-sm">
          <div ref="editor" />
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
    <div class="flex items-center gap-3 border-t border-neutral-300 px-4 py-3">
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
        <div v-if="scheduleOpen" class="absolute bottom-12 left-0 z-40 w-72 rounded-lg border border-neutral-300 bg-white p-3">
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
import { plainToHtml, PRESETS, TOOLBAR } from "~/composables/useMailUtils";
import { CloseIcon, ClockIcon, PaperclipIcon } from "./mail-ui";

type Attachment = { name: string; type: string; size: number; content: string };

const props = defineProps<{
  initial: { key?: string; to?: string; subject?: string; body?: string; inReplyTo?: string; references?: string };
  contacts?: string[];
  displayName?: string;
  login: string;
}>();

const emit = defineEmits<{ (e: "close"): void; (e: "sent"): void }>();

const { t, dateLocale } = useI18n();
const to = ref(props.initial.to ?? "");
const cc = ref("");
const bcc = ref("");
const showCc = ref(false);
const subject = ref(props.initial.subject ?? "");
const files = ref<Attachment[]>([]);
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
  if (props.initial.body) q.clipboard.dangerouslyPasteHTML(plainToHtml(props.initial.body));
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
    const html = quillRef.value ? quillRef.value.root.innerHTML : "";
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
    const html = quillRef.value ? quillRef.value.root.innerHTML : "";
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
      throw new Error((typeof d?.error === "string" ? d.error : d?.message) ?? t("sendError"));
    });
    status.value = t("sent");
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
