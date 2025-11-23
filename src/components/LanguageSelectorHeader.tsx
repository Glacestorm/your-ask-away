import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

export const LanguageSelectorHeader = () => {
  return (
    <div className="flex items-center gap-2">
      <LanguageSelector />
    </div>
  );
};
