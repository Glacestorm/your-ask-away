import { useMemo } from "react";
import { Globe } from "lucide-react";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const languages: Array<{ code: Language; name: string }> = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "ca", name: "Català" },
  { code: "fr", name: "Français" },
];

export function LanguageFloatingSelector() {
  const { language, setLanguage } = useLanguage();

  const currentLabel = useMemo(
    () => languages.find((l) => l.code === language)?.name ?? "English",
    [language]
  );

  return (
    <div className="fixed left-4 bottom-20 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full bg-background/80 backdrop-blur border-border shadow-md"
            aria-label={`Language selector (current: ${currentLabel})`}
          >
            <Globe className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="min-w-44">
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={language === lang.code ? "bg-accent" : ""}
            >
              {lang.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
