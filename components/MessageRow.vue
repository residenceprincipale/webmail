<template>
  <li
    :class="`group relative flex cursor-pointer items-center gap-3 border-l-2 px-4 py-2 ${active ? 'border-l-black bg-neutral-100' : 'border-l-transparent'} ${!mail.seen ? 'bg-white font-bold' : 'bg-white'}`"
    @click="$emit('open')"
  >
    <input
      type="checkbox"
      :checked="checked"
      :aria-label="t('selectMsg')"
      class="wm-check cursor-pointer"
      @click.stop
      @change="$emit('check')"
    >
    <button
      class="shrink-0 cursor-pointer text-black"
      :aria-label="t('follow')"
      @click.stop="$emit('star')"
    >
      <StarFilledIcon v-if="starred" />
      <StarIcon v-else />
    </button>
    <Avatar :name="from" />
    <span :class="`w-52 shrink-0 truncate text-[13px] ${!mail.seen ? 'font-bold' : ''}`">
      {{ from }}
    </span>
    <span
      v-if="(count ?? 1) > 1"
      class="shrink-0 border border-neutral-300 bg-white px-1.5 py-0.5 text-[11px] font-medium text-black"
      :title="count + ' ' + t('threadCount')"
    >
      {{ count }}
    </span>
    <div class="min-w-0 flex-1">
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
      <IconBtn :label="t('archive')" :on-click="() => $emit('archive')"><ArchiveIcon /></IconBtn>
      <IconBtn :label="t('delete')" :on-click="() => $emit('delete')"><TrashIcon /></IconBtn>
      <IconBtn :label="mail.seen ? t('markUnread') : t('markRead')" :on-click="() => $emit('seen')">
        <MailOpenIcon :seen="mail.seen" />
      </IconBtn>
    </div>
  </li>
</template>

<script setup lang="ts">
import type { MailSummary } from "~/lib/types";
import { shortDate } from "~/composables/useMailUtils";
import { Avatar, IconBtn, ArchiveIcon, TrashIcon, StarIcon, StarFilledIcon, PaperclipIcon, MailOpenIcon } from "./mail-ui";

const props = defineProps<{
  mail: MailSummary;
  count?: number;
  active: boolean;
  checked: boolean;
}>();

defineEmits<{
  (e: "open"): void;
  (e: "check"): void;
  (e: "star"): void;
  (e: "archive"): void;
  (e: "delete"): void;
  (e: "seen"): void;
}>();

const { t, locale } = useI18n();
const starred = computed(() => props.mail.flags.includes("\\Flagged"));
const from = computed(() => props.mail.from?.name || props.mail.from?.address || t("unknown"));
const when = computed(() => (props.mail.date ? shortDate(props.mail.date, locale.value) : ""));
</script>
