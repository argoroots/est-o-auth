<script setup>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
</script>

<template>
  <div class="min-h-screen w-screen flex justify-center overflow-hidden">
    <div class="relative mt-24">
      <div class="absolute top-20 -left-20 h-96 w-96 animate-blob rounded-full bg-pink-200 opacity-70 mix-blend-multiply blur-2xl filter" />
      <div class="animation-delay-2000 absolute top-20 left-10 h-96 w-96 animate-blob rounded-full bg-purple-200 opacity-70 mix-blend-multiply blur-2xl filter" />
      <div class="animation-delay-4000 absolute top-0 -left-10 h-96 w-96 animate-blob rounded-full bg-blue-200 opacity-70 mix-blend-multiply blur-2xl filter" />
    </div>
    <div class="relative w-full md:w-80 mx-6 py-16 flex flex-col space-y-16 justify-start bg-white">
      <h1 class="mx-8 font-thin text-4xl text-center">
        Auth-O-Matic
      </h1>
      <router-view />
    </div>
  </div>
</template>

<style>
html {
  @apply bg-slate-100;
}

body {
  @apply bg-slate-100;
  @apply text-slate-500;
}
</style>
