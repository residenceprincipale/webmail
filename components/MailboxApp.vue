<template>
  <div class="flex h-dvh flex-col bg-white text-[13px] text-black">
    <header class="flex h-14 shrink-0 items-center gap-2 border-b border-neutral-300 px-3 sm:h-16 sm:gap-4 sm:px-4">
      <div class="flex items-center gap-2">
        <button
          :aria-label="t('toggleMenu')"
          class="cursor-pointer rounded-full p-2 hover:bg-neutral-100"
          @click="navOpen = navOpen === 'open' ? 'icons' : 'open'"
        >
          <MenuIcon />
        </button>
      </div>
      <div class="relative mx-0 min-w-0 flex-1 sm:mx-2">
        <div class="flex h-10 items-center rounded-full border border-neutral-300 bg-white px-3 sm:px-4">
          <SearchIcon />
          <input
            v-model="query"
            :placeholder="t('search')"
            :aria-label="t('search')"
            class="ml-2 h-full min-w-0 flex-1 bg-transparent text-sm outline-none focus-visible:ring-2 focus-visible:ring-black"
            @input="query.trim() || (results = null)"
            @keydown.enter="runSearch(query)"
          >
          <button
            :aria-label="t('filtersBtn')"
            class="ml-2 cursor-pointer rounded-full p-1.5 text-neutral-700 hover:bg-neutral-100"
            @click="showFilters = !showFilters"
          >
            <FilterIcon />
          </button>
        </div>
        <div v-if="showFilters" class="absolute left-0 top-12 z-30 w-[calc(100vw-2.5rem)] max-w-[420px] rounded-lg border border-neutral-300 bg-white p-4 sm:w-[420px]">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label class="text-xs text-neutral-700">
              {{ t("fromL") }}
              <input
                v-model="filters.from"
                :placeholder="t('fromPh')"
                class="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm text-black outline-none focus:border-black"
              >
            </label>
            <label class="text-xs text-neutral-700">
              {{ t("toL") }}
              <input
                v-model="filters.to"
                :placeholder="t('toPh')"
                class="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm text-black outline-none focus:border-black"
              >
            </label>
            <label class="sm:col-span-2 text-xs text-neutral-700">
              {{ t("subject") }}
              <input
                v-model="filters.subject"
                :placeholder="t('subjectPh')"
                class="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm text-black outline-none focus:border-black"
              >
            </label>
            <label class="sm:col-span-2 text-xs text-neutral-700">
              {{ t("containsL") }}
              <input
                v-model="filters.text"
                :placeholder="t('keywordsPh')"
                class="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm text-black outline-none focus:border-black"
              >
            </label>
            <label class="sm:col-span-2 flex cursor-pointer items-center gap-2 text-xs text-neutral-700">
              <input v-model="filters.flagged" type="checkbox" class="wm-check cursor-pointer" >
              {{ t("flaggedOnly") }}
            </label>
          </div>
          <div class="mt-3 flex justify-end gap-2">
            <button
              class="cursor-pointer rounded px-4 py-2 text-sm text-black hover:bg-neutral-100"
              @click="showFilters = false"
            >
              {{ t("cancel") }}
            </button>
            <button
              class="cursor-pointer rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
              @click="applyFilters"
            >
              {{ t("search") }}
            </button>
          </div>
        </div>
      </div>
      <div class="flex shrink-0 items-center gap-1 text-xs font-medium text-neutral-700">
        <button :aria-pressed="locale === 'fr'" title="Français" :class="localeBtn('fr')" @click="locale = 'fr'">FR</button>
        <button :aria-pressed="locale === 'en'" title="English" :class="localeBtn('en')" @click="locale = 'en'">EN</button>
        <button
          :aria-label="dark ? t('enableLight') : t('enableDark')"
          :title="dark ? t('enableLight') : t('enableDark')"
          class="cursor-pointer px-2 py-1 hover:bg-neutral-100"
          @click="dark = !dark"
        >{{ dark ? "☀" : "☾" }}</button>
      </div>
      <div class="relative shrink-0">
        <button
          :aria-label="t('accountMenu')"
          class="h-9 w-9 cursor-pointer overflow-hidden rounded-full bg-black text-sm font-medium text-white"
          @click="menuOpen = !menuOpen"
        >
          <img v-if="photo" :src="photo" alt="" class="h-full w-full object-cover" >
          <template v-else>{{ (displayName || login).slice(0, 1).toUpperCase() }}</template>
        </button>
        <div v-if="menuOpen" class="fixed inset-0 z-40 cursor-default" @click="menuOpen = false" />
        <div v-if="menuOpen" class="absolute right-0 top-11 z-50 w-64 rounded-lg border border-neutral-300 bg-white py-2 shadow-lg">
          <p class="px-4 py-2 text-xs text-neutral-700">{{ t("connected") }}</p>
          <p v-if="displayName" class="px-4 text-sm font-medium">{{ displayName }}</p>
          <p class="px-4 pb-2 text-sm break-all text-neutral-700">{{ login }}</p>
          <button
            class="block w-full cursor-pointer px-4 py-2 text-left text-sm hover:bg-neutral-100"
            @click="profileOpen = true; menuOpen = false"
          >
            {{ t("nameAndPhoto") }}
          </button>
          <button
            class="block w-full cursor-pointer px-4 py-2 text-left text-sm hover:bg-neutral-100"
            @click="pwdOpen = true; menuOpen = false"
          >
            {{ t("changePassword") }}
          </button>
          <a
            href="https://github.com/residenceprincipale/webmail/issues"
            target="_blank"
            rel="noopener"
            class="block w-full cursor-pointer px-4 py-2 text-left text-sm hover:bg-neutral-100"
          >
            {{ t("needHelp") }}
          </a>
          <button
            class="block w-full cursor-pointer px-4 py-2 text-left text-sm hover:bg-neutral-100"
            @click="logout"
          >
            {{ t("logout") }}
          </button>
        </div>
      </div>
    </header>

    <div class="relative flex min-h-0 flex-1">
      <div
        v-if="!navCollapsed"
        class="fixed inset-0 z-10 bg-black/40 sm:hidden"
        @click="navOpen = 'icons'"
      />
      <aside
        :class="`shrink-0 overflow-y-auto overflow-x-hidden bg-white py-3 pr-3 ${navCollapsed ? 'hidden sm:block' : 'fixed inset-y-0 left-0 z-20 sm:static'}`"
        :style="{ width: navCollapsed ? '68px' : navWidth + 'px' }"
      >
        <button
          :title="t('newMessage')"
          :aria-label="t('newMessage')"
          :class="`mb-4 ml-3 flex h-10 w-[52px] cursor-pointer items-center justify-center bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 ${navCollapsed ? '' : 'w-[calc(100%-12px)] gap-3 px-4 py-2 text-sm font-medium'}`"
          @click="compose = compose ?? {}"
        >
          <PencilIcon />
          <template v-if="!navCollapsed">{{ t("newMessage") }}</template>
        </button>
        <nav class="space-y-0.5">
          <div
            v-for="mb in mailboxes"
            :key="mb.path"
            :class="`group relative ${dropTarget === mb.path ? 'outline outline-2 outline-black' : ''}`"
            @dragover.prevent="dropTarget = mb.path"
            @dragleave="dropTarget = null"
            @drop.prevent="dropOn(mb.path)"
          >
          <button
            :title="mb.name"
            :class="`relative flex h-9 w-full cursor-pointer items-center gap-4 text-left text-[13px] ${mb.path === selected ? 'bg-black font-medium text-white' : 'hover:bg-neutral-100'} ${navCollapsed ? 'justify-center pl-0 pr-0' : 'pl-6 pr-3'}`"
            @click="selectMailbox(mb.path)"
          >
            <BoxIcon :kind="mb.specialUse ?? ''" />
            <Badge v-if="navCollapsed && badgeCount(mb) > 0" :count="badgeCount(mb)" floating />
            <template v-else-if="!navCollapsed">
              <span class="flex-1 truncate">{{ mb.name }}</span>
              <Badge v-if="badgeCount(mb) > 0" :count="badgeCount(mb)" />
            </template>
          </button>
          <div
            v-if="!navCollapsed && isCustomBox(mb)"
            class="absolute right-1 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-neutral-300 bg-white px-0.5 group-hover:flex"
            @click.stop
          >
            <button
              :title="t('renameFolder')"
              :aria-label="t('renameFolder')"
              class="cursor-pointer p-1 text-black hover:bg-neutral-100"
              @click="folderDialog = { mode: 'rename', path: mb.path, name: mb.name }; folderError = null"
            ><PencilIcon /></button>
            <button
              :title="t('deleteFolder')"
              :aria-label="t('deleteFolder')"
              class="cursor-pointer p-1 text-black hover:bg-neutral-100"
              @click="folderDialog = { mode: 'delete', path: mb.path, name: mb.name }; folderError = null"
            ><TrashIcon /></button>
          </div>
          </div>
        </nav>
        <button
          v-if="!navCollapsed"
          :title="t('newFolder')"
          class="mt-2 flex h-9 w-full cursor-pointer items-center gap-4 pl-6 pr-3 text-left text-[13px] text-neutral-700 hover:bg-neutral-100"
          @click="folderDialog = { mode: 'create', name: '' }; folderError = null"
        >
          <PlusIcon />
          <span class="truncate">{{ t("newFolder") }}</span>
        </button>
      </aside>
      <div
        v-if="!navCollapsed"
        role="separator"
        aria-orientation="vertical"
        :aria-label="t('resizePanel')"
        :title="t('dragResize')"
        class="hidden w-1 shrink-0 cursor-col-resize bg-transparent transition-colors hover:bg-black active:bg-black sm:block"
        @pointerdown="startResize"
      />

      <main class="flex min-w-0 flex-1 flex-col sm:border-l sm:border-neutral-300">
        <div class="relative flex h-12 shrink-0 items-center gap-1 overflow-x-auto border-b border-neutral-300 px-2 sm:px-4">
          <CheckboxAll
            :count="threads.reduce((n, th) => n + th.all.length, 0)"
            :checked-count="checked.size"
            :label="t('selectAll')"
            :on-toggle="toggleAll"
          />
          <IconBtn :label="t('reload')" :on-click="reload">
            <span :class="loading ? 'animate-spin' : 'flex'">
              <ReloadIcon />
            </span>
          </IconBtn>
          <template v-if="checked.size > 0">
            <IconBtn v-if="isTrash" :label="t('restore')" :on-click="() => act('move', 'INBOX')"><RestoreIcon /></IconBtn>
            <IconBtn v-if="!isTrash" :label="t('spam')" :on-click="() => act('move', 'Junk')"><SpamIcon /></IconBtn>
            <IconBtn :label="t('delete')" :on-click="() => act('delete')"><TrashIcon /></IconBtn>
            <IconBtn :label="t('moveTo')" :on-click="() => (moveOpen = !moveOpen)"><FolderIcon /></IconBtn>
          </template>
          <div v-if="checked.size > 0 && moveOpen" class="absolute left-28 top-11 z-30 w-56 rounded-lg border border-neutral-300 bg-white py-2">
            <button
              v-for="mb in mailboxes.filter((m) => m.path !== selected)"
              :key="mb.path"
              class="block w-full cursor-pointer px-4 py-2 text-left text-sm hover:bg-neutral-100"
              @click="moveOpen = false; act('move', mb.path)"
            >
              {{ mb.name }}
            </button>
          </div>
          <div class="ml-auto flex shrink-0 items-center gap-1 text-xs text-neutral-700">
            <span class="hidden sm:inline">
              {{ total === 0 ? "0" : page * PAGE_SIZE + 1 }}-{{ Math.min(total, (page + 1) * PAGE_SIZE) }}
              {{ t("of") }} {{ total }}
            </span>
            <button
              :disabled="page === 0"
              class="cursor-pointer px-2 py-1 disabled:cursor-default disabled:opacity-30"
              @click="page--"
            >
              &lt;
            </button>
            <button
              :disabled="page >= totalPages - 1"
              class="cursor-pointer px-2 py-1 disabled:cursor-default disabled:opacity-30"
              @click="page++"
            >
              &gt;
            </button>
          </div>
        </div>

        <p v-if="error" class="border-y border-neutral-300 bg-white px-4 py-2 text-xs text-black">{{ error }}</p>

        <div class="min-h-0 flex-1 overflow-y-auto">
          <p v-if="loading" class="p-6 text-sm text-neutral-700">{{ t("loading") }}</p>
          <div v-else-if="threads.length === 0" class="flex h-full flex-col items-center justify-center gap-2 text-neutral-700">
            <InboxIcon />
            <p class="text-sm">{{ t("noMail") }}</p>
          </div>
          <ul v-else class="divide-y divide-neutral-300">
            <MessageRow
              v-for="th in threads"
              :key="th.head.threadId + ':' + th.head.uid"
              :mail="th.head"
              :count="th.count"
              :active="th.head.uid === openUid || openThread.some((d) => d.uid === th.head.uid)"
              :checked="th.all.map((x) => x.uid).every((u) => checked.has(u))"
              :in-trash="isTrash"
              :mailboxes="mailboxes"
              :current-mailbox="selected"
              @check="toggleThread(th)"
              @open="open(th.head)"
              @star="onStar(th.head)"
              @move="(target) => act('move', target, th.all.map((x) => x.uid))"
              @dragstart="dragUids = th.all.map((x) => x.uid)"
              @delete="act('delete', undefined, th.all.map((x) => x.uid))"
              @restore="act('move', 'INBOX', th.all.map((x) => x.uid))"
              @seen="toggleSeen(th.head)"
            />
          </ul>
        </div>
      </main>

      <div
        v-if="openMail && view === 'over'"
        class="absolute inset-0 z-20 flex min-w-0 flex-col bg-white sm:inset-y-0 sm:right-0 sm:left-auto"
        :style="isMobile ? undefined : { left: (navCollapsed ? 68 : navWidth + 4) + 'px' }"
      >
        <MessageView
          :mail="openMail"
          :view="view"
          :mailboxes="mailboxes"
          :current-mailbox="selected"
          :mailbox-path="selected"
          :thread="openThread"
          :in-trash="isTrash"
          @reply="makeReply(openMail!)"
          @star="onStar(openMail!)"
          @spam="act('move', 'Junk', [openMail!.uid])"
          @delete="act('delete', undefined, openThread.length ? openThread.map((d) => d.uid) : [openMail!.uid])"
          @restore="act('move', 'INBOX', openThread.length ? openThread.map((d) => d.uid) : [openMail!.uid])"
          @seen="toggleSeen(openMail!)"
          @move="(target) => act('move', target, [openMail!.uid])"
          @view="(v) => (view = v)"
          @close="closeMail"
        />
      </div>

      <div v-if="openMail && view === 'full'" class="flex min-w-0 flex-1 flex-col border-l border-neutral-300 bg-white">
        <MessageView
          :mail="openMail"
          :view="view"
          :mailboxes="mailboxes"
          :current-mailbox="selected"
          :mailbox-path="selected"
          :thread="openThread"
          :in-trash="isTrash"
          @reply="makeReply(openMail!)"
          @star="onStar(openMail!)"
          @spam="act('move', 'Junk', [openMail!.uid])"
          @delete="act('delete', undefined, openThread.length ? openThread.map((d) => d.uid) : [openMail!.uid])"
          @restore="act('move', 'INBOX', openThread.length ? openThread.map((d) => d.uid) : [openMail!.uid])"
          @seen="toggleSeen(openMail!)"
          @move="(target) => act('move', target, [openMail!.uid])"
          @view="(v) => (view = v)"
          @close="closeMail"
        />
      </div>
    </div>

    <ComposeEditor
      v-if="compose"
      :key="compose.key ?? 'new'"
      :initial="compose"
      :contacts="contacts"
      :display-name="displayName"
      :login="login"
      @close="compose = null"
      @sent="onSent"
      @drafted="onDrafted"
    />
    <div v-if="toast" role="status" class="fixed bottom-4 left-4 right-4 z-40 flex items-center gap-3 rounded bg-black px-4 py-3 text-sm text-white sm:bottom-6 sm:left-6 sm:right-auto">
      <span>{{ toast }}</span>
      <button class="text-white" :aria-label="t('closeNotif')" @click="toast = null">
        OK
      </button>
    </div>
    <div v-if="folderDialog" class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
      <div class="max-h-[85dvh] w-full max-w-[440px] overflow-y-auto rounded-2xl bg-white p-5 sm:p-6">
        <h2 class="mb-4 text-lg font-medium">{{
          folderDialog.mode === "create" ? t("newFolder")
          : folderDialog.mode === "rename" ? t("renameFolder")
          : t("deleteFolder")
        }}</h2>
        <form class="flex flex-col gap-3" @submit.prevent="submitFolder">
          <p v-if="folderDialog.mode === 'delete'" class="text-sm">
            {{ t("confirmDeleteFolder") }} — {{ folderDialog.name }}
          </p>
          <label v-else class="text-xs text-neutral-700">
            {{ t("folderName") }}
            <input
              v-model="folderDialog.name"
              required
              maxlength="64"
              class="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm text-black outline-none focus:border-black"
            >
          </label>
          <p v-if="folderError" role="alert" class="rounded border border-neutral-300 bg-white px-3 py-2 text-xs text-black">{{ folderError }}</p>
          <div class="flex justify-end gap-2">
            <button type="button" class="px-3 py-2 text-sm text-black" @click="folderDialog = null">
              {{ t("cancel") }}
            </button>
            <button
              type="submit"
              :disabled="folderBusy"
              class="cursor-pointer bg-black px-5 py-2 text-sm font-medium text-white"
            >
              {{ folderDialog.mode === "create" ? t("createFolder") : folderDialog.mode === "rename" ? t("save") : t("delete") }}
            </button>
          </div>
        </form>
      </div>
    </div>
    <PasswordDialog v-if="pwdOpen" @close="pwdOpen = false" />
    <ProfileDialog
      v-if="profileOpen"
      :login="login"
      :display-name="displayName"
      :photo="photo"
      @save="onProfileSave"
      @close="profileOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import type { Mailbox, MailSummary, MailDetail } from "~/lib/types";
