<template>
  <div id="blobs">
    <div class="blob yellow" />
    <div class="blob red" />
    <div class="blob orange" />
  </div>
</template>

<style scoped>
#blobs {
  @apply relative;
  @apply top-20;
}

.blob {
  @apply absolute;
  @apply h-96;
  @apply w-96;
  @apply rounded-full;
  @apply animate-blob;
  @apply filter;
  @apply blur-2xl;
  @apply mix-blend-multiply;
  @apply opacity-70;
}

.yellow {
  @apply top-20;
  @apply -left-20;
  @apply bg-yellow-100;
}

.red {
  @apply top-20;
  @apply left-10;
  @apply bg-red-100;
}

.orange {
  @apply top-0;
  @apply -left-10;
  @apply bg-orange-100;
}
</style>
