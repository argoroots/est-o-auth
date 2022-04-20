<script setup>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
</script>

<template>
  <div class="min-h-screen w-screen flex justify-center">
    <div class="w-full md:w-80 mx-6 py-16 flex flex-col space-y-16 justify-start bg-white">
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
