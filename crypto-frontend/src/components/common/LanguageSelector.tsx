import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../../utils/constants';
import './LanguageSelector.css';

interface LanguageSelectorProps {
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = React.memo(({ className = '' }) => {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = useCallback((language: string) => {
    i18n.changeLanguage(language);
  }, [i18n]);

  const getCurrentLanguageLabel = useMemo(() => {
    return i18n.language === SUPPORTED_LANGUAGES.JA 
      ? t('language.japanese') 
      : t('language.english');
  }, [i18n.language, t]);

  return (
    <div className={`language-selector ${className}`}>
      <button 
        className="language-selector__button"
        aria-label={t('language.selectLanguage')}
        title={t('language.selectLanguage')}
      >
        <span className="language-selector__current">
          {getCurrentLanguageLabel}
        </span>
        <span className="language-selector__arrow">▼</span>
      </button>
      
      <div className="language-selector__dropdown">
        <button
          className={`language-selector__option ${
            i18n.language === SUPPORTED_LANGUAGES.EN ? 'language-selector__option--active' : ''
          }`}
          onClick={() => handleLanguageChange(SUPPORTED_LANGUAGES.EN)}
          type="button"
        >
          {t('language.english')}
        </button>
        <button
          className={`language-selector__option ${
            i18n.language === SUPPORTED_LANGUAGES.JA ? 'language-selector__option--active' : ''
          }`}
          onClick={() => handleLanguageChange(SUPPORTED_LANGUAGES.JA)}
          type="button"
        >
          {t('language.japanese')}
        </button>
      </div>
    </div>
  );
});

export default LanguageSelector;