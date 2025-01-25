<script setup>
useHead({
  titleTemplate: (title) => title ? `${title} · OAuth.ee` : 'OAuth.ee'
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
