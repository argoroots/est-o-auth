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

// Opened with prefilled details: start right away
if (idcode.value && phone.value) onStartSession()

onUnmounted(stopPolling)

// Stops the status poll, if one is running
function stopPolling () {
  stopPoll?.()
  stopPoll = undefined
}

// Cleans the ID code field
function onIdcodeBlur () {
  idcode.value = normalizeIdcode(idcode.value)
}

// Cleans the phone field
function onPhoneBlur () {
  phone.value = normalizePhone(phone.value)
}

// Starts the SK session, shows the control code and begins polling
async function onStartSession () {
  onIdcodeBlur()
  onPhoneBlur()

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

// One status poll; success leaves for the client's redirect_uri, anything else returns to the form with an error
async function onAuthenticate () {
  try {
    const data = await $fetch('/api/mobile-id', {
      method: 'POST',
      body: { ...query, idcode: idcode.value, session: session.value }
    })

    if (data.status === 'RUNNING') return

    stopPolling()

    if (data.url) return navigateTo(data.url, { external: true })
  }
  catch {
    stopPolling()
  }

  consent.value = null
  session.value = null
  isError.value = true
}

// Stops waiting for the phone and returns to the form; the SK session expires on its own
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
        @blur="onIdcodeBlur"
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
        @blur="onPhoneBlur"
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
