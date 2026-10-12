<template>
  <div class="flex min-h-screen items-center justify-center bg-white px-4">
    <div class="w-full max-w-[450px] rounded-2xl border border-neutral-300 bg-white px-10 py-12 text-black">
      <div class="mb-2 flex items-center justify-end gap-1 text-xs font-medium text-neutral-700">
        <button type="button" :aria-pressed="locale === 'fr'" title="Français" :class="localeBtn('fr')" @click="locale = 'fr'">FR</button>
        <button type="button" :aria-pressed="locale === 'en'" title="English" :class="localeBtn('en')" @click="locale = 'en'">EN</button>
        <button
          type="button"
          :aria-label="dark ? t('enableLight') : t('enableDark')"
          :title="dark ? t('enableLight') : t('enableDark')"
          class="cursor-pointer px-2 py-1 hover:bg-neutral-100"
          @click="dark = !dark"
        >{{ dark ? "☀" : "☾" }}</button>
      </div>
      <div class="mb-8 flex flex-col items-center gap-3">
        <h1 class="text-[22px] font-normal text-black">Webmail</h1>
      </div>

      <form class="flex flex-col gap-3" @submit.prevent="submit">
        <label class="flex flex-col gap-1.5 text-xs font-medium text-neutral-700">
          {{ t("emailLabel") }}
          <input
            v-model="login"
            type="email"
            required
            autocomplete="username"
            class="w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
            placeholder="you@example.com"
          >
        </label>

        <label class="flex flex-col gap-1.5 text-xs font-medium text-neutral-700">
          {{ t("passwordLabel") }}
          <PasswordField
            v-model="password"
            required
            autocomplete="current-password"
            :show-label="t('showPwd')"
            :hide-label="t('hidePwd')"
            class="w-full rounded border border-neutral-300 px-3 py-2 pr-10 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
          />
        </label>

        <button type="button" class="self-start text-xs text-black hover:underline" @click="showHost = !showHost">
          {{ showHost ? t("hideServer") : t("editServer") }} {{ t("imapServerTail") }}
        </button>

        <label v-if="showHost" class="flex flex-col gap-1.5 text-xs font-medium text-neutral-700">
          {{ t("imapServerLabel") }}
          <input
            v-model="host"
            type="text"
            class="w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
          >
        </label>

        <label class="flex cursor-pointer items-center gap-2 text-xs text-neutral-700">
          <input v-model="remember" type="checkbox" class="wm-check cursor-pointer" >
          {{ t("rememberMe") }}
        </label>

        <p v-if="error" role="alert" class="rounded border border-neutral-300 bg-white px-3 py-2 text-xs text-black">{{ error }}</p>

        <div class="mt-4 flex justify-end">
          <button
            type="submit"
            :disabled="busy"
            class="bg-black px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60"
          >
            {{ busy ? t("connecting") : t("connectBtn") }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t, locale, dark } = useI18n();

definePageMeta({ middleware: "guest" });

const config = useRuntimeConfig();
const host = ref(config.public.imapHost as string);
const login = ref("");
const password = ref("");
const error = ref<string | null>(null);
const busy = ref(false);
const showHost = ref(false);
const remember = ref(false);

function localeBtn(l: string) {
  return `cursor-pointer px-2 py-1 ${locale.value === l ? "bg-black text-white" : "hover:bg-neutral-100"}`;
}

async function submit() {
  error.value = null;
  busy.value = true;
  try {
    await $fetch("/api/auth", {
      method: "POST",
      body: { host: host.value, login: login.value, password: password.value, remember: remember.value },
    });
    await navigateTo("/");
  } catch (e: unknown) {
    const d = (e as { data?: { error?: unknown; message?: string } })?.data;
    error.value = (typeof d?.error === "string" ? d.error : d?.message) ?? t("loginFailed");
  } finally {
    busy.value = false;
  }
}
</script>
