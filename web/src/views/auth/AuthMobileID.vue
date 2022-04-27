<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import { post } from '@/api.js'
import formWrapper from '@/components/FormWrapper.vue'
import formInput from '@/components/FormInput.vue'
import formButton from '@/components/FormButton.vue'

const { query } = useRoute()
const idc = ref(query.idc)
const phone = ref(query.phone)
const pin = ref(null)

if (idc.value && phone.value) {
  onAuthenticate()
}

async function onAuthenticate () {
  if (!idc.value?.trim() || !phone.value?.trim()) {
    return
  }

  const response = await post('mobile-id', {
    response_type: query.response_type,
    client_id: query.client_id,
    redirect_uri: query.redirect_uri,
    scope: query.scope,
    state: query.state,
    idc: idc.value,
    phone: phone.value
  })

  isSending.value = false

  if (response.pin) {
    pin.value = true
  }

  console.log(response)
}
</script>

<template>
  <form-wrapper v-if="!isSending && !pin">
    <form-input
      id="idc"
      v-model="idc"
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
