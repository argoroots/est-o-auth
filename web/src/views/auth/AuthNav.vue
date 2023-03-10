<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppleIcon from '@/components/icons/AppleIcon.vue'
import ChatIcon from '@/components/icons/ChatIcon.vue'
import EmailIcon from '@/components/icons/EmailIcon.vue'
import GoogleIcon from '@/components/icons/GoogleIcon.vue'
import IdCardIcon from '@/components/icons/IdCardIcon.vue'
import MobileIdIcon from '@/components/icons/MobileIdIcon.vue'
import SmartIdIcon from '@/components/icons/SmartIdIcon.vue'

const { query, meta } = useRoute()

const methods = [
  {
    id: 'apple',
    label: 'Apple',
    icon: AppleIcon,
    to: { path: '/auth/apple', query }
  },
  {
    id: 'google',
    label: 'Google',
    icon: GoogleIcon,
    to: { path: '/auth/google', query }
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
    icon: MobileIdIcon,
    to: { path: '/auth/mobile-id', query }
  },
  {
    id: 'id-card',
    label: 'ID-Card',
    icon: IdCardIcon,
    to: { path: '/auth/id-card', query }
  },
  {
    id: 'web-eid',
    label: 'Web eID',
    description: 'beta',
    icon: IdCardIcon,
    to: { path: '/auth/web-eid', query }
  },
  {
    id: 'e-mail',
    label: 'E-mail',
    icon: EmailIcon,
    to: { path: '/auth/e-mail', query }
  },
  {
    id: 'phone',
    label: 'Phone',
    icon: ChatIcon,
    to: { path: '/auth/phone', query }
  }
]

const allowedMethods = computed(() => methods.filter(m => meta.providers.includes(m.id)))
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
      <sup v-if="method.description">
        {{ method.description }}
      </sup>
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
