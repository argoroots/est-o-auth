<script setup>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
</script>

<template>
  <div class="p-4">
    <div class="relative">
      <form-input
        id="email"
        label="Email address"
        type="email"
        placeholder="jaak-kristjan@jõeorg.ee"
        autofocus
      />
      <button
        class="w-full mt-4 h-10 px-2 border border-slate-300 hover:bg-slate-100 active:bg-slate-200"
      >
        Authenticate
      </button>
    </div>
  </div>
</template>
