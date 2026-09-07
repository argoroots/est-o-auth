<script setup>
definePageMeta({ middleware: ['check-query', 'check-provider'] })
useHead({ title: useI18n().t('provider.google') })

const { query } = useRoute()
const { data } = await useFetch('/api/google', { query })

onMounted(async () => await navigateTo(data.value.url, { external: true }))
</script>

<template>
  <form-wrapper>
    <p class="mt-4 text-center">
      {{ $t('common.redirecting', { provider: 'Google' }) }}
    </p>
    <form-spinner />
  </form-wrapper>
</template>
