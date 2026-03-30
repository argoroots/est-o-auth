<script setup>
definePageMeta({ middleware: ['check-query', 'check-provider'] })
useHead({ title: 'Smart-ID' })

const { query } = useRoute()
const session = ref(null)
const qrUrl = ref(null)
const deviceLinkUrl = ref(null)
const isError = ref(false)

const qrInterval = ref()
const pollInterval = ref()

onMounted(startSession)

onUnmounted(() => {
  clearInterval(qrInterval.value)
  clearInterval(pollInterval.value)
})

async function startSession () {
  try {
    const data = await $fetch('/api/smart-id', { query })

    if (!data.session) {
      isError.value = true
      return
    }

    session.value = data.session

    await refreshQR()

    qrInterval.value = setInterval(refreshQR, 1000)
    pollInterval.value = setInterval(pollStatus, 5000)
  }
  catch {
    isError.value = true
  }
}

async function refreshQR () {
  try {
    const data = await $fetch('/api/smart-id-link', { query: { session: session.value } })
    qrUrl.value = data.qrUrl
    deviceLinkUrl.value = data.deviceLinkUrl
  }
  catch {
    // session may have expired — let poll handle the error state
  }
}

async function pollStatus () {
  try {
    const data = await $fetch('/api/smart-id', {
      method: 'POST',
      body: { ...query, session: session.value }
    })

    if (data.status === 'RUNNING') return

    clearInterval(qrInterval.value)
    clearInterval(pollInterval.value)

    if (data.url) {
      await navigateTo(data.url, { external: true })
    }
    else {
      isError.value = true
    }
  }
  catch {
    clearInterval(qrInterval.value)
    clearInterval(pollInterval.value)

    isError.value = true
  }
}
</script>

<template>
  <form-wrapper>
    <template v-if="isError">
      <p class="text-red-700">
        Something went wrong. Please try again.
      </p>
    </template>

    <template v-else-if="qrUrl">
      <p>
        Open the Smart-ID app on your phone and scan the QR code, or tap the code to open Smart-ID directly on this device. Keep this page open until authentication is complete.
      </p>
      <a
        :href="deviceLinkUrl"
        class="mx-auto block"
      >
        <qr-code :url="qrUrl" />
      </a>
    </template>

    <template v-else>
      <p class="text-center text-gray-500">
        Starting Smart-ID session…
      </p>
    </template>
  </form-wrapper>
</template>
