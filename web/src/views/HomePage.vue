<script setup>
import backgroundBlobs from '@/components/BackgroundBlobs.vue'
import formWrapper from '@/components/FormWrapper.vue'
</script>

<template>
  <main>
    <background-blobs />
    <section>
      <h1>OAuth.ee <span>by Argo Roots</span></h1>
      <form-wrapper>
        <p class="text-center">
          Use Estonian ID-card, Mobile-ID, Smart-ID or E-mail as OAuth authentication provider.
        </p>
      </form-wrapper>
      <footer>
        <router-link to="/docs">
          Documentation
        </router-link>
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
