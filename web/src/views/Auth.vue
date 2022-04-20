<script setup>
import { useRoute } from 'vue-router'
import { ApplicationMobile, Email, SimCard } from '@vicons/carbon'
import SmartId from '@/components/SmartId.vue'

const route = useRoute()
const methods = (route.query?.methods || 'e-mail,smart-id,mobile-id,id-card').split(',')
</script>

<template>
  <div class="flex flex-col w-full border-t border-slate-100">
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
      <smart-id class="h-5 w-5" />
      Smart-ID
    </router-link>
    <router-link
      v-if="methods.includes('mobile-id')"
      to="/auth/mobile-id"
    >
      <application-mobile class="h-5 w-5" />
      Mobile-ID
    </router-link>
    <a
      v-if="methods.includes('id-card')"
      href="/auth/id-card"
    >
      <sim-card class="h-5 w-5" />
      ID-Card
    </a>
  </div>
</template>

<style scoped>
a {
  @apply flex items-center gap-x-3 py-4 px-8 border-b border-slate-100 hover:text-slate-900
}
</style>
