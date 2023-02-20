<script setup>
import { useRoute } from 'vue-router'
import backgroundBlobs from '@/components/BackgroundBlobs.vue'

const { meta } = useRoute()
</script>

<template>
  <main>
    <background-blobs />
    <section>
      <h1>OAuth.ee <span>by Argo Roots</span></h1>
      <router-view />
      <footer>
        <p
          v-if="meta.description"
          class="text-center"
        >
          {{ meta.description }}
        </p>
      </footer>
    </section>
  </main>
</template>

<style scoped>
main {
  @apply min-h-screen;
  @apply w-screen;
  @apply flex;
  @apply justify-center;
  @apply overflow-hidden;
}

section {
  @apply relative;
  @apply md:w-80;
  @apply mx-6;
  @apply flex;
  @apply flex-col;
  @apply justify-start;
}
</style>
