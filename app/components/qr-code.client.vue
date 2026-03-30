<script setup>
import QRCode from 'qrcode'

const props = defineProps({ url: String })
const canvas = ref()

watch(() => props.url, async (url) => {
  if (!url || !canvas.value) return

  await QRCode.toCanvas(canvas.value, url, { errorCorrectionLevel: 'L', width: 256, margin: 2 })
}, { immediate: true })
</script>

<template>
  <canvas ref="canvas" />
</template>
