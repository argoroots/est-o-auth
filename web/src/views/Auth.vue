<script setup>
import { useRoute } from 'vue-router'
import { ApplicationMobile, Email, SimCard } from '@vicons/carbon'
import SmartIdIcon from '@/components/SmartIdIcon.vue'

const route = useRoute()
const methods = (route.query?.methods || 'e-mail,smart-id,mobile-id,id-card').split(',')
</script>

<template>
  <nav>
    <router-link
      v-if="methods.includes('e-mail')"
      to="/auth/e-mail"
    >
      <email class="h-5 w-5" />
      E-mail
    </router-link>
    <router-link
      v-if="methods.includes('smart-id')"
      to="/auth/smart-id"
    >
      <smart-id-icon class="h-5 w-5" />
      Smart-ID
    </router-link>
    <router-link
      v-if="methods.includes('mobile-id')"
      to="/auth/mobile-id"
    >
      <application-mobile class="h-5 w-5" />
      Mobile-ID
    </router-link>
    <router-link
      v-if="methods.includes('id-card')"
      to="/auth/id-card"
    >
      <sim-card class="h-5 w-5" />
      ID-Card
    </router-link>
  </nav>
</template>

<style scoped>
nav {
  @apply flex;
  @apply flex-col;
  @apply w-full;
}

a {
  @apply mb-0.5;
  @apply py-4;
  @apply px-8;
  @apply flex;
  @apply gap-x-3;
  @apply items-center;
  @apply bg-white;
  @apply hover:text-slate-900;
}
</style>
