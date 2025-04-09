<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div id="form">
    <slot />
  </div>
</template>

<style scoped>
#form {
  @apply py-8;
  @apply px-6;
  @apply flex;
  @apply flex-col;
  @apply space-y-6;
  @apply bg-white;
}
</style>
