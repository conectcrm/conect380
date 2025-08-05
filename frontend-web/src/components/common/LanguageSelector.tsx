import React, { useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { Languages, Check, Globe } from 'lucide-react';

interface LanguageSelectorProps {
  showAsModal?: boolean;
  onClose?: () => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  showAsModal = false,
  onClose
}) => {
  const { language, changeLanguage, t, availableLanguages } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = availableLanguages.find(lang => lang.code === language) || availableLanguages[0];

  const handleLanguageChange = async (langCode: string) => {
    try {
      console.log('🗣️ LanguageSelector: Tentando alterar para:', langCode);
      await changeLanguage(langCode);
      console.log('🗣️ LanguageSelector: Alteração concluída');
      setIsOpen(false);
      if (onClose) onClose();
    } catch (error) {
      console.error('🗣️ LanguageSelector: Erro ao alterar idioma:', error);
    }
  };

  if (showAsModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {t('language.select')}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {t('language.choose')}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-3">
              {availableLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:shadow-md ${language === lang.code
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{lang.nativeName}</p>
                      <p className="text-sm text-gray-500">{lang.name}</p>
                    </div>
                  </div>
                  {language === lang.code && (
                    <Check className="w-5 h-5 text-blue-600" />
                  )}
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                {t('language.applied')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dropdown version
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Languages className="w-4 h-4 text-gray-600" />
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="hidden sm:inline text-sm font-medium text-gray-700">
          {currentLanguage.nativeName}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-40">
          <div className="p-2">
            <div className="mb-2 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {t('language.available')}
            </div>
            {availableLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${language === lang.code
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50 text-gray-700'
                  }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">{lang.nativeName}</p>
                  <p className="text-xs text-gray-500">{lang.name}</p>
                </div>
                {language === lang.code && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Overlay para fechar o dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default LanguageSelector;
