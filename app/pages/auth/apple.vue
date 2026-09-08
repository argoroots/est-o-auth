<script setup>
definePageMeta({ middleware: ['check-query', 'check-provider'] })
const { t } = useI18n()
const message = useErrorMessage()
useHead({ title: t('provider.apple') })

const { query } = useRoute()
const { data, error } = await useFetch('/api/apple', { query })
const errorText = computed(() => error.value ? message(error.value) : data.value?.url ? '' : t('common.somethingWrong'))

onMounted(async () => {
  if (data.value?.url) await navigateTo(data.value.url, { external: true })
})
</script>

<template>
  <form-wrapper>
    <p
      v-if="errorText"
      class="text-red-700"
      aria-live="polite"
    >
      {{ errorText }}
    </p>
    <template v-else>
      <p class="mt-4 text-center">
        {{ $t('common.redirecting', { provider: 'Apple' }) }}
      </p>
      <form-spinner />
    </template>
  </form-wrapper>
</template>
