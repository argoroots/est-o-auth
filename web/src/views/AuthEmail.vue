<script setup>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
</script>

<template>
  <div class="p-4">
    <div class="relative">
      <input
        name="email"
        type="email"
        class="peer h-10 px-2 w-full border border-slate-300 text-slate-900 placeholder-transparent focus:outline-none focus:border-slate-500"
        placeholder="jaak-kristjan@jõeorg.ee"
        autofocus
      >
      <label
        for="email"
        class="absolute left-1 px-1 -top-2.5 text-slate-500 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-500 peer-placeholder-shown:top-2 peer-focus:-top-2.5 peer-focus:text-slate-500 peer-focus:text-sm bg-white"
      >Email address</label>
      <button class="w-full mt-4 h-10 px-2 border border-slate-300 hover:bg-slate-100 active:bg-slate-200">
        Authenticate
      </button>
    </div>
  </div>
</template>
