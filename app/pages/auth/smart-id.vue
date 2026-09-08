<script setup>
definePageMeta({ middleware: ['check-query', 'check-provider'] })
const { t } = useI18n()
useHead({ title: t('provider.smart-id') })

const { query } = useRoute()
const session = ref(null)
const qrUrl = ref(null)
const deviceLinkUrl = ref(null)
const isError = ref(false)

const qrInterval = ref()
const pollInterval = ref()

onMounted(startSession)

onUnmounted(stopPolling)

function stopPolling () {
  clearInterval(qrInterval.value)
  clearInterval(pollInterval.value)
}

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

    stopPolling()

    if (data.url) {
      await navigateTo(data.url, { external: true })
    }
    else {
      isError.value = true
    }
  }
  catch {
    stopPolling()

    isError.value = true
  }
}

// Stop waiting and return to the method chooser; the SK session simply expires on its own
async function onCancel () {
  stopPolling()

  await navigateTo({ path: '/auth', query })
}
</script>

<template>
  <form-wrapper>
    <template v-if="isError">
      <p
        class="text-red-700"
        aria-live="polite"
      >
        {{ $t('common.somethingWrong') }}
      </p>
    </template>

    <template v-else-if="qrUrl">
      <p>
        {{ $t('smartId.scan') }}
      </p>
      <a
        :href="deviceLinkUrl"
        class="mx-auto block"
      >
        <qr-code :url="qrUrl" />
      </a>
      <p class="text-center text-sm text-gray-500">
        {{ $t('smartId.keepOpen') }}
      </p>
      <form-button @click="onCancel">
        {{ $t('common.cancel') }}
      </form-button>
    </template>

    <template v-else>
      <form-spinner />
      <p class="text-center text-gray-500">
        {{ $t('smartId.starting') }}
      </p>
    </template>
  </form-wrapper>
</template>
