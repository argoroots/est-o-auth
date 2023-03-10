<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { authenticate } from '@web-eid/web-eid-library/web-eid.js'

import { get, post } from '@/api.js'
import formWrapper from '@/components/FormWrapper.vue'

const { query } = useRoute()

const errorMessage = ref(null)

onMounted(async () => {
  try {
    const { nonce } = await get('web-eid/nonce', {
      response_type: query.response_type,
      client_id: query.client_id,
      redirect_uri: query.redirect_uri,
      scope: query.scope,
      state: query.state
    })

    const { unverifiedCertificate } = await authenticate(nonce, { lang: 'en' })

    const response = await post('web-eid/code', {
      response_type: query.response_type,
      client_id: query.client_id,
      redirect_uri: query.redirect_uri,
      scope: query.scope,
      state: query.state,
      certificate: unverifiedCertificate
    })

    if (response.redirect) {
      window.location.href = response.redirect
    } else {
      console.log(response)
    }
  } catch (error) {
    errorMessage.value = error.message || error
  }
})
</script>

<template>
  <form-wrapper
    v-if="errorMessage"
    class="mb-0.5"
  >
    <h2>
      Error
    </h2>
    <p>
      {{ errorMessage }}
    </p>
  </form-wrapper>
</template>