import { PAGE_SIZE, stripHtml, escapeHtml, plainToHtml, nestQuotes } from "~/composables/useMailUtils";
import {
  MenuIcon, SearchIcon, FilterIcon, PencilIcon, PlusIcon, BoxIcon, Badge,
  CheckboxAll, IconBtn, ReloadIcon, SpamIcon, TrashIcon, RestoreIcon,
  FolderIcon, InboxIcon,
} from "./mail-ui";

const props = defineProps<{
  login: string;
  host: string;
  displayName?: string;
  photo?: string | null;
}>();

const { t, locale, dark, dateLocale } = useI18n();

function localeBtn(l: string) {
  return `cursor-pointer px-2 py-1 ${locale.value === l ? "bg-black text-white" : "hover:bg-neutral-100"}`;
}

const mailboxes = ref<Mailbox[]>([]);
const selected = ref<string | null>(null);
const messages = ref<MailSummary[]>([]);
const total = ref(0);
const page = ref(0);
const openUid = ref<number | null>(null);
const openMail = ref<MailDetail | null>(null);
const openThread = ref<MailDetail[]>([]);
const query = ref("");
const checked = ref<Set<number>>(new Set());
const loading = ref(true);
const compose = ref<{
  key?: string;
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  body?: string;
  inReplyTo?: string;
  references?: string;
  draftUid?: number;
  draftMailbox?: string;
  attachments?: { name: string; type: string; size: number; content: string; cid?: string | null; inline?: boolean }[];
} | null>(null);
const menuOpen = ref(false);
const pwdOpen = ref(false);
const profileOpen = ref(false);
const folderDialog = ref<{ mode: "create" | "rename" | "delete"; path?: string; name: string } | null>(null);
const folderError = ref<string | null>(null);
const folderBusy = ref(false);
const toast = ref<string | null>(null);
const displayName = ref(props.displayName ?? "");
const photo = ref<string | null>(props.photo ?? null);
const error = ref<string | null>(null);
const results = ref<MailSummary[] | null>(null);
const searching = ref(false);
const view = ref<"over" | "full" | "floating">("over");
const navOpen = ref<"open" | "icons">("open");
const navCollapsed = computed(() => navOpen.value === "icons");
const navWidth = ref(256);
const isMobile = ref(false);

