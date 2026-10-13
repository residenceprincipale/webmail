<template>
  <div>
    <p v-if="ordered.length > 1" class="border-b border-neutral-300 px-6 py-2 text-xs text-neutral-700">
      {{ ordered.length }} {{ t("threadCount") }}
    </p>
    <article v-for="m in ordered" :key="m.uid" class="border-b border-neutral-300">
      <button
        class="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left hover:bg-neutral-100 sm:px-6"
        :aria-expanded="open.includes(m.uid)"
        @click="toggle(m.uid)"
      >
        <Avatar :name="m.from?.name || m.from?.address || '?'" :size="32" />
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm font-bold text-black">
            {{ m.from?.name || m.from?.address || t("unknown") }}
          </span>
          <span class="block truncate text-xs text-neutral-700">
            <template v-if="fromLine(m)">{{ t("toWord") }} {{ fromLine(m) }} &middot; </template>
            {{ m.date ? new Date(m.date).toLocaleString(dateLocale) : null }}
          </span>
        </span>
        <PaperclipIcon v-if="m.attachments > 0" />
        <span class="text-xs text-neutral-700">{{ open.includes(m.uid) ? "▲" : "▼" }}</span>
      </button>
      <div v-if="open.includes(m.uid)" class="px-4 pb-5 sm:px-6">
        <ThreadBody :mail="m" />
        <AttachmentPreview
          v-if="m.files?.length > 0"
          :files="m.files"
          :mailbox-path="mailboxPath"
          :uid="m.uid"
        />
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { MailDetail } from "~/lib/types";
import { Avatar, PaperclipIcon } from "./mail-ui";

const props = defineProps<{
  thread: MailDetail[];
  mailboxPath?: string | null;
  openUid: number;
}>();

const { t, dateLocale } = useI18n();
const open = ref<number[]>([props.openUid]);
const ordered = computed(() => [...props.thread].sort((a, b) => a.uid - b.uid));

function toggle(uid: number) {
  open.value = open.value.includes(uid) ? open.value.filter((u) => u !== uid) : [...open.value, uid];
}

function fromLine(m: MailDetail): string {
  return m.from ? `${m.from.name ? m.from.name + " " : ""}<${m.from.address}>` : "";
}
</script>
