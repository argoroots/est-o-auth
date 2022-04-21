<script setup>
import { defineEmits, defineProps } from 'vue'

const props = defineProps({
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
  @apply border-slate-300;
  @apply hover:bg-slate-100;
  @apply hover:text-slate-600;
  @apply active:bg-slate-200;;
}
</style>
