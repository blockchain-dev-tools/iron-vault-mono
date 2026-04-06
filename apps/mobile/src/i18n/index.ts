import { NativeModules, Platform } from 'react-native';
import { EN, ZH, type Translations, type LocaleMode } from '@iron-vault/i18n';

export type { LocaleMode, Translations };

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

export function resolveTranslations(mode: LocaleMode): Translations {
  const lang = mode === 'system' ? getSystemLang() : mode;
  return lang === 'zh' ? (ZH as unknown as Translations) : EN;
}
