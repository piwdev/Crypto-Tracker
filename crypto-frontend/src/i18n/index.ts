import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, STORAGE_KEYS } from '../utils/constants';

// 翻訳リソースのインポート
import enTranslations from './en.json';
import jaTranslations from './ja.json';

// 保存された言語設定を取得、なければブラウザの言語設定を使用
const getInitialLanguage = (): string => {
  const savedLanguage = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
  if (savedLanguage && Object.values(SUPPORTED_LANGUAGES).includes(savedLanguage as any)) {
    return savedLanguage;
  }
  
  // ブラウザの言語設定をチェック
  const browserLanguage = navigator.language.toLowerCase();
  if (browserLanguage.startsWith('ja')) {
    return SUPPORTED_LANGUAGES.JA;
  }
  
  return DEFAULT_LANGUAGE;
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      [SUPPORTED_LANGUAGES.EN]: {
        translation: enTranslations,
      },
      [SUPPORTED_LANGUAGES.JA]: {
        translation: jaTranslations,
      },
    },
    lng: getInitialLanguage(),
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

// 言語変更時にlocalStorageに保存
i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEYS.LANGUAGE, lng);
});

export default i18n;