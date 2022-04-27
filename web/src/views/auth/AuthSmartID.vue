<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import { post } from '@/api.js'
import formWrapper from '@/components/FormWrapper.vue'
import formInput from '@/components/FormInput.vue'
import formButton from '@/components/FormButton.vue'

const { query } = useRoute()
const idcode = ref(query.idcode)

if (idcode.value) {
  onAuthenticate()
}

async function onAuthenticate () {
  if (!idcode.value?.trim()) {
    return
  }

  const response = await post('smart-id', {
    response_type: query.response_type,
    client_id: query.client_id,
    redirect_uri: query.redirect_uri,
    scope: query.scope,
    state: query.state,
    idcode: idcode.value
  })

  console.log(response)
}
</script>

<template>
  <form-wrapper>
    <form-input
      id="idcode"
      v-model="idcode"
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
