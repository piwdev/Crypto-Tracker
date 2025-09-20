import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import { SUPPORTED_LANGUAGES } from '../../utils/constants';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

const mockUseTranslation = useTranslation as jest.MockedFunction<typeof useTranslation>;

describe('LanguageSelector', () => {
  const mockChangeLanguage = jest.fn();
  const mockT = (key: string) => {
    const translations: { [key: string]: string } = {
      'language.english': 'English',
      'language.japanese': '日本語',
      'language.selectLanguage': 'Select Language',
    };
    return translations[key] || key;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: {
        language: SUPPORTED_LANGUAGES.EN,
        changeLanguage: mockChangeLanguage,
      } as any,
      ready: true,
    });
  });

  it('renders with English as default language', () => {
    render(<LanguageSelector />);
    
    expect(screen.getAllByText('English')).toHaveLength(2); // Current display + dropdown option
    expect(screen.getByLabelText('Select Language')).toBeInTheDocument();
  });

  it('renders with Japanese when current language is Japanese', () => {
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: {
        language: SUPPORTED_LANGUAGES.JA,
        changeLanguage: mockChangeLanguage,
      } as any,
      ready: true,
    });

    render(<LanguageSelector />);
    
    expect(screen.getAllByText('日本語')).toHaveLength(2); // Current display + dropdown option
  });

  it('shows dropdown options on hover', () => {
    render(<LanguageSelector />);
    
    // Both language options should be present in the dropdown
    expect(screen.getAllByText('English')).toHaveLength(2);
    expect(screen.getAllByText('日本語')).toHaveLength(1);
  });

  it('calls changeLanguage when English option is clicked', () => {
    render(<LanguageSelector />);
    
    const englishOption = screen.getAllByText('English')[1]; // Second one is in dropdown
    fireEvent.click(englishOption);
    
    expect(mockChangeLanguage).toHaveBeenCalledWith(SUPPORTED_LANGUAGES.EN);
  });

  it('calls changeLanguage when Japanese option is clicked', () => {
    render(<LanguageSelector />);
    
    const japaneseOption = screen.getByText('日本語');
    fireEvent.click(japaneseOption);
    
    expect(mockChangeLanguage).toHaveBeenCalledWith(SUPPORTED_LANGUAGES.JA);
  });

  it('applies active class to current language option', () => {
    render(<LanguageSelector />);
    
    const englishOptions = screen.getAllByText('English');
    const dropdownEnglishOption = englishOptions[1]; // Second one is in dropdown
    expect(dropdownEnglishOption).toHaveClass('language-selector__option--active');
  });

  it('applies custom className when provided', () => {
    const { container } = render(<LanguageSelector className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('language-selector', 'custom-class');
  });
});