onMounted(() => {
  const mq = window.matchMedia("(max-width: 639px)");
  const sync = () => {
    isMobile.value = mq.matches;
    if (mq.matches) navOpen.value = "icons";
  };
  sync();
  mq.addEventListener("change", sync);
  onUnmounted(() => mq.removeEventListener("change", sync));
});
const showFilters = ref(false);
const filters = ref({ from: "", to: "", subject: "", text: "", flagged: false });
const moveOpen = ref(false);
const dragUids = ref<number[]>([]);
const dropTarget = ref<string | null>(null);

async function dropOn(path: string) {
  dropTarget.value = null;
  const uids = [...dragUids.value];
  dragUids.value = [];
  if (!uids.length || path === selected.value) return;
  await act("move", path, uids);
}
void searching.value;

onMounted(async () => {
  try {
    const d = await $fetch<{ mailboxes?: Mailbox[] }>("/api/mailboxes");
    mailboxes.value = d.mailboxes ?? [];
    const inbox = (d.mailboxes ?? []).find((m) => m.specialUse === "\\Inbox");
    selected.value = inbox?.path ?? d.mailboxes?.[0]?.path ?? "INBOX";
  } catch {
    error.value = t("mailboxesFail");
  }
});

async function loadList(mailbox: string, p: number) {
  loading.value = true;
  try {
    const data = await $fetch<{ messages?: MailSummary[]; total?: number }>(
      `/api/mail?mailbox=${encodeURIComponent(mailbox)}&page=${p}`,
    );
    messages.value = data.messages ?? [];
    total.value = data.total ?? 0;
    checked.value = new Set();
    openUid.value = null;
    openMail.value = null;
    openThread.value = [];
  } catch (e) {
    error.value = e instanceof Error ? e.message : t("genericError");
  } finally {
    loading.value = false;
  }
}

