<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ApplicationMobile, Email, SimCard } from '@vicons/carbon'
import SmartIdIcon from '@/components/SmartIdIcon.vue'

const { query } = useRoute()
const queryMethods = (query.methods || 'e-mail,smart-id,mobile-id,id-card').split(',')

const methods = [
  {
    id: 'e-mail',
    label: 'E-mail',
    icon: Email,
    to: { path: '/auth/e-mail', query }
  },
  {
    id: 'smart-id',
    label: 'Smart-ID',
    icon: SmartIdIcon,
    to: { path: '/auth/smart-id', query }
  },
  {
    id: 'mobile-id',
    label: 'Mobile-ID',
    icon: ApplicationMobile,
    to: { path: '/auth/mobile-id', query }
  },
  {
    id: 'id-card',
    label: 'ID-Card',
    icon: SimCard,
    to: { path: '/auth/id-card', query }
  }
]

const allowedMethods = computed(() => methods.filter(m => queryMethods.includes(m.id)))
</script>

<template>
  <nav>
    <router-link
      v-for="(method, idx) in allowedMethods"
      :key="idx"
      :to="method.to"
    >
      <component :is="method.icon" />
      {{ method.label }}
    </router-link>
  </nav>
  <router-view />
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
  @apply text-stone-600;
  @apply hover:text-stone-900;
  @apply hover:no-underline;

}

svg {
  @apply h-5 w-5;
}
</style>
