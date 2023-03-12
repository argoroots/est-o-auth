<script setup>
import { IconApple, IconChat, IconEmail, IconGoogle, IconIdCard, IconMobileId, IconSmartId } from '#components'

definePageMeta({ middleware: ['check-query'] })

const { query } = useRoute()

const methods = [
  { id: 'apple', label: 'Apple', icon: IconApple },
  { id: 'google', label: 'Google', icon: IconGoogle },
  { id: 'smart-id', label: 'Smart-ID', icon: IconSmartId },
  { id: 'mobile-id', label: 'Mobile-ID', icon: IconMobileId },
  { id: 'id-card', label: 'ID-Card', icon: IconIdCard },
  { id: 'e-mail', label: 'E-mail', icon: IconEmail },
  { id: 'phone', label: 'Phone', icon: IconChat }
]

const { data: client } = await useFetch('/api/client', { query })

if (!client.value) throw createError({ statusCode: 400, statusMessage: 'The client ID (client_id) in the request do not match a registered client ID!' })

const allowedMethods = computed(() => methods.filter(m => client.value?.providers.includes(m.id)))
</script>

<template>
  <nav>
    <nuxt-link
      v-for="method in allowedMethods"
      :key="method.id"
      :to="{ path: `/auth/${method.id}`, query }"
    >
      <component :is="method.icon" />
      {{ method.label }}
    </nuxt-link>
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
  @apply text-stone-600;
  @apply hover:text-stone-900;
  @apply hover:no-underline;

}

svg {
  @apply h-5 w-5;
}
</style>