watch([selected, page], ([mb]) => {
  if (mb) void loadList(mb, page.value);
});

function bumpUnseen(path: string, delta: number) {
  mailboxes.value = mailboxes.value.map((mb) =>
    mb.path === path ? { ...mb, unseen: Math.max(0, mb.unseen + delta) } : mb,
  );
}
async function refreshMailboxes() {
  try {
    const d = await $fetch<{ mailboxes?: Mailbox[] }>("/api/mailboxes");
    mailboxes.value = d.mailboxes ?? [];
  } catch {
    /* offline: keep local counts */
  }
}
const inboxUnread = computed(() => {
  const inbox = mailboxes.value.find((m) => m.specialUse === "\\Inbox" || m.path === "INBOX");
  if (inbox) return inbox.unseen;
  return messages.value.filter((m) => !m.seen).length;
});
useHead({ title: () => (inboxUnread.value > 0 ? `(${inboxUnread.value}) Webmail` : "Webmail") });

let pollTimer: ReturnType<typeof setInterval> | null = null;
function startPoll() {
  stopPoll();
  pollTimer = setInterval(checkNew, 30000);
  document.addEventListener("visibilitychange", checkNew);
  window.addEventListener("focus", checkNew);
}
function stopPoll() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
  document.removeEventListener("visibilitychange", checkNew);
  window.removeEventListener("focus", checkNew);
}
async function checkNew() {
  if (!selected.value || document.hidden || compose.value) return;
  try {
    const data = await $fetch<{ total?: number }>(
      `/api/mail?mailbox=${encodeURIComponent(selected.value)}&page=0`,
    );
    if ((data.total ?? 0) > total.value) {
      toast.value = t("newMailArrived");
      await refreshMailboxes();
      void loadList(selected.value, page.value);
    }
  } catch {
    /* offline: retry next round */
  }
}
watch([selected, page, compose], () => {
  if (selected.value) startPoll();
});
onMounted(startPoll);
onUnmounted(stopPoll);

