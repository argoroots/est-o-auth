<script setup>
import { authenticate, ErrorCode } from '@web-eid/web-eid-library/web-eid'

const props = defineProps({
  nonce: { type: String, required: true }
})

const emit = defineEmits(['authenticate'])
const { t, locale } = useI18n()
const errorMessage = ref()
const showInstallLink = ref(false)
const errorHeading = ref()

// Move focus to the error heading so screen readers announce it and keyboard users land on it
watch(errorMessage, async (message) => {
  if (!message) return

  await nextTick()
  errorHeading.value?.focus()
})

onMounted(async () => {
  try {
    // The Web eID dialog follows the page language
    const authResponse = await authenticate(props.nonce, { lang: locale.value })

    emit('authenticate', authResponse)
  }
  catch (error) {
    switch (error.code) {
      case ErrorCode.ERR_WEBEID_USER_CANCELLED:
        // Back to the method chooser with the same OAuth query; history.back() would do nothing
        // when this page was opened directly by the client
        await navigateTo({ path: '/auth', query: useRoute().query })
        break
      case ErrorCode.ERR_WEBEID_ACTION_TIMEOUT:
      case ErrorCode.ERR_WEBEID_USER_TIMEOUT:
        errorMessage.value = t('idCard.timeout')
        break
      case ErrorCode.ERR_WEBEID_ACTION_PENDING:
        errorMessage.value = t('idCard.pending')
        break
      case ErrorCode.ERR_WEBEID_CONTEXT_INSECURE:
        errorMessage.value = t('idCard.insecure')
        break
      case ErrorCode.ERR_WEBEID_VERSION_MISMATCH:
        if (error.requiresUpdate?.nativeApp) errorMessage.value = t('idCard.updateApp')
        else if (error.requiresUpdate?.extension) errorMessage.value = t('idCard.updateExtension')
        else errorMessage.value = t('idCard.updateBoth')

        showInstallLink.value = true
        break
      case ErrorCode.ERR_WEBEID_EXTENSION_UNAVAILABLE:
        errorMessage.value = t('idCard.noExtension')
        showInstallLink.value = true
        break
      case ErrorCode.ERR_WEBEID_NATIVE_UNAVAILABLE:
        errorMessage.value = t('idCard.noApp')
        showInstallLink.value = true
        break
      default:
        console.error(error)
        errorMessage.value = t('idCard.failed')
        break
    }
  }
})
</script>

<template>
  <template v-if="errorMessage">
    <h2
      ref="errorHeading"
      tabindex="-1"
    >
      {{ $t('common.error') }}
    </h2>
    <p aria-live="polite">
      {{ errorMessage }}
    </p>
    <i18n-t
      v-if="showInstallLink"
      keypath="idCard.download"
      tag="p"
    >
      <template #link>
        <a
          href="https://www.id.ee/en/article/install-id-software/"
          target="_blank"
        >ID.ee</a>
      </template>
    </i18n-t>
  </template>
  <template v-else>
    <form-spinner />
    <p>{{ $t('idCard.insert') }}</p>
  </template>
</template>
