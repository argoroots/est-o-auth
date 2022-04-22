<template>
  <div id="blobs">
    <div class="blob pink" />
    <div class="blob purple" />
    <div class="blob blue" />
  </div>
</template>

<style scoped>
#blobs {
  @apply relative;
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

.pink {
  @apply top-20;
  @apply -left-20;
  @apply bg-yellow-100;
}

.purple {
  @apply top-20;
  @apply left-10;
  @apply bg-red-100;
  @apply animation-delay-2000;
}

.blue {
  @apply top-0;
  @apply -left-10;
  @apply bg-orange-100;
  @apply animation-delay-4000;
}
</style>
