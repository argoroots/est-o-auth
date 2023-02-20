<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import { post } from '@/api.js'
import formWrapper from '@/components/FormWrapper.vue'
import formInput from '@/components/FormInput.vue'
import formButton from '@/components/FormButton.vue'

const { query } = useRoute()
const phone = ref(query.phone)
const code = ref(query.code)
const isSending = ref(false)
const isError = ref(false)
const isPhoneSent = ref(false)

if (phone.value && !code.value) {
  onStartSession()
}

if (phone.value && code.value) {
  onAuthenticate()
}

async function onStartSession () {
  if (!phone.value?.trim()) {
    return
  }

  isSending.value = true

  const response = await post('phone', {
    response_type: query.response_type,
    client_id: query.client_id,
    redirect_uri: query.redirect_uri,
    scope: query.scope,
    state: query.state,
    phone: phone.value
  })

  isSending.value = false

  if (response.phoneSent) {
    isPhoneSent.value = true
  }
}

async function onAuthenticate () {
  if (!phone.value?.trim()) {
    return
  }

  if (!code.value?.trim()) {
    return
  }

  isSending.value = true
  isError.value = false

  const response = await post('phone/code', {
    response_type: query.response_type,
    client_id: query.client_id,
    redirect_uri: query.redirect_uri,
    scope: query.scope,
    state: query.state,
    phone: phone.value,
    code: code.value
  })

  if (response.redirect) {
    window.location.href = response.redirect
  } else {
    isSending.value = false
    isPhoneSent.value = true
    isError.value = true
  }
}
</script>

<template>
  <form-wrapper v-if="!isSending && !isPhoneSent">
    <form-input
      id="phone"
      v-model="phone"
      type="tel"
      label="Phone"
      placeholder="+37200000000"
      autofocus
      @submit="onStartSession"
    />
    <form-button @click="onStartSession">
      Authenticate
    </form-button>
  </form-wrapper>

  <form-wrapper v-if="!isSending && isPhoneSent">
    <h2>Check Your phone!</h2>
    <p>We sent a verification code to phone number {{ phone }}. Please enter it below.</p>
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
