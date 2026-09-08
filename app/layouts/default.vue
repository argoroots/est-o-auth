<script setup>
const route = useRoute()

// Loaded by the check-query middleware on auth pages; absent elsewhere
const client = useState('client')

// Layouts persist across navigations, so read the query through the reactive route each time
const homeLink = computed(() => route.query.client_id ? { path: '/auth', query: route.query } : '/')
</script>

<template>
  <main>
    <background-blobs />
    <section>
      <header>
        <h1>
          <nuxt-link :to="homeLink">
            OAuth.ee <span>by Argo Roots</span>
          </nuxt-link>
        </h1>
        <p
          v-if="client?.description"
          class="mt-8"
        >
          {{ client.description }}
        </p>
      </header>

      <slot />

      <footer class="flex items-end justify-center pb-4 text-xs">
        <a
          href="/terms"
          target="_blank"
        >{{ $t('common.terms') }}</a>
      </footer>
    </section>
  </main>
</template>

<style scoped>
@reference "~/assets/tailwind.css";

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
</style>
