<script setup>
import { onMounted, ref } from 'vue'
import { authenticate } from '@web-eid/web-eid-library/web-eid.js'

import { get } from '@/api.js'
import formWrapper from '@/components/FormWrapper.vue'

const errorMessage = ref(null)

onMounted(async () => {
  try {
    const { nonce } = await get('web-eid/nonce')
    const authToken = await authenticate(nonce, { lang: 'en' })

    console.log('authToken', authToken)
  } catch (error) {
    errorMessage.value = error.message || error
  }
})
</script>

<template>
  <form-wrapper v-if="errorMessage">
    <h2>
      Error
    </h2>
    <p>
      {{ errorMessage }}
    </p>
  </form-wrapper>
</template>
