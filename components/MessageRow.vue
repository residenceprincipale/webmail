<template>
  <li
    draggable="true"
    :class="`group relative flex cursor-pointer items-center gap-2 border-l-2 px-3 py-2 sm:gap-3 sm:px-4 ${active ? 'border-l-black bg-neutral-100' : 'border-l-transparent'} ${!mail.seen ? 'bg-white font-bold' : 'bg-white'}`"
    @click="$emit('open')"
    @dragstart="$emit('dragstart')"
  >
    <input
      type="checkbox"
      :checked="checked"
      :aria-label="t('selectMsg')"
      class="wm-check hidden cursor-pointer sm:inline-grid"
      @click.stop
      @change="$emit('check')"
    >
    <button
      class="hidden shrink-0 cursor-pointer text-black sm:block"
      :aria-label="t('follow')"
      @click.stop="$emit('star')"
    >
      <StarFilledIcon v-if="starred" />
      <StarIcon v-else />
    </button>
    <span class="hidden sm:block"><Avatar :name="from" /></span>
    <span class="min-w-0 flex-1 sm:flex-none">
      <span :class="`block truncate text-[13px] sm:w-52 sm:shrink-0 ${!mail.seen ? 'font-bold' : ''}`">
        {{ from }}
      </span>
      <span class="block truncate text-[13px] sm:hidden">
        <span>{{ mail.subject }}</span>
        <span class="ml-2 text-neutral-700"> - {{ mail.preview || "..." }}</span>
      </span>
    </span>
    <span
      v-if="(count ?? 1) > 1"
      class="shrink-0 border border-neutral-300 bg-white px-1.5 py-0.5 text-[11px] font-medium text-black"
      :title="count + ' ' + t('threadCount')"
    >
      {{ count }}
    </span>
    <div class="hidden min-w-0 flex-1 sm:block">
      <span class="truncate">
        <span>{{ mail.subject }}</span>
        <span class="ml-2 text-neutral-700"> - {{ mail.preview || "..." }}</span>
      </span>
    </div>
    <PaperclipIcon v-if="mail.attachments > 0" />
    <span class="w-16 shrink-0 text-right text-xs text-neutral-700">{{ when }}</span>
    <div
      class="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded-full border border-neutral-300 bg-white px-1 group-hover:flex"
      @click.stop
    >
      <IconBtn v-if="inTrash" :label="t('restore')" :on-click="() => $emit('restore')"><RestoreIcon /></IconBtn>
      <div v-else-if="mailboxes" class="relative">
        <IconBtn :label="t('moveTo')" :on-click="() => (moveOpen = !moveOpen)"><FolderIcon /></IconBtn>
        <div v-if="moveOpen" class="absolute right-0 top-9 z-30 w-56 rounded-lg border border-neutral-300 bg-white py-2 text-left font-normal">
          <button
            v-for="mb in mailboxes.filter((m) => m.path !== currentMailbox)"
            :key="mb.path"
            class="block w-full cursor-pointer px-4 py-2 text-left text-sm hover:bg-neutral-100"
            @click="moveOpen = false; $emit('move', mb.path)"
          >
            {{ mb.name }}
          </button>
        </div>
      </div>
      <IconBtn :label="t('delete')" :on-click="() => $emit('delete')"><TrashIcon /></IconBtn>
      <IconBtn :label="mail.seen ? t('markUnread') : t('markRead')" :on-click="() => $emit('seen')">
        <MailOpenIcon :seen="mail.seen" />
      </IconBtn>
    </div>
  </li>
</template>

<script setup lang="ts">
import type { Mailbox, MailSummary } from "~/lib/types";
import { shortDate } from "~/composables/useMailUtils";
import { Avatar, IconBtn, FolderIcon, RestoreIcon, TrashIcon, StarIcon, StarFilledIcon, PaperclipIcon, MailOpenIcon } from "./mail-ui";

const props = defineProps<{
  mail: MailSummary;
  count?: number;
  active: boolean;
  checked: boolean;
  inTrash?: boolean;
  mailboxes?: Mailbox[];
  currentMailbox?: string | null;
}>();

defineEmits<{
  (e: "open"): void;
  (e: "check"): void;
  (e: "star"): void;
  (e: "restore"): void;
  (e: "delete"): void;
  (e: "seen"): void;
  (e: "move", target: string): void;
  (e: "dragstart"): void;
}>();

const { t, locale } = useI18n();
const moveOpen = ref(false);
const starred = computed(() => props.mail.flags.includes("\\Flagged"));
const from = computed(() => props.mail.from?.name || props.mail.from?.address || t("unknown"));
const when = computed(() => (props.mail.date ? shortDate(props.mail.date, locale.value) : ""));
</script>
