<script setup>
defineProps({
  error: { type: Object, required: true }
})
</script>

<template>
  <NuxtLayout>
    <form-wrapper>
      <h2>
        {{ $t('common.error') }}
      </h2>
      <p>
        {{ error.message }}
      </p>
    </form-wrapper>
  </NuxtLayout>
</template>
