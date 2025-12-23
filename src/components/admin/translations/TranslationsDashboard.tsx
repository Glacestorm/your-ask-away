import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupportedLanguages } from '@/hooks/useSupportedLanguages';
import { useLanguageInstaller } from '@/hooks/admin/useLanguageInstaller';
import { useLanguage } from '@/contexts/LanguageContext';
import { Languages, BarChart3, CheckSquare, Settings } from 'lucide-react';
import { LanguageProgressGrid } from './LanguageProgressGrid';
import { TranslationVerificationPanel } from './TranslationVerificationPanel';
import { TranslationBatchPanel } from './TranslationBatchPanel';
import { TranslationSettingsPanel } from './TranslationSettingsPanel';

export const TranslationsDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { languages, loading, refresh } = useSupportedLanguages();
  const { installLanguage, installingLocale, translationProgress } = useLanguageInstaller({ onComplete: refresh });
  const [activeTab, setActiveTab] = useState('overview');

  const stats = React.useMemo(() => {
    if (!languages.length) return { total: 0, complete: 0, partial: 0, pending: 0, avgProgress: 0 };
    
    const complete = languages.filter(l => l.translation_progress === 100).length;
    const partial = languages.filter(l => l.translation_progress > 0 && l.translation_progress < 100).length;
    const pending = languages.filter(l => l.translation_progress === 0).length;
    const avgProgress = Math.round(languages.reduce((acc, l) => acc + (l.translation_progress || 0), 0) / languages.length);
    
    return { total: languages.length, complete, partial, pending, avgProgress };
  }, [languages]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
            <Languages className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('translations.dashboard.title')}</h1>
            <p className="text-muted-foreground">
              {t('translations.dashboard.subtitle', { count: stats.total })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('translations.stats.complete')}</p>
                <p className="text-2xl font-bold text-green-600">{stats.complete}</p>
              </div>
              <div className="p-2 rounded-full bg-green-500/20">
                <CheckSquare className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('translations.stats.inProgress')}</p>
                <p className="text-2xl font-bold text-amber-600">{stats.partial}</p>
              </div>
              <div className="p-2 rounded-full bg-amber-500/20">
                <BarChart3 className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('translations.stats.pending')}</p>
                <p className="text-2xl font-bold text-red-600">{stats.pending}</p>
              </div>
              <div className="p-2 rounded-full bg-red-500/20">
                <Languages className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('translations.stats.avgProgress')}</p>
                <p className="text-2xl font-bold text-primary">{stats.avgProgress}%</p>
              </div>
              <div className="p-2 rounded-full bg-primary/20">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('translations.tabs.overview')}</span>
          </TabsTrigger>
          <TabsTrigger value="verification" className="gap-2">
            <CheckSquare className="h-4 w-4" />
            <span className="hidden sm:inline">{t('translations.tabs.verification')}</span>
          </TabsTrigger>
          <TabsTrigger value="batch" className="gap-2">
            <Languages className="h-4 w-4" />
            <span className="hidden sm:inline">{t('translations.tabs.batch')}</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">{t('translations.tabs.settings')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <LanguageProgressGrid />
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <TranslationVerificationPanel languages={languages} />
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <TranslationBatchPanel 
            languages={languages} 
            onComplete={refresh}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <TranslationSettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};
