<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import { post } from '@/api.js'
import formWrapper from '@/components/FormWrapper.vue'
import formInput from '@/components/FormInput.vue'
import formButton from '@/components/FormButton.vue'

const { query } = useRoute()
const idcode = ref(query.idcode)
const phone = ref(query.phone)
const isSending = ref(false)
const consent = ref(null)

if (idcode.value && phone.value) {
  onStartSession()
}

async function onStartSession () {
  if (!idcode.value?.trim() || !phone.value?.trim()) {
    return
  }

  const response = await post('mobile-id', {
    response_type: query.response_type,
    client_id: query.client_id,
    redirect_uri: query.redirect_uri,
    scope: query.scope,
    state: query.state,
    idcode: idcode.value,
    phone: phone.value
  })

  isSending.value = false

  if (response.consent) {
    consent.value = response.consent
  }

  console.log(response)
}
</script>

<template>
  <form-wrapper v-if="!isSending && !consent">
    <form-input
      id="idcode"
      v-model="idcode"
      type="tel"
      label="ID code"
      placeholder="38001085718"
      autofocus
    />
    <form-input
      id="phone"
      v-model="phone"
      type="tel"
      label="Phone"
      placeholder="+37200000000"
    />
    <form-button @click="onAuthenticate">
      Authenticate
    </form-button>
  </form-wrapper>
  <form-wrapper v-if="!isSending && pin">
    <h2>{{ pin }}</h2>
  </form-wrapper>
</template>
