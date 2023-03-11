<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { authenticate, ErrorCode } from '@web-eid/web-eid-library/web-eid.js'

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
    switch (error.code) {
      case ErrorCode.ERR_WEBEID_USER_CANCELLED:
        history.back()
        break
      case ErrorCode.ERR_WEBEID_ACTION_TIMEOUT:
        errorMessage.value = 'Authentication timed out, please try again'
        break
      case ErrorCode.ERR_WEBEID_USER_TIMEOUT:
        errorMessage.value = 'Authentication timed out, please try again'
        break
      case ErrorCode.ERR_WEBEID_VERSION_MISMATCH:
        if (error.requiresUpdate?.extension) errorMessage.value = 'Web eID browser extension needs to be updated'
        if (error.requiresUpdate?.nativeApp) errorMessage.value = 'Web eID application needs to be updated'

        errorMessage.value = 'Authentication timed out, please try again!'
        break
      case ErrorCode.ERR_WEBEID_EXTENSION_UNAVAILABLE:
        errorMessage.value = 'Web eID browser extension is not installed. You can download it from <a href="https://www.id.ee/en/article/install-id-software/" target="_blank">ID.ee</a>.'
        break
      case ErrorCode.ERR_WEBEID_NATIVE_UNAVAILABLE:
        errorMessage.value = 'Web eID application is not installed. You can download it from <a href="https://www.id.ee/en/article/install-id-software/" target="_blank">ID.ee</a>.'
        break
      default:
        console.log(error)
        errorMessage.value = error.message || error
        break
    }
  }
})
</script>

<template>
  <form-wrapper class="mb-0.5 text-center">
    <template v-if="errorMessage">
      <h2>Error</h2>
      <p v-html="errorMessage" />
    </template>
    <p v-else>
      Please insert your ID-card into the card reader and follow the instructions on the screen.
    </p>
  </form-wrapper>
</template>
