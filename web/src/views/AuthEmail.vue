<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import { post } from '@/api.js'
import formWrapper from '@/components/FormWrapper.vue'
import formInput from '@/components/FormInput.vue'
import formButton from '@/components/FormButton.vue'

const { query } = useRoute()
const email = ref(query.email)
const code = ref(query.code)
const isSending = ref(false)
const isEmailSent = ref(false)
const isError = ref(false)

if (email.value && !code.value) {
  onSendEmail()
}

if (email.value && code.value) {
  onAuthenticate()
}

async function onSendEmail () {
  if (!email.value?.trim()) {
    return
  }

  isSending.value = true

  const response = await post('e-mail', {
    response_type: query.response_type,
    client_id: query.client_id,
    redirect_uri: query.redirect_uri,
    scope: query.scope,
    state: query.state,
    email: email.value
  })

  isSending.value = false

  if (response.emailSent) {
    isEmailSent.value = true
  }
}

async function onAuthenticate () {
  if (!code.value?.trim()) {
    return
  }

  isSending.value = true
  isError.value = false

  const response = await post('e-mail/code', {
    email: email.value,
    code: code.value
  })

  if (response.redirect) {
    window.location.href = response.redirect
  } else {
    isSending.value = false
    isError.value = true
  }
}
</script>

<template>
  <form-wrapper v-if="!isSending && !isEmailSent">
    <form-input
      id="email"
      v-model="email"
      label="Email address"
      type="email"
      placeholder="jaak-kristjan@jõeorg.ee"
      autofocus
      @submit="onSendEmail"
    />
    <form-button @click="onSendEmail">
      Authenticate
    </form-button>
  </form-wrapper>

  <form-wrapper v-if="!isSending && isEmailSent">
    <h2>Check Your inbox!</h2>
    <p>We sent a verification code to e-mail address {{ email }}. Please enter it below or click a link in e-mail.</p>
    <form-input
      id="code"
      v-model="code"
      label="Verification Code"
      placeholder="123ABC"
      autofocus
      @submit="onAuthenticate"
    />
    <p
      v-if="isError"
      class="text-red-700"
    >
      Invalid verification code!
    </p>
    <form-button @click="onAuthenticate">
      Authenticate
    </form-button>
  </form-wrapper>
</template>
