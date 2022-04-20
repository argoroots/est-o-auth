<script setup>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
</script>

<template>
  <div class="h-screen w-screen flex justify-center">
    <div class="py-16 flex flex-col bg-white">
      <h1 class="px-8 font-thin text-4xl text-center ">
        Oauth.ee
      </h1>
      <div class="grow flex items-center">
        <router-view />
      </div>
    </div>
  </div>
</template>

<style>
html, body {
  @apply bg-slate-100;
  @apply text-slate-700;
}
</style>
