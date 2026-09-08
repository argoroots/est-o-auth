<script setup>
definePageMeta({ middleware: ['check-query', 'check-provider'] })
const { t } = useI18n()
useHead({ title: t('provider.phone') })

const { query } = useRoute()
const phone = ref(query.phone)
const code = ref(query.code)
const isSending = ref(false)
const isError = ref(false)
const isPhoneSent = ref(false)
const waitSeconds = ref(0)
const waitInterval = ref()

if (phone.value && !code.value) onStartSession()
if (phone.value && code.value) onAuthenticate()

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
  if (!phone.value || waitSeconds.value > 0) return

  phone.value = phone.value.replace(/\D/g, '')

  if (phone.value.length <= 8) phone.value = '372' + phone.value

  phone.value = '+' + phone.value

  isSending.value = true
  isError.value = false

  try {
    const data = await $fetch('/api/phone', { query: { ...query, phone: phone.value } })

    if (data.sent) isPhoneSent.value = true
  }
  catch (error) {
    if (error.statusCode === 429) startWait(60)
    else isError.value = true
  }

  isSending.value = false
}

async function onAuthenticate () {
  if (!phone.value?.trim()) return
  if (!code.value?.trim()) return

  isSending.value = true
  isError.value = false

  try {
    const data = await $fetch('/api/phone', {
      method: 'POST',
      body: {
        ...query,
        phone: phone.value,
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

    <template v-else-if="!isPhoneSent">
      <form-input
        id="phone"
        v-model="phone"
        type="tel"
        :label="$t('phone.label')"
        placeholder="+37200000000"
        autocomplete="tel"
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
      <h2>{{ $t('phone.checkPhone') }}</h2>
      <p>{{ $t('phone.sent', { phone }) }}</p>
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
