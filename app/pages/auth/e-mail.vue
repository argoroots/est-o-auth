<script setup>
definePageMeta({ middleware: ['check-query', 'check-provider'] })
useHead({ title: useI18n().t('provider.e-mail') })

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

  try {
    const data = await $fetch('/api/e-mail', { query: { ...query, email: email.value } })

    if (data.sent) isEmailSent.value = true
  }
  catch {
    isError.value = true
  }

  isSending.value = false
}

async function onAuthenticate () {
  if (!email.value?.trim()) return
  if (!code.value?.trim()) return

  isSending.value = true
  isError.value = false

  try {
    const data = await $fetch('/api/e-mail', {
      method: 'POST',
      body: {
        ...query,
        email: email.value,
        code: code.value
      }
    })

    if (data.url) return navigateTo(data.url, { external: true })

    isError.value = true
  }
  catch {
    // Wrong or expired code is a 403 from the server
    isError.value = true
  }
  finally {
    isSending.value = false
  }
}
</script>

<template>
  <form-wrapper>
    <form-spinner v-if="isSending" />

    <template v-else-if="!isEmailSent">
      <form-input
        id="email"
        v-model="email"
        :label="$t('email.label')"
        type="email"
        placeholder="jaak-kristjan@jõeorg.ee"
        autofocus
        @keypress.enter="onStartSession"
      />
      <p
        v-if="isError"
        class="text-red-700"
      >
        {{ $t('common.somethingWrong') }}
      </p>
      <form-button @click="onStartSession">
        {{ $t('common.authenticate') }}
      </form-button>
    </template>

    <template v-else>
      <h2>{{ $t('email.checkInbox') }}</h2>
      <p>{{ $t('email.sent', { email }) }}</p>
      <form-input
        id="code"
        v-model="code"
        :label="$t('code.label')"
        placeholder="123ABC"
        autofocus
        @keypress.enter="onAuthenticate"
      />
      <p
        v-if="isError"
        class="text-red-700"
      >
        {{ $t('code.invalid') }}
      </p>
      <form-button @click="onAuthenticate">
        {{ $t('common.authenticate') }}
      </form-button>
    </template>
  </form-wrapper>
</template>
