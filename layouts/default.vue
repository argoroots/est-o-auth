<script setup>
const { query } = useRoute()

const { data: client } = await useFetch('/api/client', { query })
</script>

<template>
  <main>
    <background-blobs />
    <section>
      <header>
        <h1>
          <nuxt-link :to="{ path: '/auth', query }">
            <h1>OAuth.ee <span>by Argo Roots</span></h1>
          </nuxt-link>
        </h1>
        <p
          v-if="client?.description"
          class="mt-8"
        >
          {{ client?.description }}
        </p>
      </header>

      <slot />

      <footer />
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
