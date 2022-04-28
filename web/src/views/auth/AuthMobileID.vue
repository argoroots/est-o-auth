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
const isError = ref(false)
const interval = ref()
const consent = ref(null)
const session = ref(null)

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

  if (!response.consent || !response.session) {
    isError.value = true
    return
  }

  consent.value = response.consent
  session.value = response.session

  interval.value = setInterval(async () => {
    await onAuthenticate()
  }, 5000)
}

async function onAuthenticate () {
  const response = await post('mobile-id/code', {
    idcode: idcode.value,
    session: session.value
  })

  if (response.status === 'RUNNING') {
    return
  }

  clearInterval(interval.value)

  if (response.redirect) {
    window.location.href = response.redirect
  } else {
    consent.value = null
    session.value = null

    isSending.value = false
    isError.value = true

    console.log(response)
  }
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
    <p
      v-if="isError"
      class="text-red-700"
    >
      Something is not right! Check ID code and Phone.
    </p>
    <form-button @click="onStartSession">
      Authenticate
    </form-button>
  </form-wrapper>
  <form-wrapper v-if="!isSending && consent">
    <p>
      Enter your Mobile-ID PIN1 on your phone, if you are convinced the control code shown on your device matches the one shown here.
    </p>
    <p class="consent">
      {{ consent }}
    </p>
  </form-wrapper>
</template>

<style scoped>
.consent {
  @apply text-3xl;
  @apply text-red-700;
  @apply text-center;
}
</style>
