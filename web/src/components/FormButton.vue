<script setup>
import { defineEmits, defineProps } from 'vue'

defineProps({
  label: { type: String, required: true }
})

const emit = defineEmits([
  'click'
])
</script>

<template>
  <button @click.prevent="emit('click')">
    {{ label }}
  </button>
</template>

<style scoped>
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
}
</style>
