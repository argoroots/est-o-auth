<script setup>
definePageMeta({ middleware: ['check-query', 'check-provider'] })
const { t } = useI18n()
useHead({ title: t('provider.smart-id') })

const { query } = useRoute()
const session = ref(null)
const qrUrl = ref(null)
const deviceLinkUrl = ref(null)
const isError = ref(false)

// QR links come in batches of one per second; the page steps through them locally
let qrUrls = []
let stopQr
let stopPoll

onMounted(async () => {
  document.addEventListener('visibilitychange', onVisibilityChange)

  await startSession()
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  stopPolling()
})

function startPollingLoops () {
  stopPolling()
  stopQr = startPolling(nextQr, 1000)
  stopPoll = startPolling(pollStatus, 5000)
}

function stopPolling () {
  stopQr?.()
  stopPoll?.()
  stopQr = stopPoll = undefined
}

// Nobody scans a QR code in a background tab; pause there and pick up again when the tab returns
function onVisibilityChange () {
  if (!session.value || isError.value) return

  if (document.hidden) stopPolling()
  else startPollingLoops()
}

async function startSession () {
  try {
    const data = await $fetch('/api/smart-id', { query })

    if (!data.session) {
      isError.value = true
      return
    }

    session.value = data.session

    startPollingLoops()
  }
  catch {
    isError.value = true
  }
}

// Shows the next QR link from the batch, fetching a new batch when this one runs out
async function nextQr () {
  if (qrUrls.length === 0) {
    try {
      const data = await $fetch('/api/smart-id-link', { query: { session: session.value } })

      qrUrls = data.qrUrls
      deviceLinkUrl.value = data.deviceLinkUrl
    }
    catch {
      // session may have expired — let poll handle the error state
      return
    }
  }

  qrUrl.value = qrUrls.shift()
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
