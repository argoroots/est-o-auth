<script setup>
// <html lang> from the active locale; SEO tags are pointless on auth pages
useHead(useLocaleHead({ seo: false }))

useHead({
  titleTemplate: (title) => title ? `${title} · OAuth.ee` : 'OAuth.ee'
})
</script>

<template>
  <nuxt-layout>
    <nuxt-page />
  </nuxt-layout>
</template>
