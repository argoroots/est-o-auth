<script setup>
definePageMeta({ middleware: ['check-query', 'check-provider'] })
useHead({ title: 'Phone' })

const { query } = useRoute()
const phone = ref(query.phone)
const code = ref(query.code)
const isSending = ref(false)
const isError = ref(false)
const isPhoneSent = ref(false)

if (phone.value && !code.value) onStartSession()
if (phone.value && code.value) onAuthenticate()

async function onStartSession () {
  if (!phone.value) return

  phone.value = phone.value.replace(/\D/g, '')

  if (phone.value.length <= 8) phone.value = '372' + phone.value

  phone.value = '+' + phone.value

  isSending.value = true

  const { data } = await useFetch('/api/phone', { query: { ...query, phone: phone.value } })

  isSending.value = false

  if (data.value.sent) isPhoneSent.value = true
}

async function onAuthenticate () {
  if (!phone.value?.trim()) return
  if (!code.value?.trim()) return

  isSending.value = true
  isError.value = false

  const { data } = await useFetch('/api/phone', {
    method: 'POST',
    body: {
      ...query,
      phone: phone.value,
      code: code.value
    }
  })

  if (data.value.url) {
    await navigateTo(data.value.url, { external: true })
  }
  else {
    isSending.value = false
    isPhoneSent.value = true
    isError.value = true
  }
}
</script>

<template>
  <form-wrapper v-if="!isSending">
    <template v-if="!isPhoneSent">
      <form-input
        id="phone"
        v-model="phone"
        type="tel"
        label="Phone"
        placeholder="+37200000000"
        autofocus
        @keypress.enter="onStartSession"
      />
      <form-button @click="onStartSession">
        Authenticate
      </form-button>
    </template>

    <template v-else>
      <h2>Check Your phone!</h2>
      <p>We sent a verification code to phone number {{ phone }}. Please enter it below.</p>
      <form-input
        id="code"
        v-model="code"
        label="Verification Code"
        placeholder="123ABC"
        autofocus
        @keypress.enter="onAuthenticate"
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
    </template>
  </form-wrapper>
</template>
