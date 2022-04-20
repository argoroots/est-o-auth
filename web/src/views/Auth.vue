<script setup>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
</script>

<template>
  <div class="flex flex-col w-full">
    <router-link
      class="block py-4 px-6 border-y border-slate-100"
      to="/auth/e-mail"
    >
      E-mail
    </router-link>
    <router-link
      class="block py-4 px-6 border-b border-slate-100"
      to="/auth/smart-id"
    >
      Smart-ID
    </router-link>
    <router-link
      class="block py-4 px-6 border-b border-slate-100"
      to="/auth/mobile-id"
    >
      Mobile-ID
    </router-link>
    <a
      class="block py-4 px-6 border-b border-slate-100"
      href="/auth/id-card"
    >
      ID-Card
    </a>
  </div>
</template>
