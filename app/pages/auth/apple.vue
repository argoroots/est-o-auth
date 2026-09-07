<script setup>
definePageMeta({ middleware: ['check-query', 'check-provider'] })
useHead({ title: useI18n().t('provider.apple') })

const { query } = useRoute()
const { data } = await useFetch('/api/apple', { query })

onMounted(async () => await navigateTo(data.value.url, { external: true }))
</script>

<template>
  <form-wrapper>
    <p class="mt-4 text-center">
      {{ $t('common.redirecting', { provider: 'Apple' }) }}
    </p>
    <form-spinner />
  </form-wrapper>
</template>
