<script setup>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
</script>

<template>
  <div class="h-screen w-screen flex justify-center">
    <div class="flex flex-col items-center justify-center bg-white">
      <img
        class="w-32 h-32 my-16 mx-8"
        src="@/assets/oauth-logo.svg"
        alt="Oauth logo"
      >
      <div class="grow w-full">
        <router-view />
      </div>
    </div>
  </div>
</template>

<style>
html, body {
  @apply bg-slate-100;
  @apply text-slate-600;
}
</style>
