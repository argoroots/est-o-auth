<script setup>
import backgroundBlobs from '@/components/BackgroundBlobs.vue'
import formWrapper from '@/components/FormWrapper.vue'
import ArrowRightIcon from '@/components/icons/SmartIdIcon.vue'
</script>

<template>
  <main>
    <background-blobs />
    <section>
      <h1>OAuth.ee <span>by Argo Roots</span></h1>
      <form-wrapper>
        <p class="text-center">
          Use Estonian ID-card, Mobile-ID, Smart-ID, E-mail or Phone as OAuth authentication provider.
        </p>
      </form-wrapper>
      <footer>
        <router-link to="/docs">
          Get Started <arrow-right-icon />
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
  @apply w-full;
  @apply md:w-80;
  @apply mx-6;
  @apply flex;
  @apply flex-col;
  @apply justify-start;
}

a {
  @apply w-36;
  @apply mx-auto;
  @apply py-2;
  @apply flex;
  @apply gap-x-1;
  @apply items-center;
  @apply justify-center;
  @apply rounded;
  @apply border;
  @apply border-white;
  @apply hover:no-underline;
  @apply hover:border-red-700;
}

a svg {
  @apply h-5 w-5;
}
</style>
