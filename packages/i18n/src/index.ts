export { EN, type Translations } from './en';
export { ZH } from './zh';
export { JA } from './ja';
export { KO } from './ko';

export type LocaleMode = 'system' | 'en' | 'zh' | 'ja' | 'ko';

export function resolveTranslations(lang: 'en' | 'zh' | 'ja' | 'ko') {
  const { EN } = require('./en');
  const { ZH } = require('./zh');
  const { JA } = require('./ja');
  const { KO } = require('./ko');
  if (lang === 'zh') return ZH;
  if (lang === 'ja') return JA;
  if (lang === 'ko') return KO;
  return EN;
}
