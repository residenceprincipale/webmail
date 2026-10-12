<template>
  <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
    <div class="w-full max-w-[440px] rounded-2xl bg-white p-6">
      <h2 class="mb-1 text-lg font-medium">{{ t("changePassword") }}</h2>
      <p class="mb-4 text-xs text-neutral-700">
        {{ t("pwdBlurb") }}
      </p>
      <form class="flex flex-col gap-3" @submit.prevent="submit">
        <PasswordField
          v-model="current"
          required
          autocomplete="current-password"
          :label="t('currentPwd')"
          :placeholder="t('currentPwd')"
          :show-label="t('showPwd')"
          :hide-label="t('hidePwd')"
        />
        <PasswordField
          v-model="next"
          required
          autocomplete="new-password"
          :label="t('newPwd')"
          :placeholder="t('newPwd')"
          :show-label="t('showPwd')"
          :hide-label="t('hidePwd')"
        />
        <p v-if="msg" role="alert" class="rounded border border-neutral-300 bg-white px-3 py-2 text-xs text-black">{{ msg }}</p>
        <div class="flex justify-end gap-2">
          <button type="button" class="px-3 py-2 text-sm text-black" @click="$emit('close')">
            {{ t("cancel") }}
          </button>
          <button
            type="submit"
            :disabled="busy"
            class="cursor-pointer bg-black px-5 py-2 text-sm font-medium text-white"
          >
            {{ t("confirm") }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{ (e: "close"): void }>();

const { t } = useI18n();
const current = ref("");
const next = ref("");
const msg = ref<string | null>(null);
const busy = ref(false);

async function submit() {
  busy.value = true;
  msg.value = null;
  try {
    const data = await $fetch<{ error?: unknown; message?: string }>("/api/password", {
      method: "PUT",
      body: { current: current.value, next: next.value },
    }).catch((e: unknown) => (e as { data?: { error?: unknown; message?: string } })?.data ?? {});
    msg.value = (typeof data?.error === "string" ? data.error : data?.message) ?? t("pwdChanged");
  } catch {
    msg.value = t("genericError");
  } finally {
    busy.value = false;
  }
}
</script>
