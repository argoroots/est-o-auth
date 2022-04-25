<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import formWrapper from '@/components/FormWrapper.vue'
import formInput from '@/components/FormInput.vue'
import formButton from '@/components/FormButton.vue'

const { query } = useRoute()
const idc = ref(query.idc)

if (idc.value) {
  onAuthenticate()
}

function onAuthenticate () {
  if (!idc.value?.trim()) {
    return
  }

  console.log(idc.value)
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
    <form-button @click="onAuthenticate">
      Authenticate
    </form-button>
  </form-wrapper>
</template>
