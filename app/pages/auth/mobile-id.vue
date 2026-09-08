<script setup>
definePageMeta({ middleware: ['check-query', 'check-provider'] })
const { t } = useI18n()
useHead({ title: t('provider.mobile-id') })

const { query } = useRoute()
const idcode = ref(query.idcode)
const phone = ref(query.phone)
const phoneInput = ref()
const isSending = ref(false)
const isError = ref(false)
const consent = ref(null)
const session = ref(null)

let stopPoll

if (idcode.value && phone.value) onStartSession()

// Stop polling if the user navigates away mid-authentication
onUnmounted(stopPolling)

function stopPolling () {
  stopPoll?.()
  stopPoll = undefined
}

function validateIdcode () {
  if (!idcode.value) return

  idcode.value = idcode.value.replace(/\D/g, '')
}

function validatePhone () {
  if (!phone.value) return

  phone.value = phone.value.replace(/\D/g, '')

  if (phone.value.length <= 8) phone.value = '372' + phone.value

  phone.value = '+' + phone.value
}

async function onStartSession () {
  validateIdcode()
  validatePhone()

  if (!idcode.value || !phone.value || isSending.value) return

  isSending.value = true
  isError.value = false

  try {
    const data = await $fetch('/api/mobile-id', { query: { ...query, idcode: idcode.value, phone: phone.value } })

    consent.value = data.consent
    session.value = data.session
    stopPoll = startPolling(onAuthenticate, 5000)
  }
  catch {
    isError.value = true
  }
  finally {
    isSending.value = false
  }
}

async function onAuthenticate () {
  try {
    const data = await $fetch('/api/mobile-id', {
      method: 'POST',
      body: {
        ...query,
        idcode: idcode.value,
        session: session.value
      }
    })

    if (data.status === 'RUNNING') return

    stopPolling()

    if (data.url) return navigateTo(data.url, { external: true })
  }
  catch {
    stopPolling()
  }

  // Cancelled, timed out, or failed: back to the form with an error
  consent.value = null
  session.value = null
  isError.value = true
}

// Stop waiting for the phone and return to the form; the SK session simply expires on its own
function onCancel () {
  stopPolling()
  consent.value = null
  session.value = null
}
</script>

<template>
  <form-wrapper>
    <form-spinner v-if="isSending" />

    <template v-else-if="!consent">
      <form-input
        id="idcode"
        v-model="idcode"
        type="text"
        inputmode="numeric"
        :label="$t('mobileId.idcode')"
        placeholder="38001085718"
        maxlength="11"
        autofocus
        @blur="validateIdcode"
        @keydown.enter="phoneInput?.focus()"
      />
      <form-input
        id="phone"
        ref="phoneInput"
        v-model="phone"
        type="tel"
        :label="$t('phone.label')"
        placeholder="+37200000000"
        autocomplete="tel"
        @blur="validatePhone"
        @keydown.enter="onStartSession"
      />
      <p
        v-if="isError"
        class="text-red-700"
        aria-live="polite"
      >
        {{ $t('mobileId.checkDetails') }}
      </p>
      <form-button @click="onStartSession">
        {{ $t('common.authenticate') }}
      </form-button>
    </template>

    <template v-else>
      <p>
        {{ $t('mobileId.enterPin') }}
      </p>
      <p
        class="consent"
        aria-live="polite"
      >
        {{ consent }}
      </p>
      <form-button @click="onCancel">
        {{ $t('common.cancel') }}
      </form-button>
    </template>
  </form-wrapper>
</template>

<style scoped>
@reference "~/assets/tailwind.css";

.consent {
  @apply text-3xl;
  @apply text-red-700;
  @apply text-center;
}
</style>
