<script setup>
import { authenticate, ErrorCode } from '@web-eid/web-eid-library/web-eid'

const props = defineProps({
  nonce: { type: String, required: true }
})

const emit = defineEmits(['authenticate'])
const errorMessage = ref()
const showInstallLink = ref(false)

onMounted(async () => {
  try {
    const authResponse = await authenticate(props.nonce, { lang: 'en' })

    emit('authenticate', authResponse)
  }
  catch (error) {
    switch (error.code) {
      case ErrorCode.ERR_WEBEID_USER_CANCELLED:
        history.back()
        break
      case ErrorCode.ERR_WEBEID_ACTION_TIMEOUT:
      case ErrorCode.ERR_WEBEID_USER_TIMEOUT:
        errorMessage.value = 'Authentication timed out, please try again.'
        break
      case ErrorCode.ERR_WEBEID_ACTION_PENDING:
        errorMessage.value = 'Another Web eID operation is already in progress. Please finish it and try again.'
        break
      case ErrorCode.ERR_WEBEID_CONTEXT_INSECURE:
        errorMessage.value = 'ID-card authentication requires a secure (HTTPS) connection.'
        break
      case ErrorCode.ERR_WEBEID_VERSION_MISMATCH:
        if (error.requiresUpdate?.nativeApp) errorMessage.value = 'The Web eID application needs to be updated.'
        else if (error.requiresUpdate?.extension) errorMessage.value = 'The Web eID browser extension needs to be updated.'
        else errorMessage.value = 'The Web eID extension and application versions do not match. Please update both.'

        showInstallLink.value = true
        break
      case ErrorCode.ERR_WEBEID_EXTENSION_UNAVAILABLE:
        errorMessage.value = 'The Web eID browser extension is not installed.'
        showInstallLink.value = true
        break
      case ErrorCode.ERR_WEBEID_NATIVE_UNAVAILABLE:
        errorMessage.value = 'The Web eID application is not installed.'
        showInstallLink.value = true
        break
      default:
        console.error(error)
        errorMessage.value = 'ID-card authentication failed. Please try again.'
        break
    }
  }
})
</script>

<template>
  <template v-if="errorMessage">
    <h2>Error</h2>
    <p>{{ errorMessage }}</p>
    <p v-if="showInstallLink">
      You can download the ID-software from
      <a
        href="https://www.id.ee/en/article/install-id-software/"
        target="_blank"
      >ID.ee</a>.
    </p>
  </template>
  <p v-else>
    Please insert your ID-card into the card reader and follow the instructions on the screen.
  </p>
</template>
