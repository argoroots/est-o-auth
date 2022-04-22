<script setup>
import { computed, defineEmits, defineProps } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  id: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  autofocus: { type: Boolean, default: false },
  placeholder: { type: String, required: true }
})

const emit = defineEmits([
  'update:modelValue',
  'submit'
])

const text = computed({
  get () {
    return props.modelValue
  },
  set (val) {
    emit('update:modelValue', val)
  }
})

</script>

<template>
  <div class="form-input">
    <input
      :id="id"
      v-model="text"
      :type="type"
      :placeholder="placeholder"
      :autofocus="autofocus"
      class="peer"
      @keypress.enter="emit('submit')"
    >
    <label :for="id">{{ label }}</label>
  </div>
</template>

<style scoped>
.form-input {
  @apply relative;
}

input {
  @apply h-10;
  @apply w-full;
  @apply px-2;
  @apply rounded-none;
  @apply placeholder-transparent;
  @apply border;
  @apply border-stone-300;
  @apply text-stone-900;
  @apply focus:outline-none;
  @apply focus:border-stone-500;
}

label {
  @apply absolute;
  @apply -top-2.5;
  @apply left-1;
  @apply px-1;
  @apply text-sm;
  @apply text-stone-500;
  @apply bg-white;
  @apply transition-all;
  @apply peer-placeholder-shown:top-2;
  @apply peer-placeholder-shown:text-base;
  @apply peer-placeholder-shown:text-stone-500;
  @apply peer-placeholder-shown:cursor-text;
  @apply peer-focus:-top-2.5;
  @apply peer-focus:text-sm;
  @apply peer-focus:text-stone-500;
}
</style>
