<script setup>
definePageMeta({ middleware: ['check-query', 'check-provider'] })
useHead({ title: 'ID-Card' })

const { query } = useRoute()

const { data: nonceData } = await useFetch('/api/id-card', { query })

async function onAuthenticate (authResponse) {
  const data = await $fetch('/api/id-card', {
    method: 'POST',
    body: {
      ...query,
      ...authResponse
    }
  })

  if (data.url) await navigateTo(data.url, { external: true })
}
</script>

<template>
  <form-wrapper class="text-center">
    <web-eid
      v-if="nonceData"
      :nonce="nonceData.nonce"
      @authenticate="onAuthenticate"
    />
  </form-wrapper>
</template>
