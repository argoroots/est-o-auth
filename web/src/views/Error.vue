<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import authForm from './AuthForm.vue'

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
</script>

<template>
  <auth-form>
    <h2>
      Error
    </h2>
    <p>
      {{ error }}
    </p>
  </auth-form>
</template>
