<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const { query } = useRoute()

const error = computed(() => {
  switch (query.error) {
    case 'missing_parameter':
      return 'Required parameter (response_type, client_id, redirect_uri, scope or state) is missing!'
    case 'response_type':
      return 'The response type (response_type) in the request do not match required value "code"!'
    case 'client_id':
      return 'The client ID (client_id) in the request do not match a registered client ID!'
    case 'redirect_uri':
      return 'The redirect URI (redirect_uri) in the request do not match a registered redirect URI!'
    case 'scope':
      return 'The scope in the request do not match required value "openid"!'
    default:
      return null
  }
})
console.log(query)
</script>

<template>
  <div>
    <h2>
      Error
    </h2>
    <p v-if="error">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
div {
  @apply py-8;
  @apply px-6;
  @apply flex;
  @apply flex-col;
  @apply space-y-6;
  @apply bg-white;
}

h2 {
  @apply font-thin;
  @apply text-center;
  @apply text-red-700;
  @apply text-xl;
}

p {
  @apply font-thin;
}
</style>
