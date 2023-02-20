<script setup>
window.location.href = `${import.meta.env.VITE_APP_API_URL || ''}/api/google${window.location.search}`
</script>
