export { EN, type Translations } from './en';
export { ZH } from './zh';

export type LocaleMode = 'system' | 'en' | 'zh';

export function resolveTranslations(lang: 'en' | 'zh') {
  const { EN } = require('./en');
  const { ZH } = require('./zh');
  return lang === 'zh' ? ZH : EN;
}
