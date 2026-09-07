<script setup>
const props = defineProps({
  error: { type: Object, required: true }
})

useHead({ title: `${props.error.statusCode ?? ''} ${useI18n().t('common.error')}`.trim() })
</script>

<template>
  <NuxtLayout>
    <form-wrapper>
      <h2>
        {{ error.statusCode }} {{ $t('common.error') }}
      </h2>
      <p>
        {{ error.statusMessage || error.message }}
      </p>
      <p class="text-center">
        <a href="/">OAuth.ee</a>
      </p>
    </form-wrapper>
  </NuxtLayout>
</template>
