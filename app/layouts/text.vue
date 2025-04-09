<template>
  <main>
    <header>
      <h1>
        <nuxt-link to="/">
          <h1>OAuth.ee <span>by Argo Roots</span></h1>
        </nuxt-link>
      </h1>
    </header>
    <slot />
  </main>
</template>

<style scoped>
main {
  @apply max-w-3xl;
  @apply mx-auto;
  @apply mb-16;
  @apply px-8;
  @apply lg:px-0;
}
</style>
