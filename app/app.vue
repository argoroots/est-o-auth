<script setup>
useHead({
  titleTemplate: (title) => title ? `${title} · OAuth.ee` : 'OAuth.ee'
})

console.log('App.vue loaded');

</script>

<template>
  <nuxt-layout>
    <nuxt-page />
  </nuxt-layout>
</template>
