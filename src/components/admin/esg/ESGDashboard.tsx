/**
 * ESG Dashboard
 * Dashboard principal de ESG & Sustainability
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Leaf, 
  Users, 
  Building2, 
  TrendingUp, 
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  FileText,
  Globe,
  Recycle,
  Zap,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';
import { useESGCompliance } from '@/hooks/admin/esg';
import { CarbonFootprintPanel } from './CarbonFootprintPanel';
import { ESGScoringPanel } from './ESGScoringPanel';
import { SustainabilityReportsPanel } from './SustainabilityReportsPanel';
import { cn } from '@/lib/utils';

interface ESGDashboardProps {
  organizationId?: string;
  industry?: string;
  className?: string;
}

export function ESGDashboard({ organizationId, industry = 'technology', className }: ESGDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    isLoading,
    carbonFootprint,
    esgScore,
    targets,
    benchmarks,
    calculateCarbonFootprint,
    assessESGRisk,
    getBenchmarks,
    trackTargets
  } = useESGCompliance();

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      await getBenchmarks(industry);
      
      // Demo data para mostrar
      await calculateCarbonFootprint({
        electricity_kwh: 150000,
        natural_gas_m3: 5000,
        diesel_l: 2000,
        company_vehicle_km: 50000,
        flight_km: 25000,
        train_km: 10000,
        waste_kg: 5000,
        water_m3: 1000,
        paper_kg: 500
      }, { region: 'europe', employees: 50, revenue: 5000000 });

      await assessESGRisk(industry, {
        has_environmental_policy: true,
        renewable_energy_percent: 35,
        diversity_ratio: 0.42,
        board_independence: 0.6,
        has_whistleblower_policy: true
      });

      await trackTargets([
        { name: 'Reducción CO2 2030', baseline: 1000, target: 500, current: 750, deadline: '2030-12-31' },
        { name: 'Energía renovable', baseline: 20, target: 100, current: 45, deadline: '2030-12-31' },
        { name: 'Residuos reciclados', baseline: 30, target: 80, current: 55, deadline: '2025-12-31' },
        { name: 'Diversidad en liderazgo', baseline: 25, target: 50, current: 38, deadline: '2026-12-31' }
      ]);
    };

    loadInitialData();
  }, [industry]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await getBenchmarks(industry);
    setIsRefreshing(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getRatingBadgeColor = (rating: string) => {
    if (rating?.startsWith('AAA') || rating?.startsWith('AA')) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (rating?.startsWith('A') || rating?.startsWith('BBB')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (rating?.startsWith('BB') || rating?.startsWith('B')) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            ESG & Sustainability
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestión ambiental, social y de gobernanza
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Actualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ESG Score */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ESG Score</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={cn("text-3xl font-bold", getScoreColor(esgScore?.overall_score || 0))}>
                    {esgScore?.overall_score || '--'}
                  </span>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
                {esgScore?.rating && (
                  <Badge className={cn("mt-2", getRatingBadgeColor(esgScore.rating))}>
                    Rating: {esgScore.rating}
                  </Badge>
                )}
              </div>
              <div className="p-3 rounded-full bg-primary/20">
                <Target className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Huella de Carbono */}
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Huella de Carbono</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold text-green-500">
                    {carbonFootprint?.total_emissions_tons?.toFixed(1) || '--'}
                  </span>
                  <span className="text-sm text-muted-foreground">tCO₂e</span>
                </div>
                <div className="flex items-center gap-1 mt-2 text-sm">
                  <TrendingDown className="h-4 w-4 text-green-500" />
                  <span className="text-green-500">-12%</span>
                  <span className="text-muted-foreground">vs año anterior</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-green-500/20">
                <Globe className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Objetivos en Track */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Objetivos en Track</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold text-blue-500">
                    {targets.filter(t => t.on_track).length}
                  </span>
                  <span className="text-sm text-muted-foreground">de {targets.length}</span>
                </div>
                <Progress 
                  value={targets.length > 0 ? (targets.filter(t => t.on_track).length / targets.length) * 100 : 0} 
                  className="mt-2 h-2"
                />
              </div>
              <div className="p-3 rounded-full bg-blue-500/20">
                <CheckCircle className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Riesgos Activos */}
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Riesgos ESG Activos</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold text-orange-500">
                    {esgScore?.key_risks?.length || 0}
                  </span>
                  <span className="text-sm text-muted-foreground">identificados</span>
                </div>
                <Badge variant="outline" className="mt-2 text-orange-500 border-orange-500/30">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {targets.filter(t => !t.on_track).length} objetivos en riesgo
                </Badge>
              </div>
              <div className="p-3 rounded-full bg-orange-500/20">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de contenido */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Visión General
          </TabsTrigger>
          <TabsTrigger value="carbon" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Huella de Carbono
          </TabsTrigger>
          <TabsTrigger value="scoring" className="flex items-center gap-2">
            <Leaf className="h-4 w-4" />
            Scoring ESG
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reportes
          </TabsTrigger>
          <TabsTrigger value="targets" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Objetivos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Desglose ESG */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-green-500" />
                  Desglose ESG
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-2">
                      <Globe className="h-4 w-4 text-green-500" />
                      Environmental
                    </span>
                    <span className={cn("font-semibold", getScoreColor(esgScore?.environmental?.score || 0))}>
                      {esgScore?.environmental?.score || 0}
                    </span>
                  </div>
                  <Progress value={esgScore?.environmental?.score || 0} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      Social
                    </span>
                    <span className={cn("font-semibold", getScoreColor(esgScore?.social?.score || 0))}>
                      {esgScore?.social?.score || 0}
                    </span>
                  </div>
                  <Progress value={esgScore?.social?.score || 0} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-purple-500" />
                      Governance
                    </span>
                    <span className={cn("font-semibold", getScoreColor(esgScore?.governance?.score || 0))}>
                      {esgScore?.governance?.score || 0}
                    </span>
                  </div>
                  <Progress value={esgScore?.governance?.score || 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Emisiones por Scope */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Recycle className="h-5 w-5 text-emerald-500" />
                  Emisiones por Scope
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                  <div>
                    <p className="text-sm font-medium">Scope 1</p>
                    <p className="text-xs text-muted-foreground">Emisiones directas</p>
                  </div>
                  <span className="text-lg font-bold text-red-500">
                    {carbonFootprint?.scope1?.total?.toFixed(0) || 0} kg
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10">
                  <div>
                    <p className="text-sm font-medium">Scope 2</p>
                    <p className="text-xs text-muted-foreground">Energía indirecta</p>
                  </div>
                  <span className="text-lg font-bold text-yellow-500">
                    {carbonFootprint?.scope2?.total?.toFixed(0) || 0} kg
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10">
                  <div>
                    <p className="text-sm font-medium">Scope 3</p>
                    <p className="text-xs text-muted-foreground">Cadena de valor</p>
                  </div>
                  <span className="text-lg font-bold text-orange-500">
                    {carbonFootprint?.scope3?.total?.toFixed(0) || 0} kg
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Objetivos Prioritarios */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  Objetivos Prioritarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {targets.map((target, idx) => (
                      <div key={idx} className="p-3 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium truncate">{target.name}</span>
                          <Badge variant={target.on_track ? "default" : "destructive"} className="text-xs">
                            {target.on_track ? 'En track' : 'En riesgo'}
                          </Badge>
                        </div>
                        <Progress value={target.progress} className="h-2" />
                        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                          <span>Progreso: {target.progress}%</span>
                          <span>Meta: {target.deadline}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* ODS Alineados y Plan de Acción */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">ODS Alineados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(esgScore?.sdg_alignment || ['SDG 7', 'SDG 12', 'SDG 13']).map((sdg, idx) => (
                    <Badge key={idx} variant="outline" className="text-sm">
                      {sdg}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Plan de Acción</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(esgScore?.action_plan || ['Establecer objetivos SBTi', 'Crear comité ESG', 'Publicar informe CSRD']).slice(0, 4).map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      {action}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="carbon" className="mt-6">
          <CarbonFootprintPanel industry={industry} />
        </TabsContent>

        <TabsContent value="scoring" className="mt-6">
          <ESGScoringPanel industry={industry} />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <SustainabilityReportsPanel />
        </TabsContent>

        <TabsContent value="targets" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Seguimiento de Objetivos Climáticos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {targets.map((target, idx) => (
                  <Card key={idx} className={cn(
                    "border",
                    target.on_track ? "border-green-500/30 bg-green-500/5" : "border-orange-500/30 bg-orange-500/5"
                  )}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{target.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Fecha límite: {new Date(target.deadline).toLocaleDateString('es')}
                          </p>
                        </div>
                        <Badge variant={target.on_track ? "default" : "destructive"}>
                          {target.on_track ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> En track</>
                          ) : (
                            <><AlertTriangle className="h-3 w-3 mr-1" /> En riesgo</>
                          )}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Baseline: {target.baseline}</span>
                          <span>Actual: {target.current}</span>
                          <span>Objetivo: {target.target}</span>
                        </div>
                        <Progress value={target.progress} className="h-3" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progreso: {target.progress}%</span>
                          <span>Esperado: {target.expected_progress}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Reducción anual necesaria: {target.annual_reduction_needed?.toFixed(1)} unidades/año
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ESGDashboard;
