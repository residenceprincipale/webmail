<template>
  <span class="relative block w-full">
    <input
      :type="show ? 'text' : 'password'"
      :required="required"
      :autocomplete="autoComplete"
      :value="modelValue"
      :placeholder="placeholder"
      :aria-label="props.label ?? props.placeholder"
      :class="props.class ?? 'w-full rounded border border-neutral-300 px-3 py-2 pr-10 text-sm outline-none focus:border-black'"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >
    <button
      type="button"
      :aria-label="show ? hideLabel : showLabel"
      :title="show ? hideLabel : showLabel"
      :aria-pressed="show"
      class="absolute right-1 top-1/2 -translate-y-1/2 cursor-pointer p-1.5 text-neutral-700 hover:text-black"
      @click="show = !show"
    >
      <EyeClosedIcon v-if="show" />
      <EyeIcon v-else />
    </button>
  </span>
</template>

<script setup lang="ts">
import { EyeIcon, EyeClosedIcon } from "./mail-ui";

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
  label?: string;
  autoComplete?: string;
  required?: boolean;
  showLabel: string;
  hideLabel: string;
  class?: string;
}>();

defineEmits<{ (e: "update:modelValue", v: string): void }>();

const show = ref(false);
</script>
