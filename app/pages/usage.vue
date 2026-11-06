<script setup>
definePageMeta({ layout: 'text' })

// Only the client id is needed here, not the full OAuth query the auth pages require
const { query } = useRoute()
const { data: client, error } = await useFetch('/api/usage', { query: { client_id: query.client_id } })

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 502,
    statusMessage: error.value.data?.statusMessage || error.value.statusMessage || 'Could not load usage'
  })
}

const { t, locale } = useI18n()
useHead({ title: `${client.value.client} ${t('usage.title')}` })

// Drill-down: last 12 months -> weeks of month -> days of week
const month = ref(null)
const week = ref(null)
const days = ref({})
const loading = ref(false)
const failed = ref(false)

async function openMonth (m) {
  failed.value = false

  if (!days.value[m]) {
    loading.value = true

    try {
      const { usage } = await $fetch('/api/usage', { query: { client_id: query.client_id, month: m } })
      days.value[m] = usage
    }
    catch {
      failed.value = true
      return
    }
    finally {
      loading.value = false
    }
  }

  month.value = m
  week.value = null
}

function openMonths () {
  month.value = null
  week.value = null
}

// ISO 8601 week number of a YYYY-MM-DD date
function isoWeek (date) {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + 3 - (d.getUTCDay() + 6) % 7)
  const jan4 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4))

  return 1 + Math.round(((d - jan4) / 86400000 - 3 + (jan4.getUTCDay() + 6) % 7) / 7)
}

function format (date, options) {
  return new Intl.DateTimeFormat(locale.value, { timeZone: 'UTC', ...options }).format(new Date(date))
}

function addCounts (a, b) {
  return Object.fromEntries(PROVIDER_IDS.map((p) => [p, (a?.[p] || 0) + (b[p] || 0)]))
}

// Whole weeks of the open month; the first and last also count days of the neighbouring months
const weeks = computed(() => {
  const result = []

  for (const [date, counts] of Object.entries(days.value[month.value] ?? {})) {
    const number = isoWeek(date)
    let w = result.find((x) => x.number === number)

    if (!w) {
      w = { number, dates: [] }
      result.push(w)
    }

    w.dates.push(date)
    w.counts = addCounts(w.counts, counts)
  }

  return result
})

// Table columns for the current level: { key, title, subtitle, counts, open }
const columns = computed(() => {
  if (week.value) {
    const w = weeks.value.find((x) => x.number === week.value)

    return w.dates.map((date) => ({
      key: date,
      title: format(date, { weekday: 'short' }),
      subtitle: format(date, { day: 'numeric', month: 'short' }),
      counts: days.value[month.value][date]
    }))
  }

  if (month.value) {
    return weeks.value.map((w) => ({
      key: w.number,
      title: t('usage.week', { week: w.number }),
      subtitle: new Intl.DateTimeFormat(locale.value, { timeZone: 'UTC', day: 'numeric', month: 'short' }).formatRange(new Date(w.dates[0]), new Date(w.dates.at(-1))),
      counts: w.counts,
      open: () => { week.value = w.number }
    }))
  }

  return Object.entries(client.value.usage).map(([m, counts]) => ({
    key: m,
    title: format(m, { month: 'short' }),
    subtitle: format(m, { year: 'numeric' }),
    counts,
    open: () => openMonth(m)
  }))
})

// Shown period as first day - last day
const range = computed(() => {
  let dates

  if (week.value) {
    dates = weeks.value.find((w) => w.number === week.value).dates
  }
  else if (month.value) {
    dates = Object.keys(days.value[month.value])
  }
  else {
    const months = Object.keys(client.value.usage)
    const [y, m] = months.at(-1).split('-').map(Number)
    dates = [`${months[0]}-01`, new Date(Date.UTC(y, m, 0)).toISOString().substring(0, 10)]
  }

  return [dates[0], dates.at(-1)].map((d) => d.split('-').reverse().join('.')).join(' – ')
})

// Total across providers for one column
function sum (data) {
  return Object.values(data).reduce((a, b) => a + b, 0)
}

// Count with thousands separators; empty for zero
function number (value) {
  return value ? new Intl.NumberFormat(locale.value).format(value) : ''
}
</script>

<template>
  <div class="lg:-mx-32">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr>
            <th class="text-left!">
              <button
                v-if="month"
                class="cursor-pointer text-2xl leading-none text-gray-500 hover:text-black disabled:cursor-wait"
                :aria-label="$t('usage.back')"
                :disabled="loading"
                @click="week ? openMonth(month) : openMonths()"
              >
                ←
              </button>
            </th>
            <th
              v-for="c in columns"
              :key="c.key"
            >
              <button
                v-if="c.open"
                class="cursor-pointer hover:underline disabled:cursor-wait"
                :disabled="loading"
                @click="c.open"
              >
                {{ c.title }}
              </button>
              <template v-else>
                {{ c.title }}
              </template>
              <div class="text-xs text-gray-400">
                {{ c.subtitle }}
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in PROVIDER_IDS"
            :key="p"
          >
            <th class="text-left!">
              {{ $t(`provider.${p}`) }}
            </th>
            <td
              v-for="c in columns"
              :key="c.key"
            >
              {{ number(c.counts[p]) }}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <th />
            <td
              v-for="c in columns"
              :key="c.key"
            >
              {{ number(sum(c.counts)) || 0 }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <nav class="mt-8.5 text-center text-sm text-gray-500">
      <div>
        {{ range }}
        <span v-if="loading">…</span>
      </div>
      <div
        v-if="failed"
        class="mt-2 text-red-600"
      >
        {{ $t('common.somethingWrong') }}
      </div>
    </nav>
  </div>
</template>

<style scoped>
@reference "~/assets/tailwind.css";

th,
td {
  @apply px-2 py-2;
  @apply text-right font-normal whitespace-nowrap;
  @apply border-b border-gray-200;
}

thead th {
  @apply align-bottom;
}

tbody th,
tbody td:not(:last-child) {
  @apply border-r;
}

tfoot th,
tfoot td {
  @apply border-0;
}
</style>
