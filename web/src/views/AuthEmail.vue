<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import formInput from '@/components/FormInput.vue'
import formButton from '@/components/FormButton.vue'

const route = useRoute()
const email = ref(route.query?.email)
const emailSent = ref(false)

if (email.value) {
  onAuthenticate()
}

function onAuthenticate () {
  if (!email.value?.trim()) {
    return
  }

  emailSent.value = true
  console.log(email.value)
}
</script>

<template>
  <div class="p-4">
    <div class="relative">
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
    </div>
  </div>
</template>
