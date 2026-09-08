<script setup>
const props = defineProps({
  error: { type: Object, required: true }
})

const { t } = useI18n()
useHead({ title: `${props.error.statusCode ?? ''} ${t('common.error')}`.trim() })
</script>

<template>
  <nuxt-layout>
    <form-wrapper>
      <h2>
        {{ error.statusCode }} {{ $t('common.error') }}
      </h2>
      <p aria-live="polite">
        {{ error.statusMessage || error.message }}
      </p>
      <p class="text-center">
        <a href="/">OAuth.ee</a>
      </p>
    </form-wrapper>
  </nuxt-layout>
</template>
