// Picks the UI language from the `lang` query parameter (en or et); anything else falls back to the
// default. The OAuth pages pass the whole query between each other, so the choice follows the flow.
export default defineNuxtRouteMiddleware(async (to) => {
  const { $i18n } = useNuxtApp()
  const wanted = $i18n.locales.value.some((l) => l.code === to.query.lang) ? to.query.lang : $i18n.defaultLocale

  if ($i18n.locale.value !== wanted) await $i18n.setLocale(wanted)
})
