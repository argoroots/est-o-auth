// UI language from the `lang` query parameter (en, et or fi), otherwise the default; the query travels with the flow
export default defineNuxtRouteMiddleware(async (to) => {
  const { $i18n } = useNuxtApp()
  const wanted = $i18n.locales.value.some((l) => l.code === to.query.lang) ? to.query.lang : $i18n.defaultLocale

  if ($i18n.locale.value !== wanted) await $i18n.setLocale(wanted)
})
