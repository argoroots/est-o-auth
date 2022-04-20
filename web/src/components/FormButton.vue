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
  <button
    class="w-full mt-4 h-10 px-2 border border-slate-300 hover:bg-slate-100 active:bg-slate-200"
    @click="emit('click')"
  >
    {{ label }}
  </button>
</template>
