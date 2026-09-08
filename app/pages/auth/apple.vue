<script setup>
definePageMeta({ middleware: ['check-query', 'check-provider'] })
const { t } = useI18n()
useHead({ title: t('provider.apple') })

const { query } = useRoute()
const { data, error } = await useFetch('/api/apple', { query })

onMounted(async () => {
  if (data.value?.url) await navigateTo(data.value.url, { external: true })
})
</script>

<template>
  <form-wrapper>
    <p
      v-if="error || !data?.url"
      class="text-red-700"
      aria-live="polite"
    >
      {{ $t('common.somethingWrong') }}
    </p>
    <template v-else>
      <p class="mt-4 text-center">
        {{ $t('common.redirecting', { provider: 'Apple' }) }}
      </p>
      <form-spinner />
    </template>
  </form-wrapper>
</template>
