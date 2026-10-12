<template>
  <MailboxApp :login="login" :host="host" :display-name="displayName" :photo="photo" />
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth" });

interface Profile {
  login: string;
  displayName: string;
  photo: string | null;
}

const { data } = await useFetch<{ login?: string; host?: string; profile: Profile }>("/api/me", {
  server: true,
});

const login = computed(() => data.value?.login ?? "");
const host = computed(() => data.value?.host ?? "");
const displayName = computed(() => data.value?.profile.displayName ?? "");
const photo = computed(() => data.value?.profile.photo ?? null);
</script>
