<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import formWrapper from '@/components/FormWrapper.vue'
import formInput from '@/components/FormInput.vue'
import formButton from '@/components/FormButton.vue'

const { query } = useRoute()
const phone = ref(query.phone)
const idc = ref(query.idc)

if (idc.value && phone.value) {
  onAuthenticate()
}

function onAuthenticate () {
  if (!idc.value?.trim() || !phone.value?.trim()) {
    return
  }

  console.log(idc.value, phone.value)
}
</script>

<template>
  <form-wrapper>
    <form-input
      id="idc"
      v-model="idc"
      type="tel"
      label="ID code"
      placeholder="38001085718"
      autofocus
    />
    <form-input
      id="phone"
      v-model="phone"
      type="tel"
      label="Phone"
      placeholder="+37200000000"
    />
    <form-button @click="onAuthenticate">
      Authenticate
    </form-button>
  </form-wrapper>
</template>
