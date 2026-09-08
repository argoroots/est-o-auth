<script setup>
definePageMeta({ middleware: ['check-query', 'check-provider'] })
const { t } = useI18n()
useHead({ title: t('provider.id-card') })

const { query } = useRoute()
const { data: nonceData, error: nonceError, refresh } = await useFetch('/api/id-card', { query })
const isError = ref(!!nonceError.value)

// Sends the signed Web eID token for verification; success leaves for the client's redirect_uri
async function onAuthenticate (authResponse) {
  try {
    const data = await $fetch('/api/id-card', {
      method: 'POST',
      body: { ...query, ...authResponse, nonce: nonceData.value.nonce }
    })

    if (data.url) await navigateTo(data.url, { external: true })
  }
  catch {
    // Signature rejected, or the nonce expired while the card dialog was open
    isError.value = true
  }
}

// Fetches a fresh nonce; the web-eid component remounts and opens the card dialog again
async function onRetry () {
  await refresh()

  isError.value = !!nonceError.value
}
</script>

<template>
  <form-wrapper class="text-center">
    <template v-if="isError">
      <p
        class="text-red-700"
        aria-live="polite"
      >
        {{ $t('common.somethingWrong') }}
      </p>
      <form-button @click="onRetry">
        {{ $t('common.tryAgain') }}
      </form-button>
    </template>
    <web-eid
      v-else-if="nonceData"
      :nonce="nonceData.nonce"
      @authenticate="onAuthenticate"
    />
  </form-wrapper>
</template>
