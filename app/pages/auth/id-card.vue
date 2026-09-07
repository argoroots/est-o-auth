<script setup>
definePageMeta({ middleware: ['check-query', 'check-provider'] })
useHead({ title: useI18n().t('provider.id-card') })

const { query } = useRoute()

const { data: nonceData, error: nonceError } = await useFetch('/api/id-card', { query })
const isError = ref(!!nonceError.value)

async function onAuthenticate (authResponse) {
  try {
    const data = await $fetch('/api/id-card', {
      method: 'POST',
      body: {
        ...query,
        ...authResponse,
        nonce: nonceData.value.nonce
      }
    })

    if (data.url) await navigateTo(data.url, { external: true })
  }
  catch {
    isError.value = true
  }
}
</script>

<template>
  <form-wrapper class="text-center">
    <p
      v-if="isError"
      class="text-red-700"
    >
      {{ $t('common.somethingWrong') }}
    </p>
    <web-eid
      v-else-if="nonceData"
      :nonce="nonceData.nonce"
      @authenticate="onAuthenticate"
    />
  </form-wrapper>
</template>
