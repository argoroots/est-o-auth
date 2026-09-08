<script setup>
definePageMeta({ layout: 'text', middleware: ['check-query'] })

// Loaded by the check-query middleware
const client = useState('client')

function sum (data) {
  return Object.values(data).reduce((a, b) => a + b, 0)
}

const { t } = useI18n()
useHead({ title: `${client.value.client} ${t('usage.title')}` })
</script>

<template>
  <div class="grid grid-cols-6">
    <div class="th" />
    <div class="th">
      {{ $t('usage.today') }}
    </div>
    <div class="th">
      {{ $t('usage.yesterday') }}
    </div>
    <div class="th">
      {{ $t('usage.month') }}
    </div>
    <div class="th">
      {{ $t('usage.lastMonth') }}
    </div>
    <div class="th">
      {{ $t('usage.year') }}
    </div>
    <template
      v-for="p in PROVIDER_IDS"
      :key="p"
    >
      <div class="th border-r text-left! font-normal">
        {{ $t(`provider.${p}`) }}
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
    <div class="th border-0!" />
    <div class="th border-0!">
      {{ sum(client.usage.today) }}
    </div>
    <div class="th border-0!">
      {{ sum(client.usage.yesterday) }}
    </div>
    <div class="th border-0!">
      {{ sum(client.usage.month) }}
    </div>
    <div class="th border-0!">
      {{ sum(client.usage.lastMonth) }}
    </div>
    <div class="th border-0!">
      {{ sum(client.usage.year) }}
    </div>
  </div>
</template>

<style scoped>
@reference "~/assets/tailwind.css";

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
