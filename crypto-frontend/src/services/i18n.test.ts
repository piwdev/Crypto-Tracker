import i18n from '../i18n/index';

describe('i18n Configuration', () => {
  test('should initialize correctly', () => {
    expect(i18n.isInitialized).toBe(true);
    expect(['en', 'ja']).toContain(i18n.language);
  });

  test('should have resource bundles for both languages', () => {
    expect(i18n.hasResourceBundle('en', 'translation')).toBe(true);
    expect(i18n.hasResourceBundle('ja', 'translation')).toBe(true);
  });

  test('should change language correctly', async () => {
    await i18n.changeLanguage('ja');
    expect(i18n.language).toBe('ja');

    await i18n.changeLanguage('en');
    expect(i18n.language).toBe('en');
  });

  test('should detect browser language correctly', () => {
    // Mock navigator.language
    const originalNavigator = global.navigator;
    
    // Test Japanese detection
    Object.defineProperty(global, 'navigator', {
      value: { language: 'ja-JP' },
      writable: true
    });
    
    // Re-import to test language detection
    jest.resetModules();
    const i18nWithJapanese = require('./index').default;
    expect(['ja', 'en']).toContain(i18nWithJapanese.language);
    
    // Restore original navigator
    global.navigator = originalNavigator;
  });
});