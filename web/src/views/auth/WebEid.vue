<script setup>
import { onMounted } from 'vue'
import { authenticate } from '@web-eid/web-eid-library/web-eid.js'

onMounted(async () => {
  const { nonce } = await fetch('https://oauth.ee/api/web-eid/nonce')

  console.log('nonce', nonce)

  const authToken = await authenticate(nonce, { lang: 'et' })

  console.log('authToken', authToken)
})
</script>

<template>
  <div />
</template>
