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
  <div class="relative">
    <input
      :id="id"
      v-model="text"
      :type="type"
      :placeholder="placeholder"
      :autofocus="autofocus"
      class="peer h-10 px-2 w-full border border-slate-300 text-slate-900 placeholder-transparent focus:outline-none focus:border-slate-500"
      @keypress.enter="emit('submit')"
    >
    <label
      :for="id"
      class="absolute left-1 px-1 -top-2.5 text-slate-500 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-500 peer-placeholder-shown:top-2 peer-placeholder-shown:cursor-text peer-focus:-top-2.5 peer-focus:text-slate-500 peer-focus:text-sm bg-white"
    >{{ label }}</label>
  </div>
</template>
