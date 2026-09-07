<script setup>
useHead({ title: 'Sign up' })

const { query } = useRoute()

// ?mock=true renders the callback screen with fake credentials (development only)
const isMock = import.meta.dev && query.mock === 'true'

// Visited without a Checkout session: start one
if (!query.session_id && !isMock) await navigateTo('/api/signup', { external: true })

const { data, error } = isMock
  ? { data: ref({ client_id: 'QVnPZGdcXQ8Ev4mx', client_secret: 'aLs6BLQfhd3dX8rUDnvQzmhZcVMNPnwy' }), error: ref(null) }
  : await useFetch('/api/signup', { query: { session_id: query.session_id }, immediate: !!query.session_id })

const copied = ref(null)

async function onCopy (key) {
  try {
    await navigator.clipboard.writeText(data.value[key])
  }
  catch {
    // Clipboard API blocked: select the value and use the legacy copy command
    const range = document.createRange()
    range.selectNodeContents(document.getElementById(key))
    window.getSelection().removeAllRanges()
    window.getSelection().addRange(range)
    document.execCommand('copy')
  }

  copied.value = key
  setTimeout(() => {
    copied.value = null
  }, 2000)
}
</script>

<template>
  <form-wrapper v-if="query.session_id || isMock">
    <template v-if="data">
      <h2>Welcome!</h2>
      <p>
        The <em>client_secret</em> is shown only once - store it in a safe place now.
      </p>
      <div
        v-for="key in ['client_id', 'client_secret']"
        :key="key"
      >
        <label>
          {{ key }}
          <button
            type="button"
            @click="onCopy(key)"
          >
            {{ copied === key ? 'copied' : 'copy' }}
          </button>
        </label>
        <pre :id="key">{{ data[key] }}</pre>
      </div>
      <p>
        Continue with the <a href="/docs">documentation</a>.
      </p>
    </template>

    <template v-else>
      <h2>Sign up failed</h2>
      <p class="text-red-700">
        {{ error?.statusMessage || 'Unknown error' }}
      </p>
      <p>
        If You have already received Your credentials, they can not be shown again. Otherwise please
        <a href="mailto:argo@roots.ee?subject=OAuth.ee sign up failed">contact us</a>.
      </p>
    </template>
  </form-wrapper>
</template>

<style scoped>
@reference "~/assets/tailwind.css";

label {
  @apply flex;
  @apply justify-between;
  @apply mb-1;
  @apply text-sm;
  @apply text-stone-500;
}

label button {
  @apply text-xs;
  @apply text-red-700;
  @apply hover:underline;
}

pre {
  @apply p-2;
  @apply rounded;
  @apply text-sm;
  @apply text-white;
  @apply bg-stone-900;
  @apply whitespace-pre-wrap;
  @apply break-all;
  @apply select-all;
}
</style>
