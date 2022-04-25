<script setup>
import backgroundBlobs from '@/components/BackgroundBlobs.vue'
</script>

<template>
  <div id="main">
    <background-blobs />
    <div id="content">
      <h1>Auth-O-Matic</h1>
      <router-view />
      <footer />
    </div>
  </div>
</template>

<style scoped>
#main {
  @apply min-h-screen;
  @apply w-screen;
  @apply flex;
  @apply justify-center;
  @apply overflow-hidden;
}

#content {
  @apply relative;
  @apply md:w-80;
  @apply mx-6;
  @apply flex;
  @apply flex-col;
  @apply justify-start;
}
</style>