function isDraftBox(mb: Mailbox): boolean {
  if ((mb.specialUse ?? "").toLowerCase().includes("draft")) return true;
  return (mb.path ?? "").split(".").pop()?.toLowerCase() === "drafts";
}

function badgeCount(mb: Mailbox): number {
  return isDraftBox(mb) ? mb.total : mb.unseen;
}

const isTrash = computed(() => {
  const mb = mailboxes.value.find((m) => m.path === selected.value);
  const path = mb?.path ?? selected.value ?? "";
  return mb?.specialUse === "\\Trash" || path.split(".").pop()?.toLowerCase() === "trash";
});

function addrStr(list: Array<{ name?: string; address: string }>): string {
  return list.map((a) => (a.name && a.name !== a.address ? `${a.name} <${a.address}>` : a.address)).join(", ");
}

const SYSTEM_LEAVES = ["inbox", "sent", "drafts", "trash", "junk", "spam", "archive"];

function isCustomBox(mb: Mailbox): boolean {
  if (mb.specialUse) return false;
  const leaf = (mb.path ?? "").split(".").pop()?.toLowerCase() ?? "";
  return !SYSTEM_LEAVES.includes(leaf);
}

function folderErr(e: unknown): string {
  const d = (e as { data?: { message?: string }; statusCode?: number })?.data;
  const code = (e as { statusCode?: number })?.statusCode;
  if (code === 409 || d?.message === "Folder not empty") return t("folderNotEmpty");
  return (typeof d?.message === "string" ? d.message : null) ?? t("genericError");
}

