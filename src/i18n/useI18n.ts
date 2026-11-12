import { useCallback } from 'react';

import type { MessageKey } from './locales';
import { useLocaleStore } from './store';
import { translate } from './t';
import type { TranslationParams } from './types';

export function useI18n() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const toggleLocale = useLocaleStore((s) => s.toggleLocale);
  const t = useCallback(
    (key: MessageKey, params?: TranslationParams) => translate(locale, key, params),
    [locale],
  );
  return { locale, setLocale, toggleLocale, t };
}
