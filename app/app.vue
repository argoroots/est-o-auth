<script setup>
// Sets <html lang> from the active locale; SEO tags (hreflang, canonical) are pointless on auth pages
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
