<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import formWrapper from '@/components/FormWrapper.vue'
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
  <form-wrapper>
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
  </form-wrapper>
</template>
