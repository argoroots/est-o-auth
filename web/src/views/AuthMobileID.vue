<script setup>
import formInput from '@/components/FormInput.vue'
import formButton from '@/components/FormButton.vue'
</script>

<template>
  <div class="flex flex-col space-y-6 px-6">
    <form-input
      id="idc"
      type="tel"
      label="ID code"
      placeholder="idc"
      autofocus
    />
    <form-input
      id="phone"
      type="tel"
      label="Phone"
      placeholder="phone"
    />
    <form-button
      label="Authenticate"
    />
  </div>
</template>
