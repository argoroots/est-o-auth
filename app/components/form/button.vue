<script setup>
defineProps({
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['click'])
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    @click.prevent="emit('click')"
  >
    <slot />
  </button>
</template>

<style scoped>
@reference "~/assets/tailwind.css";

button {
  @apply h-10;
  @apply w-full;
  @apply mt-4;
  @apply px-2;
  @apply border;
  @apply font-extralight;
  @apply border-stone-300;
  @apply hover:bg-stone-100;
  @apply hover:text-stone-600;
  @apply active:bg-stone-200;
  @apply disabled:opacity-50;
  @apply disabled:hover:bg-transparent;
  @apply disabled:cursor-not-allowed;
}
</style>
