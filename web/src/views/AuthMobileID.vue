<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import formInput from '@/components/FormInput.vue'
import formButton from '@/components/FormButton.vue'

const { query } = useRoute()
const phone = ref(query.phone)
const idc = ref(query.idc)

if (idc.value && phone.value) {
  onAuthenticate()
}

function onAuthenticate () {
  if (!idc.value?.trim() || !phone.value?.trim()) {
    return
  }

  console.log(idc.value, phone.value)
}
</script>

<template>
  <form>
    <form-input
      id="idc"
      v-model="idc"
      type="tel"
      label="ID code"
      placeholder="idc"
      autofocus
    />
    <form-input
      id="phone"
      v-model="phone"
      type="tel"
      label="Phone"
      placeholder="phone"
    />
    <form-button
      label="Authenticate"
    />
  </form>
</template>

<style scoped>
form {
  @apply py-8;
  @apply px-6;
  @apply flex;
  @apply flex-col;
  @apply space-y-6;
  @apply bg-white;
}
</style>
