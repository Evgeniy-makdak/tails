import { dictionaries, type MessageKey } from './locales';
import type { Locale, TranslationParams } from './types';

export function translate(locale: Locale, key: MessageKey, params?: TranslationParams): string {
  const dict = dictionaries[locale] ?? dictionaries.ru;
  let text: string = dict[key] ?? dictionaries.ru[key] ?? String(key);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.split(`{${k}}`).join(String(v));
    }
  }
  return text;
}
