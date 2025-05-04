<script setup>
definePageMeta({ middleware: ['check-query', 'check-provider'] })
useHead({ title: 'E-mail' })

const { query } = useRoute()
const email = ref(query.email)
const code = ref(query.code)
const isSending = ref(false)
const isError = ref(false)
const isEmailSent = ref(false)

if (email.value && !code.value) onStartSession()
if (email.value && code.value) onAuthenticate()

async function onStartSession () {
  if (!email.value?.trim()) return

  isSending.value = true

  const data = await $fetch('/api/e-mail', { query: { ...query, email: email.value } })

  isSending.value = false

  if (data.sent) isEmailSent.value = true
}

async function onAuthenticate () {
  if (!email.value?.trim()) return
  if (!code.value?.trim()) return

  isSending.value = true
  isError.value = false

  const data = await $fetch('/api/e-mail', {
    method: 'POST',
    body: {
      ...query,
      email: email.value,
      code: code.value
    }
  })

  if (data.url) {
    await navigateTo(data.url, { external: true })
  }
  else {
    isSending.value = false
    isEmailSent.value = true
    isError.value = true
  }
}
</script>

<template>
  <form-wrapper v-if="!isSending">
    <template v-if="!isEmailSent">
      <form-input
        id="email"
        v-model="email"
        label="Email address"
        type="email"
        placeholder="jaak-kristjan@jõeorg.ee"
        autofocus
        @keypress.enter="onStartSession"
      />
      <form-button @click="onStartSession">
        Authenticate
      </form-button>
    </template>

    <template v-else>
      <h2>Check Your inbox!</h2>
      <p>We sent a verification code to e-mail address {{ email }}. Please enter it below or click a link in e-mail.</p>
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