async function submitFolder() {
  const d = folderDialog.value;
  if (!d || folderBusy.value) return;
  folderBusy.value = true;
  folderError.value = null;
  try {
    if (d.mode === "create") {
      const r = await $fetch<{ path?: string }>("/api/mailbox", {
        method: "POST",
        body: { op: "create", name: d.name },
      });
      await refreshMailboxes();
      if (r.path) selectMailbox(r.path);
    } else if (d.mode === "rename" && d.path) {
      const r = await $fetch<{ path?: string }>("/api/mailbox", {
        method: "POST",
        body: { op: "rename", path: d.path, newName: d.name },
      });
      await refreshMailboxes();
      if (r.path) selectMailbox(r.path);
    } else if (d.mode === "delete" && d.path) {
      const gone = d.path;
      await $fetch("/api/mailbox", { method: "POST", body: { op: "delete", path: gone } });
      await refreshMailboxes();
      if (selected.value === gone) {
        const fallback = mailboxes.value.find((m) => !isCustomBox(m));
        selectMailbox(fallback?.path ?? "INBOX");
      }
    }
    folderDialog.value = null;
  } catch (e) {
    folderError.value = folderErr(e);
  } finally {
    folderBusy.value = false;
  }
}

async function openDraft(m: MailSummary) {
  try {
    const box = encodeURIComponent(selected.value ?? "INBOX");
    const data = await $fetch<{ mail: MailDetail }>(`/api/mail?mailbox=${box}&uid=${m.uid}`);
    const d = data.mail;
    if (!d) return;
    const extra = d as MailDetail & { messageId?: string; references?: string };
    const refs = (extra.references ?? "").split(/\s+/).filter(Boolean);
    const last = refs[refs.length - 1];
    if (extra.messageId && last === extra.messageId) refs.pop();
    const inReplyTo = refs.length ? (refs[refs.length - 1] ?? undefined) : undefined;
    const files = await Promise.all(
      (d.files ?? []).map(async (f) => {
        if (f.size > 20 * 1024 * 1024) return null;
        try {
          const buf = await $fetch<ArrayBuffer>(
            `/api/attachment?mailbox=${box}&uid=${m.uid}&part=${encodeURIComponent(f.partId)}`,
            { responseType: "arrayBuffer" },
          );
          const bytes = new Uint8Array(buf);
          let bin = "";
          for (let i = 0; i < bytes.length; i += 8192) {
            bin += String.fromCharCode(...bytes.subarray(i, i + 8192));
          }
          return { name: f.filename, type: f.contentType, size: f.size, content: btoa(bin), cid: f.contentId, inline: f.inline };
        } catch {
          return null;
        }
      }),
    );
    compose.value = {
      key: `draft-${m.uid}`,
      to: addrStr(d.to ?? []),
      cc: addrStr(d.cc ?? []),
      bcc: addrStr(d.bcc ?? []),
      subject: d.subject === "(no subject)" ? "" : d.subject,
      body: d.html ?? (d.text ? plainToHtml(d.text) : undefined),
      inReplyTo,
      references: refs.length > 1 ? refs.slice(0, -1).join(" ") : undefined,
      draftUid: m.uid,
      draftMailbox: selected.value ?? "INBOX",
      attachments: files.flatMap((f) => (f ? [f] : [])),
    };
  } catch (e) {
    error.value = e instanceof Error ? e.message : t("genericError");
  }
}

