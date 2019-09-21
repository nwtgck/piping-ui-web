export default function strings(language: string) {
  return <K extends keyof (typeof defaultStr)>(key: K) => {
    if(language.startsWith("en")) {
      return en[key];
    } else if(language.startsWith("ja")) {
      return ja[key];
    } else {
      return defaultStr[key];
    }
  };
}

const en = {
  language: 'Language',
  dark_theme: 'Dark Theme',
  pwa_update: 'Update',
};
const defaultStr = en;

const ja: typeof defaultStr = {
  language: '言語 (Language)',
  dark_theme: 'ダークテーマ',
  pwa_update: 'Update',
} as const;
