<script setup>
definePageMeta({ middleware: ['check-query', 'check-provider'] })
const { t } = useI18n()
const message = useErrorMessage()
useHead({ title: t('provider.phone') })

const { query } = useRoute()
const phone = ref(query.phone)
const code = ref(query.code)
const isSending = ref(false)
const isSent = ref(false)
const errorText = ref('')
const wait = useCountdown()

// Opened with a prefilled number (and possibly a code)
if (phone.value && code.value) onAuthenticate()
else if (phone.value) onStartSession()

// Asks the server to text a code; a 429 starts the resend countdown
async function onStartSession () {
  phone.value = normalizePhone(phone.value)

  if (!phone.value || wait.seconds.value > 0) return

  isSending.value = true
  errorText.value = ''

  try {
    const data = await $fetch('/api/phone', { query: { ...query, phone: phone.value } })

    isSent.value = !!data.sent
  }
  catch (error) {
    if (error.statusCode === 429) wait.start(60)
    else errorText.value = message(error)
  }
  finally {
    isSending.value = false
  }
}

// Submits the code; success leaves for the client's redirect_uri
async function onAuthenticate () {
  if (!phone.value?.trim() || !code.value?.trim()) return

  isSending.value = true
  errorText.value = ''

  try {
    const data = await $fetch('/api/phone', {
      method: 'POST',
      body: { ...query, phone: phone.value, code: code.value }
    })

    if (data.url) return navigateTo(data.url, { external: true })

    errorText.value = t('common.somethingWrong')
  }
  catch (error) {
    errorText.value = message(error, 'code.invalid')
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
        v-if="errorText"
        class="text-red-700"
        aria-live="polite"
      >
        {{ errorText }}
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
        v-if="errorText"
        class="text-red-700"
        aria-live="polite"
      >
        {{ errorText }}
      </p>
      <form-button @click="onAuthenticate">
        {{ $t('common.authenticate') }}
      </form-button>
    </template>
  </form-wrapper>
</template>
