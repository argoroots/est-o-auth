<script setup>
definePageMeta({ middleware: ['check-query', 'check-provider'] })
const { t } = useI18n()
useHead({ title: t('provider.e-mail') })

const { query } = useRoute()
const email = ref(query.email)
const code = ref(query.code)
const isSending = ref(false)
const isError = ref(false)
const isSent = ref(false)
const wait = useCountdown()

// Opened from the magic link (email and code in the query) or with a prefilled address
if (email.value && code.value) onAuthenticate()
else if (email.value) onStartSession()

// Asks the server to mail a code; a 429 starts the resend countdown
async function onStartSession () {
  if (!email.value?.trim() || wait.seconds.value > 0) return

  isSending.value = true
  isError.value = false

  try {
    const data = await $fetch('/api/e-mail', { query: { ...query, email: email.value } })

    isSent.value = !!data.sent
  }
  catch (error) {
    if (error.statusCode === 429) wait.start(60)
    else isError.value = true
  }
  finally {
    isSending.value = false
  }
}

// Submits the code; success leaves for the client's redirect_uri
async function onAuthenticate () {
  if (!email.value?.trim() || !code.value?.trim()) return

  isSending.value = true
  isError.value = false

  try {
    const data = await $fetch('/api/e-mail', {
      method: 'POST',
      body: { ...query, email: email.value, code: code.value }
    })

    if (data.url) return navigateTo(data.url, { external: true })

    isError.value = true
  }
  catch {
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

    <template v-else-if="!isSent">
      <form-input
        id="email"
        v-model="email"
        :label="$t('email.label')"
        type="email"
        placeholder="jaak-kristjan@jõeorg.ee"
        autocomplete="email"
        autofocus
        @keydown.enter="onStartSession"
      />
      <p
        v-if="isError"
        class="text-red-700"
        aria-live="polite"
      >
        {{ $t('common.somethingWrong') }}
      </p>
      <p
        v-else-if="wait.seconds.value > 0"
        class="text-red-700"
        aria-live="polite"
      >
        {{ $t('code.wait', { seconds: wait.seconds.value }) }}
      </p>
      <form-button
        :disabled="wait.seconds.value > 0"
        @click="onStartSession"
      >
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
        placeholder="123456"
        inputmode="numeric"
        autocomplete="one-time-code"
        maxlength="6"
        autofocus
        @keydown.enter="onAuthenticate"
      />
      <p
        v-if="isError"
        class="text-red-700"
        aria-live="polite"
      >
        {{ $t('code.invalid') }}
      </p>
      <form-button @click="onAuthenticate">
        {{ $t('common.authenticate') }}
      </form-button>
    </template>
  </form-wrapper>
</template>
