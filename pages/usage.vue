<script setup>
definePageMeta({ layout: 'text', middleware: ['check-query'] })

const providers = [
  'apple',
  'google',
  'smart-id',
  'mobile-id',
  'id-card',
  'e-mail',
  'phone'
]
const { query } = useRoute()
const { data: client } = await useFetch('/api/client', { query })

if (!client.value) throw createError({ statusCode: 400, statusMessage: 'The client ID (client_id) in the request do not match a registered client ID!' })

function sum (data) {
  return Object.values(data).reduce((a, b) => a + b, 0)
}

useHead({ title: client.value.client + ' usage' })
</script>

<template>
  <div class="grid grid-cols-6">
    <div class="th" />
    <div class="th">
      today
    </div>
    <div class="th">
      yesterday
    </div>
    <div class="th">
      this month
    </div>
    <div class="th">
      last month
    </div>
    <div class="th">
      this year
    </div>
    <template
      v-for="p in providers"
      :key="p"
    >
      <div class="th border-r !text-left font-normal">
        {{ p }}
      </div>
      <div class="tr border-r">
        {{ client.usage.today[p] || '' }}
      </div>
      <div class="tr border-r">
        {{ client.usage.yesterday[p] || '' }}
      </div>
      <div class="tr border-r">
        {{ client.usage.month[p] || '' }}
      </div>
      <div class="tr border-r">
        {{ client.usage.lastMonth[p] || '' }}
      </div>
      <div class="tr">
        {{ client.usage.year[p] || '' }}
      </div>
    </template>
    <div class="th !border-0" />
    <div class="th !border-0">
      {{ sum(client.usage.today) }}
    </div>
    <div class="th !border-0">
      {{ sum(client.usage.yesterday) }}
    </div>
    <div class="th !border-0">
      {{ sum(client.usage.month) }}
    </div>
    <div class="th !border-0">
      {{ sum(client.usage.lastMonth) }}
    </div>
    <div class="th !border-0">
      {{ sum(client.usage.year) }}
    </div>
  </div>
</template>

<style scoped>
.th,
.tr {
  @apply px-4 py-2;
  @apply text-right whitespace-nowrap;
  @apply border-b border-gray-200;
}

.th {
  @apply text-right font-normal;
}

.tr {
  @apply text-right whitespace-nowrap;
}
</style>
