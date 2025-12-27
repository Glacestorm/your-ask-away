import { useState } from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { WelcomeLanguageModal } from "@/components/WelcomeLanguageModal";

export function LanguageFloatingSelector() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { language } = useLanguage();

  // Obtener bandera del idioma actual
  const getCurrentFlag = () => {
    const flags: Record<string, string> = {
      es: '🇪🇸',
      en: '🇬🇧',
      ca: '🏴󠁥󠁳󠁣󠁴󠁿',
      fr: '🇫🇷',
      de: '🇩🇪',
      pt: '🇵🇹',
      it: '🇮🇹',
      'zh-CN': '🇨🇳',
      ja: '🇯🇵',
      ko: '🇰🇷',
      ar: '🇸🇦',
      ru: '🇷🇺',
    };
    return flags[language] || '🌐';
  };

  return (
    <>
      <div className="fixed left-4 bottom-20 z-50">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setIsModalOpen(true)}
          className="h-10 w-10 rounded-full bg-background/80 backdrop-blur border-border shadow-md hover:shadow-lg transition-all hover:scale-105"
          aria-label="Cambiar idioma"
        >
          <span className="text-lg">{getCurrentFlag()}</span>
        </Button>
      </div>

      <WelcomeLanguageModal
        mode="selector"
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}