async function onSent() {
  toast.value = t("sentToast");
  await refreshMailboxes();
  const box = mailboxes.value.find((b) => b.path === selected.value);
  if (box && isDraftBox(box) && selected.value) await loadList(selected.value, page.value);
}

async function onDrafted() {
  toast.value = t("draftSaved");
  await refreshMailboxes();
  const box = mailboxes.value.find((b) => b.path === selected.value);
  if (box && isDraftBox(box) && selected.value) await loadList(selected.value, page.value);
}

async function open(m: MailSummary) {
  const box = mailboxes.value.find((b) => b.path === selected.value);
  if (box && isDraftBox(box)) {
    await openDraft(m);
    return;
  }
  openUid.value = m.uid;
  const peers = messages.value
    .filter((x) => x.threadId === m.threadId)
    .sort((a, b) => a.uid - b.uid);
  try {
    const box = encodeURIComponent(selected.value ?? "INBOX");
    const details = await Promise.all(
      peers.map(async (p) => {
        const data = await $fetch<{ mail: MailDetail }>(`/api/mail?mailbox=${box}&uid=${p.uid}`);
        return data.mail;
      }),
    );
    openThread.value = details.filter(Boolean);
    openMail.value = details[details.length - 1] ?? null;
    const newlySeen = messages.value.filter((x) => x.threadId === m.threadId && !x.seen).length;
    messages.value = messages.value.map((x) => (x.threadId === m.threadId ? { ...x, seen: true } : x));
    if (newlySeen > 0 && selected.value) bumpUnseen(selected.value, -newlySeen);
  } catch (e) {
    error.value = e instanceof Error ? e.message : t("genericError");
  }
}

async function act(action: string, target?: string, uids?: number[]) {
  if (!selected.value) return;
  const box = selected.value;
  const list = uids?.length ? uids : [...checked.value];
  if (!list.length) return;
  try {
    await $fetch("/api/mail/action", {
      method: "POST",
      body: { action, mailbox: box, uids: list, target },
    });
  } catch (e: unknown) {
    const d = (e as { data?: { error?: unknown; message?: string } })?.data;
    error.value = (typeof d?.error === "string" ? d.error : d?.message) ?? t("genericError");
    await loadList(box, page.value);
    return;
  }
  const gone = new Set(list);
  messages.value = messages.value.filter((m) => !gone.has(m.uid));
  if (results.value) results.value = results.value.filter((m) => !gone.has(m.uid));
  total.value = Math.max(0, total.value - list.length);
  const next = new Set(checked.value);
  list.forEach((u) => next.delete(u));
  checked.value = next;
  if (openMail.value && gone.has(openMail.value.uid)) closeMail();
  else {
    if (openUid.value !== null && gone.has(openUid.value)) openUid.value = null;
    if (openThread.value.length) openThread.value = openThread.value.filter((d) => !gone.has(d.uid));
  }
  await refreshMailboxes();
  if (messages.value.length === 0 && total.value > 0 && !results.value) await loadList(box, page.value);
}

function makeReply(m: MailSummary) {
  const detail = (openThread.value.find((d) => d.uid === m.uid) ?? openMail.value) as
    | (MailDetail & { messageId?: string; references?: string })
    | null
    | undefined;
  const msgId = (detail as { messageId?: string } | null)?.messageId ?? null;
  const refs = (detail as { references?: string } | null)?.references ?? null;
  const html = (detail?.html ?? "").trim();
  const plain = (detail?.text ?? "").trim() || stripHtml(html);
  const addr = m.from?.address ?? "";
  const name = m.from?.name ?? "";
  const who = name && addr && name !== addr ? `${name} <${addr}>` : name || addr;
  const when = m.date ? new Date(m.date).toLocaleString(dateLocale.value) : "";
  const head = who || when ? `${t("replyOn")} ${when}${who ? `, ${who}` : ""} ${t("replyWrote")} :` : "";

  const original = nestQuotes(html || (plain ? plainToHtml(plain) : ""));
  const quote =
    `<p><br></p>` +
    `${head ? `<div>${escapeHtml(head)}<br></div>` : ""}` +
    `${original ? `<blockquote>${original}</blockquote>` : ""}`;
  compose.value = {
    key: "reply-" + m.uid,
    to: m.from?.address ?? "",
    subject: /^re\s*:/i.test(m.subject) ? m.subject : `Re: ${m.subject}`,
    body: original ? quote : undefined,
    inReplyTo: msgId ?? undefined,
    references: refs ?? undefined,
  };
}

