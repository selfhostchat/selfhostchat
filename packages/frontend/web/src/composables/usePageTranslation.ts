import { useI18n } from 'vue-i18n'

type TranslationMap = Record<string, Record<string, string>>

export function usePageTranslation(getTranslator: () => TranslationMap) {
  const { locale } = useI18n()

  const tx = (key: string) => {
    const messages = getTranslator()
    const lang = locale.value
    return messages[lang as keyof typeof messages]?.[key] ?? messages.en?.[key] ?? key
  }

  return { tx }
}
