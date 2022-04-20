<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
const methods = (route.query?.methods || 'e-mail,smart-id,mobile-id,id-card').split(',')
</script>

<template>
  <div class="flex flex-col w-full border-t border-slate-100">
    <router-link
      v-if="methods.includes('e-mail')"
      to="/auth/e-mail"
    >
      E-mail
    </router-link>
    <router-link
      v-if="methods.includes('smart-id')"
      to="/auth/smart-id"
    >
      Smart-ID
    </router-link>
    <router-link
      v-if="methods.includes('mobile-id')"
      to="/auth/mobile-id"
    >
      Mobile-ID
    </router-link>
    <a
      v-if="methods.includes('id-card')"
      href="/auth/id-card"
    >
      ID-Card
    </a>
  </div>
</template>

<style scoped>
a {
  @apply block py-4 px-6 border-b border-slate-100 hover:text-slate-900
}
</style>
