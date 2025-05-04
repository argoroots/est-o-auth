<script setup>
definePageMeta({ middleware: ['check-query', 'check-provider'] })
useHead({ title: 'Smart-ID' })

const { query } = useRoute()
const idcode = ref(query.idcode)
const isSending = ref(false)
const isError = ref(false)
const interval = ref()
const consent = ref(null)
const session = ref(null)

if (idcode.value) onStartSession()

function validateIdcode () {
  if (!idcode.value) return

  idcode.value = idcode.value.replace(/\D/g, '')
}

async function onStartSession () {
  validateIdcode()

  if (!idcode.value) return

  const data = await $fetch('/api/smart-id', { query: { ...query, idcode: idcode.value } })

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
  const data = await $fetch('/api/smart-id', {
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
        @keypress.enter="onStartSession"
      />
      <p
        v-if="isError"
        class="text-red-700"
      >
        Something is not right! Check ID code.
      </p>
      <form-button @click="onStartSession">
        Authenticate
      </form-button>
    </template>

    <template v-else>
      <p>
        Enter your Smart-ID PIN1 on your device, if you are convinced the control code shown on your device matches the one shown here.
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
