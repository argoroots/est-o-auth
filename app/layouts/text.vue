<template>
  <main>
    <header>
      <h1>
        <nuxt-link to="/">
          OAuth.ee <span>by Argo Roots</span>
        </nuxt-link>
      </h1>
    </header>
    <slot />
  </main>
</template>

<style scoped>
@reference "~/assets/tailwind.css";

main {
  @apply max-w-3xl;
  @apply mx-auto;
  @apply mb-16;
  @apply px-8;
  @apply lg:px-0;
}
</style>
