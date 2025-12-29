/**
 * Grants Intelligence Panel
 * Phase 15 Extended: Strategic Financial Agent
 * Módulo de inteligencia de subvenciones y ayudas públicas
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  RefreshCw, 
  Sparkles, 
  Award, 
  Calendar,
  Euro,
  Target,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Building2,
  Globe
} from 'lucide-react';
import { useObelixiaGrantsIntelligence } from '@/hooks/admin/obelixia-accounting';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function GrantsIntelligencePanel() {
  const [activeTab, setActiveTab] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    grants,
    applications,
    isLoading,
    fetchGrants,
    fetchApplications,
    searchGrants,
    analyzeEligibility
  } = useObelixiaGrantsIntelligence();

  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    fetchGrants();
    fetchApplications();
  }, []);

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      await searchGrants({ query: searchQuery });
      setIsSearching(false);
    }
  };

  const handleAnalyze = async (grantId: string) => {
    setIsAnalyzing(true);
    const result = await analyzeEligibility({ grantId });
    setIsAnalyzing(false);
    if (result) {
      toast.success('Análisis de elegibilidad completado');
    }
  };

  const handleApply = async (grantId: string) => {
    toast.success('Solicitud iniciada correctamente');
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'european': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'national': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'regional': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'local': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'submitted': return 'bg-blue-500/10 text-blue-500';
      case 'under_review': return 'bg-amber-500/10 text-amber-500';
      case 'approved': return 'bg-green-500/10 text-green-500';
      case 'rejected': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const activeGrants = grants.filter(g => g.status === 'active');
  const pendingApplications = applications.filter(a => a.status === 'submitted' || a.status === 'under_review');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            Inteligencia de Subvenciones
          </h2>
          <p className="text-muted-foreground">
            Descubre y gestiona ayudas públicas con IA
          </p>
        </div>
        <Button onClick={() => fetchGrants()} disabled={isLoading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Subvenciones Activas</p>
                <p className="text-2xl font-bold">{activeGrants.length}</p>
              </div>
              <Award className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Solicitudes Pendientes</p>
                <p className="text-2xl font-bold">{pendingApplications.length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aprobadas</p>
                <p className="text-2xl font-bold">
                  {applications.filter(a => a.status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Importe Total Solicitado</p>
                <p className="text-2xl font-bold">
                  {applications.reduce((sum, a) => sum + (Number(a.amount_requested) || 0), 0).toLocaleString('es-ES')}€
                </p>
              </div>
              <Euro className="h-8 w-8 text-amber-500/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discover">
            <Search className="h-4 w-4 mr-2" />
            Descubrir
          </TabsTrigger>
          <TabsTrigger value="applications">
            <FileText className="h-4 w-4 mr-2" />
            Mis Solicitudes
          </TabsTrigger>
          <TabsTrigger value="ai-match">
            <Sparkles className="h-4 w-4 mr-2" />
            AI Match
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar subvenciones por sector, tipo, región..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Grants List */}
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {grants.map((grant) => (
                <Card key={grant.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold">{grant.name}</h4>
                          <Badge className={getLevelColor(grant.grant_level || '')}>
                            {grant.grant_level === 'european' && <Globe className="h-3 w-3 mr-1" />}
                            {grant.grant_level === 'national' && <Building2 className="h-3 w-3 mr-1" />}
                            {grant.grant_level}
                          </Badge>
                          <Badge variant="outline">{grant.grant_type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {grant.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Euro className="h-4 w-4 text-green-500" />
                            {Number(grant.max_amount).toLocaleString('es-ES')}€
                          </span>
                          {grant.deadline_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-amber-500" />
                              {format(new Date(grant.deadline_date), 'dd MMM yyyy', { locale: es })}
                            </span>
                          )}
                          <span className="text-muted-foreground">
                            {grant.issuing_organization}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAnalyze(grant.id)}
                          disabled={isAnalyzing}
                        >
                          <Target className="h-4 w-4 mr-1" />
                          Analizar
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleApply(grant.id)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Solicitar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {grants.length === 0 && !isLoading && (
                <div className="text-center py-12 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay subvenciones disponibles</p>
                  <p className="text-sm">Usa la búsqueda para encontrar ayudas</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          <ScrollArea className="h-[550px]">
            <div className="space-y-3">
              {applications.map((app) => (
                <Card key={app.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">Solicitud #{app.id.slice(0, 8)}</h4>
                          <Badge className={getStatusColor(app.status || '')}>
                            {app.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Euro className="h-4 w-4" />
                            Solicitado: {Number(app.requested_amount).toLocaleString('es-ES')}€
                          </span>
                          {app.eligibility_score && (
                            <span className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              Elegibilidad: {app.eligibility_score}%
                            </span>
                          )}
                        </div>
                        {app.eligibility_score && (
                          <Progress value={app.eligibility_score} className="h-2 w-48" />
                        )}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>{format(new Date(app.created_at), 'dd/MM/yyyy', { locale: es })}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {applications.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tienes solicitudes</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="ai-match">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Matching Inteligente con IA
              </CardTitle>
              <CardDescription>
                La IA analiza tu perfil empresarial y encuentra las subvenciones más adecuadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="font-semibold">Análisis de Perfil</p>
                    <p className="text-sm text-muted-foreground">
                      Evaluamos tu sector, tamaño y características
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Target className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="font-semibold">Match de Elegibilidad</p>
                    <p className="text-sm text-muted-foreground">
                      Comparamos requisitos con tu perfil
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Award className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                    <p className="font-semibold">Recomendaciones</p>
                    <p className="text-sm text-muted-foreground">
                      Top subvenciones con mayor probabilidad
                    </p>
                  </CardContent>
                </Card>
              </div>
              <Button className="w-full" size="lg">
                <Sparkles className="h-4 w-4 mr-2" />
                Iniciar Análisis con IA
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default GrantsIntelligencePanel;
