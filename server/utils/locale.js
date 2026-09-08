import en from '../../i18n/locales/en.json'
import et from '../../i18n/locales/et.json'
import fi from '../../i18n/locales/fi.json'

const LOCALES = { en, et, fi }

// Normalised UI language code: the requested one if we have it, otherwise English
export function getLang (lang) {
  return lang in LOCALES ? lang : 'en'
}

// Messages for a UI locale, used server-side for provider language codes and e-mail/SMS texts
export function getLocale (lang) {
  return LOCALES[getLang(lang)]
}

// Minimal {placeholder} interpolation for server-side messages (vue-i18n does this in the browser)
export function interpolate (message, values) {
  return message.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '')
}
