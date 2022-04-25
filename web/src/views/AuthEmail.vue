<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import { post } from '@/api.js'
import formWrapper from '@/components/FormWrapper.vue'
import formInput from '@/components/FormInput.vue'
import formButton from '@/components/FormButton.vue'

const { query } = useRoute()
const email = ref(query.email)

if (email.value) {
  onAuthenticate()
}

async function onAuthenticate () {
  if (!email.value?.trim()) {
    return
  }

  const response = await post('e-mail', {
    response_type: query.response_type,
    client_id: query.client_id,
    redirect_uri: query.redirect_uri,
    scope: query.scope,
    state: query.state,
    email: email.value
  })

  console.log(response)
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
    <form-button @click="onAuthenticate">
      Authenticate
    </form-button>
  </form-wrapper>
</template>
