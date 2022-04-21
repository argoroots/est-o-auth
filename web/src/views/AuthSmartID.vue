<script setup>
import formInput from '@/components/FormInput.vue'
import formButton from '@/components/FormButton.vue'
</script>

<template>
  <form>
    <form-input
      id="idc"
      type="tel"
      label="ID code"
      placeholder="idc"
      autofocus
    />
    <form-button
      label="Authenticate"
    />
  </form>
</template>

<style scoped>
form {
  @apply py-8;
  @apply px-6;
  @apply flex;
  @apply flex-col;
  @apply space-y-6;
  @apply bg-white;
}
</style>
