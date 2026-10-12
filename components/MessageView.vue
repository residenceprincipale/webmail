<template>
  <div class="flex h-full flex-col">
    <div class="flex h-14 shrink-0 items-center gap-1 border-b border-neutral-300 px-4">
      <IconBtn :label="t('close')" :on-click="() => $emit('close')"><CloseIcon /></IconBtn>
      <IconBtn :label="t('archive')" :on-click="() => $emit('archive')"><ArchiveIcon /></IconBtn>
      <IconBtn :label="t('spam')" :on-click="() => $emit('spam')"><SpamIcon /></IconBtn>
      <IconBtn :label="t('delete')" :on-click="() => $emit('delete')"><TrashIcon /></IconBtn>
      <div v-if="mailboxes" class="relative">
        <IconBtn :label="t('moveTo')" :on-click="() => (moveOpen = !moveOpen)"><FolderIcon /></IconBtn>
        <div v-if="moveOpen" class="absolute left-0 top-11 z-30 w-56 rounded-lg border border-neutral-300 bg-white py-2">
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
      <IconBtn :label="mail.seen ? t('markUnread') : t('markRead')" :on-click="() => $emit('seen')">
        <MailOpenIcon :seen="mail.seen" />
      </IconBtn>
      <div class="ml-auto flex items-center gap-1">
        <div v-if="view" class="mr-2 hidden items-center rounded-full border border-neutral-300 bg-white p-0.5 sm:flex">
          <button
            v-for="[mode, label] in ([['over', t('viewOver')], ['full', t('viewFull')]] as const)"
            :key="mode"
            :class="`cursor-pointer rounded-full px-3 py-1 text-xs ${view === mode ? 'bg-white font-medium text-black' : 'text-neutral-700'}`"
            @click="$emit('view', mode)"
          >
            {{ label }}
          </button>
        </div>
        <IconBtn :label="t('follow')" :on-click="() => $emit('star')">
          <StarFilledIcon v-if="starred" />
          <StarIcon v-else />
        </IconBtn>
        <IconBtn :label="t('reply')" :on-click="() => $emit('reply')"><ReplyIcon /></IconBtn>
      </div>
    </div>
    <div class="min-h-0 flex-1 overflow-y-auto">
      <ThreadList :key="mail.uid" :thread="thread?.length ? thread : [mail]" :mailbox-path="mailboxPath" :open-uid="mail.uid" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Mailbox, MailDetail } from "~/lib/types";
import {
  IconBtn, CloseIcon, ArchiveIcon, SpamIcon, TrashIcon, FolderIcon,
  MailOpenIcon, StarIcon, StarFilledIcon, ReplyIcon,
} from "./mail-ui";

const props = defineProps<{
  mail: MailDetail;
  view?: "over" | "full" | "floating";
  mailboxes?: Mailbox[];
  currentMailbox?: string | null;
  mailboxPath?: string | null;
  thread?: MailDetail[];
}>();

defineEmits<{
  (e: "reply"): void;
  (e: "close"): void;
  (e: "star"): void;
  (e: "archive"): void;
  (e: "spam"): void;
  (e: "delete"): void;
  (e: "seen"): void;
  (e: "move", target: string): void;
  (e: "view", v: "over" | "full" | "floating"): void;
}>();

const { t } = useI18n();
const moveOpen = ref(false);
const starred = computed(() => props.mail.flags.includes("\\Flagged"));
</script>
