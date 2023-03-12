<script setup>
import { authenticate, ErrorCode } from '@web-eid/web-eid-library/web-eid.js'

const props = defineProps({
  nonce: { type: String, required: true }
})

const emit = defineEmits(['authenticate'])
const errorMessage = ref()

onMounted(async () => {
  try {
    const authResponse = await authenticate(props.nonce, { lang: 'en' })

    emit('authenticate', authResponse)
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
        console.error(error)
        errorMessage.value = error.message || error
        break
    }
  }
})
</script>

<template>
  <template v-if="errorMessage">
    <h2>Error</h2>
    <p v-html="errorMessage" />
  </template>
  <p v-else>
    Please insert your ID-card into the card reader and follow the instructions on the screen.
  </p>
</template>
