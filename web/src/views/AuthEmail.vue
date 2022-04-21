<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import formInput from '@/components/FormInput.vue'
import formButton from '@/components/FormButton.vue'

const { query } = useRoute()
const email = ref(query.email)

if (email.value) {
  onAuthenticate()
}

function onAuthenticate () {
  if (!email.value?.trim()) {
    return
  }

  console.log(email.value)
}
</script>

<template>
  <form>
    <form-input
      id="email"
      v-model="email"
      label="Email address"
      type="email"
      placeholder="jaak-kristjan@jõeorg.ee"
      autofocus
      @submit="onAuthenticate"
    />
    <form-button
      label="Authenticate"
      @click="onAuthenticate"
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
