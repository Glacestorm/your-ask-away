import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings, 
  Globe, 
  Save, 
  Loader2,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { SupportedLanguage } from '@/hooks/useSupportedLanguages';

interface TranslationSettingsPanelProps {
  languages: SupportedLanguage[];
  onRefresh: () => void;
}

export const TranslationSettingsPanel: React.FC<TranslationSettingsPanelProps> = ({
  languages,
  onRefresh
}) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleToggleActive = async (lang: SupportedLanguage) => {
    setSaving(lang.locale);
    try {
      const { error } = await supabase
        .from('supported_languages')
        .update({ is_active: !lang.is_active })
        .eq('id', lang.id);

      if (error) throw error;

      toast({
        title: 'Actualizado',
        description: `${lang.name} ${!lang.is_active ? 'activado' : 'desactivado'}`
      });
      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al actualizar idioma',
        variant: 'destructive'
      });
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteTranslations = async (locale: string) => {
    if (!confirm(`¿Eliminar todas las traducciones de ${locale}?`)) return;
    
    setDeleting(locale);
    try {
      const { error } = await supabase
        .from('cms_translations')
        .delete()
        .eq('locale', locale);

      if (error) throw error;

      // Reset progress
      await supabase
        .from('supported_languages')
        .update({ translation_progress: 0 })
        .eq('locale', locale);

      toast({
        title: 'Eliminado',
        description: `Traducciones de ${locale} eliminadas`
      });
      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar traducciones',
        variant: 'destructive'
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleResetProgress = async (locale: string) => {
    try {
      // Recalculate progress
      const { count: esCount } = await supabase
        .from('cms_translations')
        .select('*', { count: 'exact', head: true })
        .eq('locale', 'es');

      const { count: localeCount } = await supabase
        .from('cms_translations')
        .select('*', { count: 'exact', head: true })
        .eq('locale', locale);

      const progress = esCount && localeCount 
        ? Math.round((localeCount / esCount) * 100) 
        : 0;

      await supabase
        .from('supported_languages')
        .update({ translation_progress: progress })
        .eq('locale', locale);

      toast({
        title: 'Recalculado',
        description: `Progreso actualizado: ${progress}%`
      });
      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al recalcular progreso',
        variant: 'destructive'
      });
    }
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

  const groupedByTier = languages.reduce((acc, lang) => {
    const tier = lang.tier || 1;
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(lang);
    return acc;
  }, {} as Record<number, SupportedLanguage[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuración de Idiomas
        </CardTitle>
        <CardDescription>
          Gestiona idiomas activos y traducciones
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {Object.entries(groupedByTier)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([tier, langs]) => {
                const config = getTierConfig(Number(tier));
                
                return (
                  <div key={tier} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className={config.color}>{config.label}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {langs.length} idiomas
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {langs.map(lang => {
                        const isBase = ['es', 'en', 'ca', 'fr'].includes(lang.locale);
                        
                        return (
                          <div
                            key={lang.locale}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              lang.is_active ? 'bg-card' : 'bg-muted/30 opacity-60'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{lang.flag_emoji || '🌐'}</span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{lang.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {lang.locale}
                                  </Badge>
                                  {lang.is_rtl && (
                                    <Badge variant="secondary" className="text-xs">RTL</Badge>
                                  )}
                                  {isBase && (
                                    <Badge className="bg-green-500/10 text-green-600 text-xs">
                                      Base
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {lang.native_name} • {lang.translation_progress || 0}%
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {!isBase && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleResetProgress(lang.locale)}
                                    title="Recalcular progreso"
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteTranslations(lang.locale)}
                                    disabled={deleting === lang.locale}
                                    className="text-destructive hover:text-destructive"
                                    title="Eliminar traducciones"
                                  >
                                    {deleting === lang.locale ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </>
                              )}
                              <Switch
                                checked={lang.is_active}
                                onCheckedChange={() => handleToggleActive(lang)}
                                disabled={saving === lang.locale || isBase}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
