import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Globe, Languages, Check, Sparkles, Search, RefreshCw, ChevronRight, Star, AlertCircle
} from 'lucide-react';
import { useSupportedLanguages } from '@/hooks/cms/useSupportedLanguages';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LanguagePackModuleProps {
  onLanguageChange?: (locale: string) => void;
  installationId?: string;
}

export function LanguagePackModule({ onLanguageChange, installationId }: LanguagePackModuleProps) {
  const { languages, loading: languagesLoading } = useSupportedLanguages();
  const { language, setLanguage } = useLanguage();
  const [search, setSearch] = useState('');
  const [selectedLocale, setSelectedLocale] = useState(language);
  const [downloading, setDownloading] = useState(false);
  const [previewTexts, setPreviewTexts] = useState<Record<string, string>>({});
  const [loadingPreview, setLoadingPreview] = useState(false);

  const sampleKeys = ['dashboard.welcome', 'common.save', 'common.cancel', 'navigation.home', 'settings.title'];

  const filteredLanguages = languages.filter(lang =>
    lang.name.toLowerCase().includes(search.toLowerCase()) ||
    lang.locale.toLowerCase().includes(search.toLowerCase()) ||
    lang.native_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getLocaleFlag = (locale: string) => {
    const flags: Record<string, string> = {
      'es': '🇪🇸', 'en': '🇬🇧', 'en-US': '🇺🇸', 'fr': '🇫🇷', 'de': '🇩🇪', 
      'it': '🇮🇹', 'pt': '🇵🇹', 'pt-BR': '🇧🇷', 'zh': '🇨🇳', 'ja': '🇯🇵', 
      'ko': '🇰🇷', 'ar': '🇸🇦', 'ru': '🇷🇺', 'nl': '🇳🇱', 'pl': '🇵🇱'
    };
    return flags[locale] || '🌐';
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'text-green-500';
    if (progress >= 50) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const loadPreview = async (locale: string) => {
    setLoadingPreview(true);
    try {
      const { data } = await supabase
        .from('cms_translations')
        .select('translation_key, value')
        .eq('locale', locale)
        .in('translation_key', sampleKeys);

      const texts: Record<string, string> = {};
      data?.forEach(t => { texts[t.translation_key] = t.value; });
      setPreviewTexts(texts);
    } catch (error) {
      console.error('Error loading preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => { if (selectedLocale) loadPreview(selectedLocale); }, [selectedLocale]);

  const handleSelectLanguage = async (locale: string) => {
    setSelectedLocale(locale as Language);
    setDownloading(true);
    try {
      setLanguage(locale as Language);
      onLanguageChange?.(locale);
      toast.success(`Idioma cambiado a ${languages.find(l => l.locale === locale)?.name || locale}`);
    } catch (error) {
      console.error('Error changing language:', error);
      toast.error('Error al cambiar el idioma');
    } finally {
      setDownloading(false);
    }
  };

  const popularLanguages = languages.filter(l => ['es', 'en', 'fr', 'de', 'it', 'pt', 'zh', 'ja'].includes(l.locale));

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-xl">
              <Languages className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Paquete de Idiomas</h2>
              <p className="text-muted-foreground">Selecciona tu idioma preferido. Todos los módulos se descargarán traducidos.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="select" className="space-y-4">
        <TabsList>
          <TabsTrigger value="select">Seleccionar Idioma</TabsTrigger>
          <TabsTrigger value="all">Todos ({languages.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="select">
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Check className="h-5 w-5 text-green-500" />Idioma Actual</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <span className="text-4xl">{getLocaleFlag(selectedLocale)}</span>
                  <div className="flex-1">
                    <p className="font-bold text-lg">{languages.find(l => l.locale === selectedLocale)?.name || selectedLocale}</p>
                    <p className="text-sm text-muted-foreground">{languages.find(l => l.locale === selectedLocale)?.native_name}</p>
                  </div>
                  <Badge variant="default" className="bg-green-500"><Check className="h-3 w-3 mr-1" />Activo</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500" />Idiomas Populares</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {popularLanguages.map((lang) => (
                    <button key={lang.locale} onClick={() => handleSelectLanguage(lang.locale)} disabled={downloading}
                      className={`p-4 rounded-lg border text-left transition-all hover:border-primary hover:bg-primary/5 ${selectedLocale === lang.locale ? 'border-primary bg-primary/10' : 'border-border'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getLocaleFlag(lang.locale)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{lang.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={lang.translation_progress || 0} className="h-1 flex-1" />
                            <span className={`text-xs ${getProgressColor(lang.translation_progress || 0)}`}>{lang.translation_progress || 0}%</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Sparkles className="h-6 w-6 text-blue-500 mt-1" />
                  <div>
                    <p className="font-medium">Traducciones con Inteligencia Artificial</p>
                    <p className="text-sm text-muted-foreground mt-1">Las traducciones son generadas automáticamente con IA y revisadas por nuestro equipo.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Todos los Idiomas</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar idioma..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredLanguages.map((lang) => (
                    <button key={lang.locale} onClick={() => handleSelectLanguage(lang.locale)} disabled={downloading}
                      className={`p-4 rounded-lg border text-left transition-all hover:border-primary hover:bg-primary/5 ${selectedLocale === lang.locale ? 'border-primary bg-primary/10' : 'border-border'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getLocaleFlag(lang.locale)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{lang.name}</p>
                            {selectedLocale === lang.locale && <Check className="h-4 w-4 text-green-500 flex-shrink-0" />}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{lang.native_name}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Progress value={lang.translation_progress || 0} className="h-1.5 flex-1" />
                            <span className={`text-xs font-medium ${getProgressColor(lang.translation_progress || 0)}`}>{lang.translation_progress || 0}%</span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
