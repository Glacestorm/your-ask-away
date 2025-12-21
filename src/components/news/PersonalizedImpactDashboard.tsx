import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, 
  TrendingUp, 
  Building2, 
  MapPin, 
  Tag,
  Zap,
  AlertTriangle,
  RefreshCw,
  Settings,
  Save,
  Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CompanyProfile {
  id: string;
  company_id: string;
  cnae_codes: string[];
  sectors: string[];
  regions: string[];
  custom_keywords: string[];
  alert_threshold: number;
}

interface PersonalizedScore {
  id: string;
  article_id: string;
  company_id: string;
  personalized_score: number;
  impact_factors: {
    cnae_match?: boolean;
    sector_match?: boolean;
    region_match?: boolean;
    keyword_match?: string[];
  };
  calculated_at: string;
  article?: {
    title: string;
    source: string;
    published_at: string;
  };
}

export const PersonalizedImpactDashboard: React.FC = () => {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [scores, setScores] = useState<PersonalizedScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // Form state
  const [cnaeCodes, setCnaeCodes] = useState('');
  const [sectors, setSectors] = useState('');
  const [regions, setRegions] = useState('');
  const [keywords, setKeywords] = useState('');
  const [alertThreshold, setAlertThreshold] = useState(70);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all company profiles and scores without relying on profiles.company_id
      const { data: companyProfiles } = await supabase
        .from('company_news_profiles')
        .select('*')
        .limit(1);

      if (companyProfiles && companyProfiles.length > 0) {
        const companyProfile = companyProfiles[0];
        setProfile(companyProfile as CompanyProfile);
        setCnaeCodes((companyProfile.cnae_codes || []).join(', '));
        setSectors((companyProfile.sectors || []).join(', '));
        setRegions((companyProfile.regions || []).join(', '));
        setKeywords((companyProfile.custom_keywords || []).join(', '));
        setAlertThreshold(companyProfile.alert_threshold || 70);

        // Get personalized scores
        const { data: scoresData } = await supabase
          .from('personalized_news_scores')
          .select('*')
          .eq('company_id', companyProfile.company_id)
          .order('personalized_score', { ascending: false })
          .limit(20);

        if (scoresData) {
          const typedScores = scoresData.map(s => ({
            ...s,
            impact_factors: (s.impact_factors || {}) as PersonalizedScore['impact_factors'],
            article: undefined
          }));
          setScores(typedScores);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Debes iniciar sesión');
        return;
      }

      // Use a default company_id or create new profile
      const companyId = profile?.company_id || crypto.randomUUID();

      const profilePayload = {
        company_id: companyId,
        cnae_codes: cnaeCodes.split(',').map(s => s.trim()).filter(Boolean),
        sectors: sectors.split(',').map(s => s.trim()).filter(Boolean),
        regions: regions.split(',').map(s => s.trim()).filter(Boolean),
        custom_keywords: keywords.split(',').map(s => s.trim()).filter(Boolean),
        alert_threshold: alertThreshold,
      };

      if (profile) {
        const { error } = await supabase
          .from('company_news_profiles')
          .update(profilePayload)
          .eq('id', profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('company_news_profiles')
          .insert(profilePayload);
        if (error) throw error;
      }

      toast.success('Perfil guardado correctamente');
      fetchData();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Error al guardar perfil');
    } finally {
      setSaving(false);
    }
  };

  const recalculateScores = async () => {
    try {
      setCalculating(true);
      const { error } = await supabase.functions.invoke('calculate-personalized-impact');
      if (error) throw error;
      toast.success('Recalculando scores de impacto...');
      setTimeout(fetchData, 2000);
    } catch (error) {
      console.error('Error calculating:', error);
      toast.error('Error al recalcular');
    } finally {
      setCalculating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-500';
    if (score >= 60) return 'text-orange-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: 'Crítico', variant: 'destructive' as const };
    if (score >= 60) return { label: 'Alto', variant: 'default' as const };
    if (score >= 40) return { label: 'Medio', variant: 'secondary' as const };
    return { label: 'Bajo', variant: 'outline' as const };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" />
            Impacto Personalizado
          </h2>
          <p className="text-muted-foreground">
            Noticias priorizadas según tu sector, CNAE y preferencias
          </p>
        </div>
        <Button onClick={recalculateScores} disabled={calculating}>
          <RefreshCw className={`h-4 w-4 mr-2 ${calculating ? 'animate-spin' : ''}`} />
          Recalcular
        </Button>
      </div>

      <Tabs defaultValue="news" className="space-y-4">
        <TabsList>
          <TabsTrigger value="news">Noticias Relevantes</TabsTrigger>
          <TabsTrigger value="config">Configurar Perfil</TabsTrigger>
        </TabsList>

        <TabsContent value="news">
          {scores.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2">Sin noticias personalizadas aún</h3>
                <p className="text-muted-foreground mb-4">
                  Configura tu perfil empresarial para recibir noticias con impacto personalizado
                </p>
                <Button variant="outline" onClick={() => {}}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar Perfil
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {scores.map((score) => {
                const badge = getScoreBadge(score.personalized_score);
                return (
                  <Card key={score.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                            <span className={`text-2xl font-bold ${getScoreColor(score.personalized_score)}`}>
                              {score.personalized_score}%
                            </span>
                          </div>
                          <h3 className="font-medium mb-1">
                            {score.article?.title || 'Artículo sin título'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {score.article?.source} • {score.article?.published_at && 
                              new Date(score.article.published_at).toLocaleDateString('es-ES')}
                          </p>

                          {/* Impact Factors */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {score.impact_factors.cnae_match && (
                              <Badge variant="outline" className="text-xs">
                                <Building2 className="h-3 w-3 mr-1" />
                                CNAE coincide
                              </Badge>
                            )}
                            {score.impact_factors.sector_match && (
                              <Badge variant="outline" className="text-xs">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Sector relacionado
                              </Badge>
                            )}
                            {score.impact_factors.region_match && (
                              <Badge variant="outline" className="text-xs">
                                <MapPin className="h-3 w-3 mr-1" />
                                Tu región
                              </Badge>
                            )}
                            {score.impact_factors.keyword_match?.map((kw, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                <Tag className="h-3 w-3 mr-1" />
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="w-24">
                          <div className="relative h-24 w-24">
                            <svg className="h-24 w-24 -rotate-90">
                              <circle
                                cx="48"
                                cy="48"
                                r="40"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                className="text-muted"
                              />
                              <circle
                                cx="48"
                                cy="48"
                                r="40"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                strokeDasharray={`${score.personalized_score * 2.51} 251`}
                                className={getScoreColor(score.personalized_score)}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Zap className={`h-6 w-6 ${getScoreColor(score.personalized_score)}`} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Perfil de Noticias Empresarial
              </CardTitle>
              <CardDescription>
                Configura los parámetros para personalizar el impacto de las noticias
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="cnae">Códigos CNAE (separados por coma)</Label>
                  <Input
                    id="cnae"
                    placeholder="6512, 6419, 6920"
                    value={cnaeCodes}
                    onChange={(e) => setCnaeCodes(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Los códigos CNAE de tu actividad principal
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sectors">Sectores de interés</Label>
                  <Input
                    id="sectors"
                    placeholder="Banca, Seguros, Fintech"
                    value={sectors}
                    onChange={(e) => setSectors(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regions">Regiones de operación</Label>
                  <Input
                    id="regions"
                    placeholder="Madrid, Barcelona, Valencia"
                    value={regions}
                    onChange={(e) => setRegions(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">Palabras clave personalizadas</Label>
                  <Input
                    id="keywords"
                    placeholder="ESG, sostenibilidad, digitalización"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Umbral de alerta: {alertThreshold}%</Label>
                <input
                  type="range"
                  min="30"
                  max="90"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Recibirás alertas cuando una noticia supere este score de impacto
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-700 dark:text-blue-400">
                    ¿Cómo funciona el scoring personalizado?
                  </p>
                  <p className="text-blue-600 dark:text-blue-300 mt-1">
                    Analizamos cada noticia contra tu perfil empresarial. Las coincidencias 
                    en CNAE, sector, región y palabras clave aumentan el score de impacto.
                    Las noticias con mayor score son las más relevantes para tu negocio.
                  </p>
                </div>
              </div>

              <Button onClick={saveProfile} disabled={saving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar Perfil'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PersonalizedImpactDashboard;
