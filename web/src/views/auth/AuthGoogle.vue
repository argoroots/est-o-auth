<script setup>
import formWrapper from '@/components/FormWrapper.vue'

window.location.href = `${import.meta.env.VITE_APP_API_URL || ''}/api/google${window.location.search}`
</script>

<template>
  <form-wrapper class="mb-0.5 text-center text-yellow-600">
    <svg
      class="animate-spin mx-auto h-10 w-10"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-10"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-50"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  </form-wrapper>
</template>
