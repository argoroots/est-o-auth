// Returns a function that renders an API error in the UI language; a statusMessage that is not a known key is shown as is, an empty one as the fallback
export function useErrorMessage () {
  const { t, te } = useI18n()

  return (error, fallback = 'common.somethingWrong') => {
    // $fetch errors carry the response body in .data, showError/createError carry statusMessage directly
    const statusMessage = error?.data?.statusMessage || error?.statusMessage || ''

    if (te(`errors.${statusMessage}`)) return t(`errors.${statusMessage}`)

    return statusMessage || t(fallback)
  }
}
