import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Database,
  Upload,
  Zap
} from 'lucide-react';
import { SupportedLanguage } from '@/hooks/useSupportedLanguages';
import esTranslations from '@/locales/es';

interface TranslationJob {
  locale: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  message?: string;
}

interface TranslationBatchPanelProps {
  languages: SupportedLanguage[];
  onComplete: () => void;
}

export const TranslationBatchPanel: React.FC<TranslationBatchPanelProps> = ({
  languages,
  onComplete
}) => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Record<string, TranslationJob>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [selectedTiers, setSelectedTiers] = useState<number[]>([1, 2]);
  const [isSeeding, setIsSeeding] = useState(false);
  const [spanishKeysCount, setSpanishKeysCount] = useState<number | null>(null);

  const translationKeys = Object.keys(esTranslations);
  const totalKeys = translationKeys.length;

  useEffect(() => {
    checkSpanishKeys();
  }, []);

  const checkSpanishKeys = async () => {
    const { count } = await supabase
      .from('cms_translations')
      .select('*', { count: 'exact', head: true })
      .eq('locale', 'es');
    setSpanishKeysCount(count || 0);
  };

  const handleSeedSpanish = async () => {
    setIsSeeding(true);
    try {
      const BATCH_SIZE = 50;
      const entries = Object.entries(esTranslations);
      
      for (let i = 0; i < entries.length; i += BATCH_SIZE) {
        const batch = entries.slice(i, i + BATCH_SIZE);
        const items = batch.map(([key, value]) => ({
          locale: 'es',
          translation_key: key,
          value: value,
          namespace: 'ui'
        }));

        const { error } = await supabase
          .from('cms_translations')
          .upsert(items, { onConflict: 'locale,translation_key' });

        if (error) throw error;
      }

      setSpanishKeysCount(entries.length);
      toast({
        title: 'Base sincronizada',
        description: `${entries.length} claves españolas añadidas`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al sincronizar base española',
        variant: 'destructive'
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const translateLanguage = useCallback(async (locale: string): Promise<boolean> => {
    const BATCH_SIZE = 25;
    
    setJobs(prev => ({
      ...prev,
      [locale]: { locale, status: 'running', progress: 0, message: 'Iniciando...' }
    }));

    try {
      const { data: existing } = await supabase
        .from('cms_translations')
        .select('translation_key')
        .eq('locale', locale);

      const existingKeys = new Set(existing?.map(e => e.translation_key) || []);
      const keysToTranslate = translationKeys.filter(k => !existingKeys.has(k));

      if (keysToTranslate.length === 0) {
        setJobs(prev => ({
          ...prev,
          [locale]: { locale, status: 'completed', progress: 100, message: 'Ya completo' }
        }));
        return true;
      }

      const batches = [];
      for (let i = 0; i < keysToTranslate.length; i += BATCH_SIZE) {
        batches.push(keysToTranslate.slice(i, i + BATCH_SIZE));
      }

      let completed = 0;
      for (const batch of batches) {
        const items = batch.map(key => ({
          key,
          text: esTranslations[key as keyof typeof esTranslations],
          namespace: 'ui'
        }));

        const { error } = await supabase.functions.invoke('cms-batch-translate', {
          body: {
            items,
            sourceLocale: 'es',
            targetLocale: locale,
            saveToDb: true
          }
        });

        if (error) throw new Error(error.message);

        completed += batch.length;
        const progress = Math.round((completed / keysToTranslate.length) * 100);
        
        setJobs(prev => ({
          ...prev,
          [locale]: { 
            locale, 
            status: 'running', 
            progress, 
            message: `${completed}/${keysToTranslate.length}` 
          }
        }));
      }

      setJobs(prev => ({
        ...prev,
        [locale]: { locale, status: 'completed', progress: 100, message: '¡Completado!' }
      }));

      return true;
    } catch (error) {
      setJobs(prev => ({
        ...prev,
        [locale]: { 
          locale, 
          status: 'error', 
          progress: 0, 
          message: error instanceof Error ? error.message : 'Error' 
        }
      }));
      return false;
    }
  }, [translationKeys]);

  const handleTranslateAll = async () => {
    setIsTranslating(true);
    
    // Exclude base static languages (es, ca, fr, en) but include regional languages like eu, gl, etc.
    const targetLanguages = languages.filter(
      l => selectedTiers.includes(l.tier || 1) && 
           !['es', 'ca', 'fr', 'en'].includes(l.locale) && 
           l.is_active
    );

    toast({
      title: 'Traducción iniciada',
      description: `Traduciendo a ${targetLanguages.length} idiomas...`
    });

    for (const lang of targetLanguages) {
      await translateLanguage(lang.locale);
      await new Promise(r => setTimeout(r, 1000));
    }

    setIsTranslating(false);
    onComplete();
    
    toast({
      title: 'Traducción completada',
      description: 'Todas las traducciones han sido procesadas.'
    });
  };

  const getTierConfig = (tier: number) => {
    const configs: Record<number, { label: string; color: string }> = {
      1: { label: 'Core', color: 'bg-primary/10 text-primary' },
      2: { label: 'Extended', color: 'bg-blue-500/10 text-blue-600' },
      3: { label: 'Regional', color: 'bg-amber-500/10 text-amber-600' },
      4: { label: 'Specialized', color: 'bg-purple-500/10 text-purple-600' },
    };
    return configs[tier] || { label: 'Other', color: 'bg-muted text-muted-foreground' };
  };

  // Group languages by tier, excluding only base static languages
  const groupedByTier = languages
    .filter(l => l.is_active && !['es', 'ca', 'fr', 'en'].includes(l.locale))
    .reduce((acc, lang) => {
      const tier = lang.tier || 1;
      if (!acc[tier]) acc[tier] = [];
      acc[tier].push(lang);
      return acc;
    }, {} as Record<number, SupportedLanguage[]>);

  return (
    <div className="space-y-6">
      {/* Spanish Base Sync */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Database className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium">Base Española en DB</p>
                <p className="text-sm text-muted-foreground">
                  {spanishKeysCount !== null ? `${spanishKeysCount} / ${totalKeys} claves` : 'Cargando...'}
                </p>
              </div>
            </div>
            <Button
              onClick={handleSeedSpanish}
              disabled={isSeeding || spanishKeysCount === totalKeys}
              variant={spanishKeysCount === totalKeys ? 'outline' : 'default'}
              className="gap-2"
            >
              {isSeeding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : spanishKeysCount === totalKeys ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {spanishKeysCount === totalKeys ? 'Sincronizado' : 'Sincronizar Base'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tier Selection & Action */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Traducción por Lotes
              </CardTitle>
              <CardDescription>
                Selecciona los niveles a traducir con IA
              </CardDescription>
            </div>
            <Button
              onClick={handleTranslateAll}
              disabled={isTranslating || selectedTiers.length === 0}
              size="lg"
              className="gap-2"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Traduciendo...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Iniciar Traducción
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tier Toggles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(tier => {
              const config = getTierConfig(tier);
              const count = groupedByTier[tier]?.length || 0;
              
              return (
                <div 
                  key={tier} 
                  className={`p-4 rounded-lg border transition-colors ${
                    selectedTiers.includes(tier) ? 'border-primary bg-primary/5' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={config.color}>{config.label}</Badge>
                    <Switch
                      checked={selectedTiers.includes(tier)}
                      onCheckedChange={(checked) => {
                        setSelectedTiers(prev => 
                          checked ? [...prev, tier] : prev.filter(t => t !== tier)
                        );
                      }}
                      disabled={false}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {count} idiomas
                  </p>
                </div>
              );
            })}
          </div>

          {/* Jobs Progress */}
          {Object.keys(jobs).length > 0 && (
            <ScrollArea className="h-[300px] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.values(jobs).map(job => {
                  const lang = languages.find(l => l.locale === job.locale);
                  
                  return (
                    <div
                      key={job.locale}
                      className={`p-3 rounded-lg border ${
                        job.status === 'completed' ? 'border-green-500/30 bg-green-500/5' :
                        job.status === 'error' ? 'border-red-500/30 bg-red-500/5' :
                        job.status === 'running' ? 'border-primary/30 bg-primary/5' :
                        'bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span>{lang?.flag_emoji || '🌐'}</span>
                          <span className="font-medium text-sm">{lang?.name || job.locale}</span>
                        </div>
                        {job.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {job.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                        {job.status === 'running' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                      </div>
                      <Progress value={job.progress} className="h-1.5 mb-1" />
                      <p className="text-xs text-muted-foreground">{job.message}</p>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
