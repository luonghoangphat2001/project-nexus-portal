import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Globe, Check, ChevronDown } from 'lucide-react';

export const LanguageSwitcher = ({ variant = 'dropdown', className = '' }) => {
  const { language, setLanguage, languages, currentLanguageInfo } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Pill toggle variant (often used on Login screens or compact headers)
  if (variant === 'pill') {
    return (
      <div className={`inline-flex items-center bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/80 shadow-xs ${className}`}>
        {languages.map((lang) => {
          const isActive = language === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title={lang.label}
            >
              <span className="text-sm">{lang.flag}</span>
              <span>{lang.shortLabel}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Dropdown variant (Header & Profile)
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all focus:outline-none"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Change Language"
      >
        <span className="text-sm leading-none">{currentLanguageInfo.flag}</span>
        <span className="font-semibold text-slate-700">{currentLanguageInfo.shortLabel}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 bg-white border border-[#ebedf2] rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
            <Globe className="w-3 h-3 text-indigo-500" />
            <span>Select Language</span>
          </div>

          <div className="py-1">
            {languages.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-indigo-50/70 text-indigo-600 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-base leading-none">{lang.flag}</span>
                    <span>{lang.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
