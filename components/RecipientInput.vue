<template>
  <div class="relative border-b border-neutral-300">
    <label :for="inputId" class="sr-only">{{ label ?? placeholder }}</label>
    <input
      :id="inputId"
      ref="inputEl"
      :value="modelValue"
      :placeholder="placeholder"
      class="w-full px-4 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-black"
      role="combobox"
      :aria-expanded="open && matches.length > 0"
      aria-autocomplete="list"
      :aria-controls="listId"
      :aria-activedescendant="activeId ?? undefined"
      autocomplete="off"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value); open = true; active = -1"
      @focus="open = true"
      @blur="scheduleClose"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter.prevent="confirmActive"
      @keydown.esc="open = false"
    >
    <ul
      v-if="open && matches.length > 0"
      :id="listId"
      role="listbox"
      class="absolute left-0 top-full z-40 w-full border border-neutral-300 bg-white"
    >
      <li
        v-for="(s, i) in matches"
        :id="`${listId}-${i}`"
        :key="s"
        role="option"
        :aria-selected="i === active"
      >
        <button
          type="button"
          tabindex="-1"
          :class="`block w-full cursor-pointer px-4 py-2 text-left text-sm ${i === active ? 'bg-black text-white' : 'text-black hover:bg-neutral-100'}`"
          @mousedown.prevent="pick(s)"
          @mousemove="active = i"
        >
          {{ s }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string;
  placeholder: string;
  label?: string;
  suggestions: string[];
}>();

const emit = defineEmits<{ (e: "update:modelValue", v: string): void }>();

const open = ref(false);
const active = ref(-1);
const inputEl = ref<HTMLInputElement | null>(null);
const inputId = useId();
const listId = `${inputId}-list`;
const activeId = computed(() => (active.value >= 0 ? `${listId}-${active.value}` : null));
const matches = computed(() => {
  const tail = props.modelValue.split(",").pop()?.trim().toLowerCase() ?? "";
  if (!tail) return props.suggestions.slice(0, 5);
  return props.suggestions.filter((s) => s.toLowerCase().includes(tail)).slice(0, 5);
});

function pick(s: string) {
  const parts = props.modelValue.split(",");
  parts[parts.length - 1] = ` ${s} ,`;
  emit("update:modelValue", parts.join("").replace(/^\s+/, ""));
  open.value = false;
  active.value = -1;
  inputEl.value?.focus();
}

function move(dir: 1 | -1) {
  if (!open.value || matches.value.length === 0) { open.value = true; return; }
  active.value = (active.value + dir + matches.value.length) % matches.value.length;
}

function confirmActive() {
  const s = active.value >= 0 ? matches.value[active.value] : null;
  if (s) pick(s);
}

function scheduleClose() {
  setTimeout(() => (open.value = false), 150);
}
</script>
