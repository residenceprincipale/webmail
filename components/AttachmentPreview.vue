<template>
  <ul class="flex flex-wrap gap-2 border-t border-neutral-300 py-3">
    <li v-for="f in files" :key="f.index" class="w-40 border border-neutral-300 bg-white text-xs">
      <button
        v-if="isImage(f) && urlFor(f.partId)"
        class="block w-full cursor-zoom-in"
        :title="f.filename"
        @click="zoom = urlFor(f.partId)"
      >
        <img :src="urlFor(f.partId)!" :alt="f.filename" loading="lazy" class="h-24 w-full object-cover" >
      </button>
      <span v-else class="flex h-24 w-full flex-col items-center justify-center gap-1 border border-neutral-300 bg-white text-neutral-700">
        <PaperclipIcon />
        <span class="px-2 text-center text-[11px] uppercase">{{ f.contentType.split("/")[1] ?? "doc" }}</span>
      </span>
      <span class="block truncate px-2 pt-1 font-medium">{{ f.filename }}</span>
      <span class="flex items-center justify-between px-2 pb-2 text-neutral-700">
        {{ formatSize(f.size, locale) }}
        <a
          v-if="urlFor(f.partId)"
          :href="urlFor(f.partId)!"
          class="cursor-pointer font-medium text-black underline hover:no-underline"
          @click.stop
        >
          {{ t("download") }}
        </a>
      </span>
    </li>
  </ul>
  <div
    v-if="zoom"
    class="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/80 p-8"
    @click="zoom = null"
  >
    <img :src="zoom" alt="" class="max-h-full max-w-full object-contain" >
  </div>
</template>

<script setup lang="ts">
import type { MailDetail } from "~/lib/types";
import { formatSize } from "~/composables/useMailUtils";
import { PaperclipIcon } from "./mail-ui";

const props = defineProps<{
  files: MailDetail["files"];
  mailboxPath?: string | null;
  uid: number;
}>();

const { t, locale } = useI18n();
const zoom = ref<string | null>(null);

function urlFor(partId: string): string | null {
  return props.mailboxPath
    ? `/api/attachment?mailbox=${encodeURIComponent(props.mailboxPath)}&uid=${props.uid}&part=${encodeURIComponent(partId)}`
    : null;
}

function isImage(f: MailDetail["files"][number]): boolean {
  return f.contentType.startsWith("image/");
}
</script>
