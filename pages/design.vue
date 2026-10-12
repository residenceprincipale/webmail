<template>
  <div class="min-h-screen bg-white px-8 py-10 text-black">
    <header class="mb-10 flex items-center gap-4">
      <h1 class="text-[28px]">Design system</h1>
      <div class="ml-auto flex items-center gap-1 text-xs font-medium text-neutral-700">
        <button :aria-pressed="locale === 'fr'" :class="`cursor-pointer px-2 py-1 ${locale === 'fr' ? 'bg-black text-white' : 'hover:bg-neutral-100'}`" @click="locale = 'fr'">FR</button>
        <button :aria-pressed="locale === 'en'" :class="`cursor-pointer px-2 py-1 ${locale === 'en' ? 'bg-black text-white' : 'hover:bg-neutral-100'}`" @click="locale = 'en'">EN</button>
        <button :aria-label="dark ? t('enableLight') : t('enableDark')" class="cursor-pointer px-2 py-1 hover:bg-neutral-100" @click="dark = !dark">{{ dark ? "☀" : "☾" }}</button>
      </div>
    </header>

    <section class="mb-10 border-t border-neutral-300 pt-4">
      <h2 class="mb-4 text-[20px]">Couleurs</h2>
      <div class="flex flex-wrap gap-4">
        <div v-for="[hex, name] in SWATCHES" :key="hex" class="w-32 border border-neutral-300">
          <div class="h-16 border-b border-neutral-300" :style="{ background: hex }" />
          <p class="px-2 py-1 text-xs">{{ name }}</p>
          <p class="px-2 pb-2 text-xs text-neutral-700">{{ hex }}</p>
        </div>
      </div>
    </section>

    <section class="mb-10 border-t border-neutral-300 pt-4">
      <h2 class="mb-4 text-[20px]">Typographie</h2>
      <p class="text-[28px]">Titre 28px — Georgia</p>
      <p class="text-[22px]">Titre message 22px</p>
      <p class="text-[20px] text-neutral-700">Webmail 20px gris</p>
      <p class="text-sm">Corps 13–14px Georgia, même famille partout (éditeur Quill inclus)</p>
      <p class="text-xs text-neutral-700">Légende 12px gris texte</p>
    </section>

    <section class="mb-10 border-t border-neutral-300 pt-4">
      <h2 class="mb-4 text-[20px]">Boutons</h2>
      <div class="flex flex-wrap items-center gap-3">
        <button class="cursor-pointer bg-black px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700">Primaire</button>
        <button class="flex cursor-pointer items-center gap-1.5 border border-neutral-300 px-4 py-2 text-sm font-medium text-black hover:bg-neutral-100">
          <ClockIcon /> Secondaire
        </button>
        <button class="cursor-pointer px-3 py-2 text-sm text-black hover:bg-neutral-100">Texte</button>
        <button class="cursor-pointer bg-black px-5 py-2 text-sm font-medium text-white opacity-60" disabled>Désactivé</button>
        <IconBtn label="Archiver" :on-click="() => {}"><ArchiveIcon /></IconBtn>
        <IconBtn label="Supprimer" :on-click="() => {}"><TrashIcon /></IconBtn>
        <IconBtn label="Répondre" :on-click="() => {}"><ReplyIcon /></IconBtn>
        <IconBtn label="Fermer" :on-click="() => {}"><CloseIcon /></IconBtn>
      </div>
    </section>

    <section class="mb-10 border-t border-neutral-300 pt-4">
      <h2 class="mb-4 text-[20px]">Champs</h2>
      <div class="grid max-w-2xl gap-3">
        <input placeholder="Champ texte" aria-label="Champ texte" class="w-full border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black" >
        <PasswordField v-model="pwd" label="Mot de passe" placeholder="Mot de passe" show-label="Afficher" hide-label="Masquer" />
        <input placeholder="Recherche" aria-label="Recherche" class="h-10 border border-neutral-300 bg-white px-4 text-sm outline-none" >
        <p class="border border-neutral-300 bg-white px-3 py-2 text-xs text-black">Message info / erreur (fond blanc, bordure grise, texte noir)</p>
      </div>
    </section>

    <section class="mb-10 border-t border-neutral-300 pt-4">
      <h2 class="mb-4 text-[20px]">Checkbox</h2>
      <div class="flex items-center gap-6">
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" class="wm-check cursor-pointer" > Vide
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" checked class="wm-check cursor-pointer" > Coché
        </label>
        <span class="flex items-center gap-2 text-sm">
          <CheckboxAll :count="3" :checked-count="0" :on-toggle="() => {}" /> Tout (vide)
        </span>
        <span class="flex items-center gap-2 text-sm">
          <CheckboxAll :count="3" :checked-count="2" :on-toggle="() => {}" /> Partiel (indéterminé)
        </span>
        <span class="flex items-center gap-2 text-sm">
          <CheckboxAll :count="3" :checked-count="3" :on-toggle="() => {}" /> Tout coché
        </span>
      </div>
    </section>

    <section class="mb-10 border-t border-neutral-300 pt-4">
      <h2 class="mb-4 text-[20px]">Icônes</h2>
      <div class="flex flex-wrap items-center gap-4 text-black">
        <span v-for="[label, icon] in ICONS" :key="label" class="flex w-24 flex-col items-center gap-1 border border-neutral-300 p-3 text-center">
          <component :is="icon" v-bind="label === 'Lu' ? { seen: true } : label === 'Non lu' ? { seen: false } : {}" />
          <span class="text-[11px] text-neutral-700">{{ label }}</span>
        </span>
      </div>
    </section>

    <section class="mb-10 border-t border-neutral-300 pt-4">
      <h2 class="mb-4 text-[20px]">Boîtes</h2>
      <div class="flex flex-wrap items-center gap-4">
        <span v-for="k in (['\\Inbox', '\\Sent', '\\Drafts', '\\Junk', '\\Trash', '\\Archive'] as const)" :key="k" class="flex items-center gap-2 border border-neutral-300 px-3 py-2 text-sm">
          <BoxIcon :kind="k" /> {{ k.replace(/^\\/, "") }}
        </span>
      </div>
    </section>

    <section class="mb-10 border-t border-neutral-300 pt-4">
      <h2 class="mb-4 text-[20px]">Badge</h2>
      <div class="flex items-center gap-6">
        <span class="relative inline-block border border-neutral-300 px-6 py-2" title="Nav reduite">
          <FolderIcon />
          <Badge :count="3" floating />
        </span>
        <Badge :count="12" />
        <Badge :count="128" />
      </div>
      <p class="mt-2 text-xs text-neutral-700">Compteur non-lu : encadré bordure grise, coins carrés, même police. Variante flottante pour la nav reduite.</p>
    </section>

    <section class="mb-10 border-t border-neutral-300 pt-4">
      <h2 class="mb-4 text-[20px]">Avatars</h2>
      <div class="flex items-center gap-4">
        <Avatar v-for="n in ['alice@example.com', 'bob@example.com', 'carole@example.com', 'dave@example.com', 'erin@example.com']" :key="n" :name="n" />
        <Avatar name="alice@example.com" :size="40" />
      </div>
      <p class="mt-2 text-xs text-neutral-700">Avatar noir. En dark : noir -> blanc.</p>
    </section>

    <section class="mb-10 border-t border-neutral-300 pt-4">
      <h2 class="mb-4 text-[20px]">Cartes / panneaux</h2>
      <div class="grid max-w-3xl gap-4">
        <div class="w-64 border border-neutral-300 bg-white py-2">
          <p class="px-4 py-2 text-xs text-neutral-700">Menu déroulant : bordure 1px, coins carrés</p>
          <p class="px-4 py-2 text-sm hover:bg-neutral-100">Élément de menu</p>
        </div>
        <div class="flex max-w-md items-center gap-3 bg-black px-4 py-3 text-sm text-white">
          Toast / notification
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  CheckboxAll, IconBtn, Avatar, Badge,
  MenuIcon, SearchIcon, FilterIcon, PencilIcon, StarIcon, StarFilledIcon,
  ArchiveIcon, SpamIcon, TrashIcon, FolderIcon, InboxIcon, PaperclipIcon,
  ReplyIcon, CloseIcon, ClockIcon, ReloadIcon, BoxIcon, MailOpenIcon,
  EyeIcon, EyeClosedIcon,
} from "~/components/mail-ui";

const { t, locale, dark } = useI18n();
void t;
const pwd = ref("");

const SWATCHES: [string, string][] = [
  ["#000000", "Noir"],
  ["#404040", "Gris texte"],
  ["#d4d4d4", "Gris bordure"],
  ["#f5f5f5", "Gris fond"],
  ["#ffffff", "Blanc"],
];

const ICONS: [string, unknown][] = [
  ["Menu", MenuIcon],
  ["Recherche", SearchIcon],
  ["Filtre", FilterIcon],
  ["Crayon", PencilIcon],
  ["Étoile", StarIcon],
  ["Étoile pleine", StarFilledIcon],
  ["Archive", ArchiveIcon],
  ["Spam", SpamIcon],
  ["Corbeille", TrashIcon],
  ["Dossier", FolderIcon],
  ["Boîte vide", InboxIcon],
  ["Pièce jointe", PaperclipIcon],
  ["Réponse", ReplyIcon],
  ["Fermer", CloseIcon],
  ["Horloge", ClockIcon],
  ["Oeil", EyeIcon],
  ["Oeil barre", EyeClosedIcon],
  ["Recharger", ReloadIcon],
  ["Lu", MailOpenIcon],
  ["Non lu", MailOpenIcon],
];
</script>
