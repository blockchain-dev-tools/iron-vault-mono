import { NativeModules, Platform } from 'react-native';
import { EN } from './locales/en';
import { ZH } from './locales/zh';

export type LocaleMode = 'system' | 'en' | 'zh';
export type { Translations } from './locales/en';

export function getSystemLang(): 'en' | 'zh' {
  try {
    let locale = '';
    if (Platform.OS === 'ios') {
      locale =
        NativeModules.SettingsManager?.settings?.AppleLocale ??
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ??
        '';
    } else {
      locale = NativeModules.I18nManager?.localeIdentifier ?? '';
    }
    if (locale.startsWith('zh')) return 'zh';
  } catch {}
  return 'en';
}

export function resolveTranslations(mode: LocaleMode): typeof EN {
  const lang = mode === 'system' ? getSystemLang() : mode;
  return lang === 'zh' ? (ZH as unknown as typeof EN) : EN;
}
