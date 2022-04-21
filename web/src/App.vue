<script setup>
import blobs from '@/components/Blobs.vue'
</script>

<template>
  <div class="container">
    <blobs />
    <div class="container-content">
      <h1>
        Auth-O-Matic
      </h1>
      <router-view />
      <footer />
    </div>
  </div>
</template>

<style scoped>
.container {
  @apply min-h-screen;
  @apply w-screen;
  @apply flex;
  @apply justify-center;
  @apply overflow-hidden;
}

.container-content {
  @apply relative;
  @apply md:w-80;
  @apply flex;
  @apply flex-col;
  @apply justify-start;
}
</style>
