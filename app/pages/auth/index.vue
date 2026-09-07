<script setup>
import { IconApple, IconChat, IconEmail, IconGoogle, IconIdCard, IconMobileId, IconSmartId } from '#components'

definePageMeta({ middleware: ['check-query'] })

const { query } = useRoute()

const icons = {
  apple: IconApple,
  google: IconGoogle,
  'smart-id': IconSmartId,
  'mobile-id': IconMobileId,
  'id-card': IconIdCard,
  'e-mail': IconEmail,
  phone: IconChat
}

const methods = PROVIDER_IDS.map((id) => ({ id, icon: icons[id] }))

// Loaded by the check-query middleware
const client = useState('client')

const allowedMethods = computed(() => methods.filter((m) => client.value?.providers.includes(m.id)))
</script>

<template>
  <nav>
    <nuxt-link
      v-for="method in allowedMethods"
      :key="method.id"
      :to="{ path: `/auth/${method.id}`, query }"
    >
      <component :is="method.icon" />
      {{ $t(`provider.${method.id}`) }}
    </nuxt-link>
  </nav>
</template>

<style scoped>
@reference "~/assets/tailwind.css";

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