async function onStar(m: MailSummary) {
  const wantStar = !m.flags.includes("\\Flagged");
  await $fetch("/api/mail/action", {
    method: "POST",
    body: {
      action: wantStar ? "flag" : "unflag",
      mailbox: selected.value ?? "INBOX",
      uid: m.uid,
    },
  });
  messages.value = messages.value.map((x) =>
    x.uid === m.uid
      ? {
          ...x,
          flags: wantStar ? [...x.flags, "\\Flagged"] : x.flags.filter((f) => f !== "\\Flagged"),
        }
      : x,
  );
}

async function toggleSeen(m: MailSummary) {
  if (!selected.value) return;
  await $fetch("/api/mail/action", {
    method: "POST",
    body: {
      action: m.seen ? "unseen" : "seen",
      mailbox: selected.value,
      uid: m.uid,
    },
  });
  messages.value = messages.value.map((x) => (x.uid === m.uid ? { ...x, seen: !x.seen } : x));
  if (selected.value) bumpUnseen(selected.value, m.seen ? 1 : -1);
  if (results.value) results.value = results.value.map((x) => (x.uid === m.uid ? { ...x, seen: !x.seen } : x));
  if (openMail.value?.uid === m.uid) openMail.value = { ...openMail.value, seen: !m.seen };
}

const threads = computed(() => {
  const source = results.value ?? messages.value;
  if (results.value) return source.map((m) => ({ head: m, count: 1, all: [m] }));
  const byId = new Map<string, MailSummary[]>();
  for (const m of source) {
    const list = byId.get(m.threadId) ?? [];
    list.push(m);
    byId.set(m.threadId, list);
  }
  return [...byId.values()]
    .map((list) => {
      const sorted = [...list].sort((a, b) => b!.uid - a!.uid);
      return { head: sorted[0]!, count: sorted.length, all: sorted };
    })
    .sort((a, b) => b.head!.uid - a.head!.uid);
});

async function runSearch(q: string) {
  if (!q.trim()) {
    results.value = null;
    showFilters.value = false;
    return;
  }
  searching.value = true;
  try {
    const data = await $fetch<{ results?: MailSummary[] }>(
      `/api/search?mailbox=${encodeURIComponent(selected.value ?? "INBOX")}&q=${encodeURIComponent(q)}`,
    );
    results.value = data.results ?? [];
  } catch (e) {
    error.value = e instanceof Error ? e.message : t("searchError");
  } finally {
    searching.value = false;
  }
}

function buildFilterQuery(): string {
  const parts: string[] = [];
  if (filters.value.from) parts.push(`from:${filters.value.from}`);
  if (filters.value.to) parts.push(`to:${filters.value.to}`);
  if (filters.value.subject) parts.push(`subject:${filters.value.subject}`);
  if (filters.value.text) parts.push(filters.value.text);
  if (filters.value.flagged) parts.push("is:flagged");
  return parts.join(" ");
}

function applyFilters() {
  const q = buildFilterQuery();
  query.value = q;
  void runSearch(q);
  showFilters.value = false;
}

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)));

const contacts = computed(() => {
  const set = new Set<string>();
  for (const m of messages.value) {
    if (m.from?.address) set.add(m.from.address);
    for (const addr of m.to ?? []) if (addr.address) set.add(addr.address);
  }
  return [...set];
});

function selectMailbox(path: string) {
  selected.value = path;
  page.value = 0;
  results.value = null;
  query.value = "";
  if (isMobile.value) navOpen.value = "icons";
}

function closeMail() {
  openUid.value = null;
  openMail.value = null;
  openThread.value = [];
}

function toggleAll() {
  const all = threads.value.flatMap((th) => th.all.map((m) => m.uid));
  if (checked.value.size === all.length) checked.value = new Set();
  else checked.value = new Set(all);
}

function toggleThread(th: { all: MailSummary[] }) {
  const uids = th.all.map((x) => x.uid);
  const allChecked = uids.every((u) => checked.value.has(u));
  const next = new Set(checked.value);
  if (allChecked) uids.forEach((u) => next.delete(u));
  else uids.forEach((u) => next.add(u));
  checked.value = next;
}

function reload() {
  if (selected.value && !loading.value) void loadList(selected.value, page.value);
}

async function logout() {
  await $fetch("/api/auth/logout", { method: "POST" });
  await navigateTo("/login");
}

function onProfileSave(name: string, pic: string | null) {
  displayName.value = name;
  photo.value = pic;
  toast.value = t("profileSaved");
}


function startResize(e: PointerEvent) {
  const startX = e.clientX;
  const startW = navWidth.value;
  (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  function move(ev: PointerEvent) {
    navWidth.value = Math.min(480, Math.max(180, startW + ev.clientX - startX));
  }
  function up() {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
  }
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
}
</script>
