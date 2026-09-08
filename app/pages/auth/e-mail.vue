<script setup>
definePageMeta({ middleware: ['check-query', 'check-provider'] })
const { t } = useI18n()
useHead({ title: t('provider.e-mail') })

const { query } = useRoute()
const email = ref(query.email)
const code = ref(query.code)
const isSending = ref(false)
const isError = ref(false)
const isEmailSent = ref(false)
const waitSeconds = ref(0)
const waitInterval = ref()

if (email.value && !code.value) onStartSession()
if (email.value && code.value) onAuthenticate()

onUnmounted(() => clearInterval(waitInterval.value))

// Resend cooldown from the server (429): count it down and block the button meanwhile
function startWait (seconds) {
  waitSeconds.value = seconds
  clearInterval(waitInterval.value)
  waitInterval.value = setInterval(() => {
    waitSeconds.value -= 1

    if (waitSeconds.value <= 0) clearInterval(waitInterval.value)
  }, 1000)
}

async function onStartSession () {
  if (!email.value?.trim() || waitSeconds.value > 0) return

  isSending.value = true
  isError.value = false

  try {
    const data = await $fetch('/api/e-mail', { query: { ...query, email: email.value } })

    if (data.sent) isEmailSent.value = true
  }
  catch (error) {
    if (error.statusCode === 429) startWait(60)
    else isError.value = true
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
        v-else-if="waitSeconds > 0"
        class="text-red-700"
        aria-live="polite"
      >
        {{ $t('code.wait', { seconds: waitSeconds }) }}
      </p>
      <form-button
        :disabled="waitSeconds > 0"
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
