<template>
  <NuxtPage />
</template>

<script setup lang="ts">
useHead({
  title: "Webmail",
  htmlAttrs: { lang: "en", class: "h-full" },
  bodyAttrs: { class: "min-h-full flex flex-col" },
  link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
  script: [
    {
      innerHTML: `try{if(localStorage.getItem("webmail-theme")==="dark"){document.documentElement.classList.add("dark")}}catch(e){}`,
      tagPosition: "bodyOpen",
    },
  ],
});
</script>
