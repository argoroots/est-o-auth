<script setup>
definePageMeta({ layout: 'text' })
useHead({ title: 'Terms & Conditions' })
</script>

<template>
  <section>
    <ol>
      <li>By using OAuth.ee service, you agree to comply with the terms and conditions outlined in this document.</li>
      <li>OAuth.ee does not store any credentials, such as usernames and passwords.</li>
      <li>OAuth.ee temporarily stores the user's id code, e-mail address, phone number and/or name. This data is deleted after the authentication process is completed.</li>
      <li>When using the Google for authentication, OAuth.ee temporarily stores the user's id, e-mail address and name. This data is deleted after the authentication process is completed.</li>
      <li>After successful identification, OAuth.ee provides the user's id code, e-mail, phone and/or name to the service from which the identification was initialized. We access this data solely for identification purposes and use it only for the purpose of providing the service to you. Data is not stored and thus not shared with anyone and can not be accessed from homepage or by any other means.</li>
      <li>We will not be liable for any losses or damages incurred as a result of using OAuth.ee service.</li>
      <li>You are solely responsible for keeping your account secure and confidential. You are responsible for any activity that occurs under your account.</li>
      <li>You must not use OAuth.ee service for any illegal or unauthorized purpose.</li>
      <li>We reserve the right to modify or terminate OAuth.ee service at any time, without notice.</li>
      <li>We reserve the right to refuse service to anyone for any reason at any time.</li>
      <li>You must not attempt to gain unauthorized access to OAuth.ee service.</li>
      <li>You must not interfere with the security of, or otherwise abuse, OAuth.ee service or any related systems or networks.</li>
      <li>You must not use OAuth.ee service to violate any laws or regulations.</li>
    </ol>
  </section>
</template>

<style scoped>
ol {
  @apply list-decimal;
}

ol > li {
  @apply mb-8;
}
</style>
