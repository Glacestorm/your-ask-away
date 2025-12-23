import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckSquare, 
  AlertTriangle, 
  Eye, 
  Save, 
  SkipForward,
  Loader2,
  CheckCircle,
  XCircle,
  Languages
} from 'lucide-react';
import { SupportedLanguage } from '@/hooks/useSupportedLanguages';

interface Translation {
  id: string;
  locale: string;
  translation_key: string;
  value: string;
  namespace: string;
  is_reviewed: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

interface TranslationVerificationPanelProps {
  languages: SupportedLanguage[];
}

export const TranslationVerificationPanel: React.FC<TranslationVerificationPanelProps> = ({
  languages
}) => {
  const { toast } = useToast();
  const [selectedLocale, setSelectedLocale] = useState<string>('');
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editedValue, setEditedValue] = useState('');
  const [sourceValue, setSourceValue] = useState('');
  const [filter, setFilter] = useState<'all' | 'unverified' | 'verified'>('unverified');
  const [stats, setStats] = useState({ total: 0, verified: 0, unverified: 0 });

  // Non-base languages only
  const targetLanguages = languages.filter(l => !['es', 'en', 'ca', 'fr'].includes(l.locale));

  useEffect(() => {
    if (selectedLocale) {
      loadTranslations();
    }
  }, [selectedLocale, filter]);

  const loadTranslations = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('cms_translations')
        .select('id, locale, translation_key, value, namespace, is_reviewed, reviewed_by, reviewed_at')
        .eq('locale', selectedLocale)
        .order('translation_key');

      if (filter === 'unverified') {
        query = query.or('is_reviewed.is.null,is_reviewed.eq.false');
      } else if (filter === 'verified') {
        query = query.eq('is_reviewed', true);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      
      setTranslations(data || []);
      setCurrentIndex(0);
      
      if (data && data.length > 0) {
        setEditedValue(data[0].value || '');
        loadSourceValue(data[0].translation_key);
      }

      // Load stats
      const { count: totalCount } = await supabase
        .from('cms_translations')
        .select('*', { count: 'exact', head: true })
        .eq('locale', selectedLocale);

      const { count: verifiedCount } = await supabase
        .from('cms_translations')
        .select('*', { count: 'exact', head: true })
        .eq('locale', selectedLocale)
        .eq('is_reviewed', true);

      setStats({
        total: totalCount || 0,
        verified: verifiedCount || 0,
        unverified: (totalCount || 0) - (verifiedCount || 0)
      });
    } catch (error) {
      console.error('Error loading translations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load translations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSourceValue = async (key: string) => {
    const { data } = await supabase
      .from('cms_translations')
      .select('value')
      .eq('locale', 'es')
      .eq('translation_key', key)
      .maybeSingle();
    
    setSourceValue(data?.value || key);
  };

  const handleVerify = async (approved: boolean) => {
    const current = translations[currentIndex];
    if (!current) return;

    try {
      const { error } = await supabase
        .from('cms_translations')
        .update({
          value: editedValue,
          is_verified: approved,
          verified_at: new Date().toISOString(),
          verified_by: 'admin' // In real app, use actual user ID
        })
        .eq('id', current.id);

      if (error) throw error;

      toast({
        title: approved ? 'Verified' : 'Rejected',
        description: `Translation ${approved ? 'approved' : 'marked for review'}`
      });

      // Move to next
      if (currentIndex < translations.length - 1) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setEditedValue(translations[nextIndex].value || '');
        loadSourceValue(translations[nextIndex].translation_key);
      } else {
        // Reload list
        loadTranslations();
      }
    } catch (error) {
      console.error('Error verifying translation:', error);
      toast({
        title: 'Error',
        description: 'Failed to update translation',
        variant: 'destructive'
      });
    }
  };

  const handleSkip = () => {
    if (currentIndex < translations.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setEditedValue(translations[nextIndex].value || '');
      loadSourceValue(translations[nextIndex].translation_key);
    }
  };

  const currentTranslation = translations[currentIndex];
  const progress = stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel - Language Selection & Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Verification Queue
          </CardTitle>
          <CardDescription>
            Review and verify AI translations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedLocale} onValueChange={setSelectedLocale}>
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {targetLanguages.map(lang => (
                <SelectItem key={lang.locale} value={lang.locale}>
                  <span className="flex items-center gap-2">
                    <span>{lang.flag_emoji || '🌐'}</span>
                    <span>{lang.name}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {lang.translation_progress || 0}%
                    </Badge>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedLocale && (
            <>
              <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Verified</span>
                  <span className="font-medium text-green-600">{stats.verified}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-medium text-amber-600">{stats.unverified}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium">{stats.total}</span>
                </div>
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Verification Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={filter === 'unverified' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('unverified')}
                  className="flex-1"
                >
                  Pending
                </Button>
                <Button
                  variant={filter === 'verified' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('verified')}
                  className="flex-1"
                >
                  Verified
                </Button>
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                  className="flex-1"
                >
                  All
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Right Panel - Verification Interface */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Review Translation
            {currentTranslation && (
              <Badge variant="outline" className="ml-auto">
                {currentIndex + 1} / {translations.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !selectedLocale ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Languages className="h-12 w-12 mb-4 opacity-50" />
              <p>Select a language to start verification</p>
            </div>
          ) : !currentTranslation ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mb-4 text-green-500" />
              <p>All translations verified!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Key */}
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Translation Key</p>
                <code className="text-sm font-mono">{currentTranslation.translation_key}</code>
              </div>

              {/* Source (Spanish) */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🇪🇸</span>
                  <span className="text-sm font-medium">Source (Spanish)</span>
                </div>
                <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                  <p className="text-sm">{sourceValue}</p>
                </div>
              </div>

              {/* Target Translation */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">
                    {targetLanguages.find(l => l.locale === selectedLocale)?.flag_emoji || '🌐'}
                  </span>
                  <span className="text-sm font-medium">
                    Translation ({targetLanguages.find(l => l.locale === selectedLocale)?.name})
                  </span>
                  {currentTranslation.is_reviewed && (
                    <Badge className="bg-green-500/10 text-green-600">Verified</Badge>
                  )}
                </div>
                <Textarea
                  value={editedValue}
                  onChange={(e) => setEditedValue(e.target.value)}
                  rows={4}
                  className="resize-none"
                  placeholder="Translation..."
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t">
                <Button
                  onClick={() => handleVerify(true)}
                  className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </Button>
                <Button
                  onClick={() => handleVerify(false)}
                  variant="destructive"
                  className="flex-1 gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
                <Button
                  onClick={handleSkip}
                  variant="outline"
                  className="gap-2"
                >
                  <SkipForward className="h-4 w-4" />
                  Skip
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
