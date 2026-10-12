<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div class="w-full max-w-[440px] rounded-2xl bg-white p-6">
      <h2 class="mb-1 text-lg font-medium">{{ t("nameAndPhoto") }}</h2>
      <p class="mb-4 text-xs text-neutral-700">
        {{ login }} — {{ t("profileBlurbTail") }}
      </p>
      <form class="flex flex-col gap-4" @submit.prevent="submit">
        <div class="flex items-center gap-4">
          <div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black text-2xl font-medium text-white">
            <img v-if="pic" :src="pic" alt="" class="h-full w-full object-cover" >
            <template v-else>{{ name.slice(0, 1).toUpperCase() || login.slice(0, 1).toUpperCase() }}</template>
          </div>
          <div class="flex flex-col gap-1.5">
            <button
              type="button"
              class="cursor-pointer border border-neutral-300 px-4 py-2 text-sm text-black hover:bg-neutral-100"
              @click="fileEl?.click()"
            >
              {{ t("chooseImage") }}
            </button>
            <button
              v-if="pic"
              type="button"
              class="cursor-pointer self-start text-xs text-neutral-700 hover:text-black"
              @click="pic = null"
            >
              {{ t("removePhoto") }}
            </button>
            <input
              ref="fileEl"
              type="file"
              accept="image/*"
              :aria-label="t('chooseImage')"
              class="hidden"
              @change="pickFile(($event.target as HTMLInputElement).files?.[0])"
            >
          </div>
        </div>
        <label class="flex flex-col gap-1.5 text-xs font-medium text-neutral-700">
          {{ t("displayNameLabel") }}
          <input
            v-model="name"
            type="text"
            :placeholder="login"
            class="rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black"
          >
        </label>
        <p v-if="err" role="alert" class="rounded border border-neutral-300 bg-white px-3 py-2 text-xs text-black">{{ err }}</p>
        <div class="flex justify-end gap-2">
          <button type="button" class="cursor-pointer px-3 py-2 text-sm text-black" @click="$emit('close')">
            {{ t("cancel") }}
          </button>
          <button
            type="submit"
            :disabled="busy"
            class="cursor-pointer bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {{ t("save") }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  login: string;
  displayName: string;
  photo: string | null;
}>();

const emit = defineEmits<{
  (e: "save", name: string, pic: string | null): void;
  (e: "close"): void;
}>();

const { t } = useI18n();
const name = ref(props.displayName);
const pic = ref<string | null>(props.photo);
const err = ref<string | null>(null);
const busy = ref(false);
const fileEl = ref<HTMLInputElement | null>(null);

function pickFile(f: File | null | undefined) {
  if (!f) return;
  if (!f.type.startsWith("image/")) {
    err.value = t("pickImageErr");
    return;
  }
  if (f.size > 300 * 1024) {
    err.value = t("imageTooBig");
    return;
  }
  err.value = null;
  const r = new FileReader();
  r.onload = () => (pic.value = typeof r.result === "string" ? r.result : null);
  r.readAsDataURL(f);
}

async function submit() {
  busy.value = true;
  err.value = null;
  try {
    await $fetch("/api/profile", {
      method: "PUT",
      body: { displayName: name.value, photo: pic.value },
    });
  } catch (e: unknown) {
    const d = (e as { data?: { error?: unknown; message?: string } })?.data;
    err.value = (typeof d?.error === "string" ? d.error : d?.message) ?? t("saveError");
    busy.value = false;
    return;
  }
  busy.value = false;
  emit("save", name.value, pic.value);
  emit("close");
}
</script>
