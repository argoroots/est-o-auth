<script setup>
definePageMeta({ middleware: ['check-query', 'check-provider'] })
useHead({ title: 'Mobile-ID' })

const { query } = useRoute()
const idcode = ref(query.idcode)
const phone = ref(query.phone)
const phoneInput = ref()
const isSending = ref(false)
const isError = ref(false)
const interval = ref()
const consent = ref(null)
const session = ref(null)

if (idcode.value && phone.value) onStartSession()

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

  if (!idcode.value || !phone.value) return

  const data = await $fetch('/api/mobile-id', { query: { ...query, idcode: idcode.value, phone: phone.value } })

  isSending.value = false

  if (!data.consent || !data.session) {
    isError.value = true
    return
  }

  consent.value = data.consent
  session.value = data.session

  interval.value = setInterval(async () => {
    await onAuthenticate()
  }, 5000)
}

async function onAuthenticate () {
  const data = await $fetch('/api/mobile-id', {
    method: 'POST',
    body: {
      ...query,
      idcode: idcode.value,
      session: session.value
    }
  })

  if (data.status === 'RUNNING') return

  clearInterval(interval.value)

  if (data.url) {
    await navigateTo(data.url, { external: true })
  }
  else {
    consent.value = null
    session.value = null

    isSending.value = false
    isError.value = true
  }
}
</script>

<template>
  <form-wrapper v-if="!isSending">
    <template v-if="!consent">
      <form-input
        id="idcode"
        v-model="idcode"
        type="tel"
        label="ID code"
        placeholder="38001085718"
        autofocus
        @blur="validateIdcode"
        @keypress.enter="() => phoneInput.focus()"
      />
      <form-input
        id="phone"
        ref="phoneInput"
        v-model="phone"
        type="tel"
        label="Phone"
        placeholder="+37200000000"
        @blur="validatePhone"
        @keypress.enter="onStartSession"
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
    </template>

    <template v-else>
      <p>
        Enter your Mobile-ID PIN1 on your phone, if you are convinced the control code shown on your device matches the one shown here.
      </p>
      <p class="consent">
        {{ consent }}
      </p>
    </template>
  </form-wrapper>
</template>

<style scoped>
.consent {
  @apply text-3xl;
  @apply text-red-700;
  @apply text-center;
}
</style>
