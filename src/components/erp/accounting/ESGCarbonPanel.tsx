/**
 * ESGCarbonPanel - Panel de contabilidad ESG y huella de carbono
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Leaf,
  Globe,
  Factory,
  Zap,
  Droplets,
  Recycle,
  TrendingDown,
  Award,
  FileText,
  RefreshCw,
  Loader2,
  Target,
  AlertTriangle
} from 'lucide-react';
import { HelpTooltip } from './HelpTooltip';
import { supabase } from '@/integrations/supabase/client';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CarbonMetrics {
  scope1_emissions: number;
  scope2_emissions: number;
  scope3_emissions: number;
  total_emissions: number;
  reduction_target: number;
  current_reduction: number;
  carbon_intensity: number;
}

interface ESGScore {
  environmental: number;
  social: number;
  governance: number;
  overall: number;
  trend: 'improving' | 'stable' | 'declining';
}

interface CSRDCompliance {
  is_compliant: boolean;
  requirements_met: number;
  total_requirements: number;
  next_deadline: string;
  missing_requirements: string[];
}

interface ESGCarbonPanelProps {
  className?: string;
}

export function ESGCarbonPanel({ className }: ESGCarbonPanelProps) {
  const { currentCompany } = useERPContext();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('carbon');
  const [carbonMetrics, setCarbonMetrics] = useState<CarbonMetrics | null>(null);
  const [esgScore, setEsgScore] = useState<ESGScore | null>(null);
  const [csrdCompliance, setCsrdCompliance] = useState<CSRDCompliance | null>(null);

  const handleFetchData = useCallback(async () => {
    if (!currentCompany?.id) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('erp-esg-carbon-accounting', {
        body: {
          action: 'get_full_report',
          params: {
            company_id: currentCompany.id,
            year: new Date().getFullYear()
          }
        }
      });

      if (error) throw error;

      if (data?.success) {
        setCarbonMetrics(data.carbon_metrics);
        setEsgScore(data.esg_score);
        setCsrdCompliance(data.csrd_compliance);
        toast.success('Datos ESG actualizados');
      }
    } catch (err) {
      console.error('[ESGCarbonPanel] Error:', err);
      toast.error('Error cargando datos ESG');
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatEmissions = (value: number) => {
    return `${value.toLocaleString('es-ES')} tCO₂e`;
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
              <Leaf className="h-4 w-4 text-white" />
            </div>
            ESG & Huella de Carbono
            <HelpTooltip
              type="regulation"
              title="Contabilidad ESG"
              content="Métricas ambientales, sociales y de gobernanza según la Directiva CSRD de la UE."
              regulationRef="CSRD 2022/2464"
            />
          </CardTitle>
          <Button
            onClick={handleFetchData}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="carbon" className="text-xs gap-1">
              <Factory className="h-3 w-3" />
              Carbono
            </TabsTrigger>
            <TabsTrigger value="esg" className="text-xs gap-1">
              <Globe className="h-3 w-3" />
              ESG Score
            </TabsTrigger>
            <TabsTrigger value="csrd" className="text-xs gap-1">
              <FileText className="h-3 w-3" />
              CSRD
            </TabsTrigger>
          </TabsList>

          {/* Carbon Tab */}
          <TabsContent value="carbon" className="mt-0">
            {carbonMetrics ? (
              <div className="space-y-4">
                {/* Total Emissions */}
                <div className="p-4 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Emisiones Totales</span>
                    <Badge variant="outline" className="gap-1">
                      <TrendingDown className="h-3 w-3 text-green-500" />
                      {carbonMetrics.current_reduction}% vs objetivo
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold">{formatEmissions(carbonMetrics.total_emissions)}</p>
                </div>

                {/* Scope Breakdown */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-center">
                    <Factory className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                    <p className="text-xs text-muted-foreground">Alcance 1</p>
                    <p className="font-bold text-sm text-blue-600">
                      {formatEmissions(carbonMetrics.scope1_emissions)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 text-center">
                    <Zap className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
                    <p className="text-xs text-muted-foreground">Alcance 2</p>
                    <p className="font-bold text-sm text-yellow-600">
                      {formatEmissions(carbonMetrics.scope2_emissions)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-center">
                    <Recycle className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                    <p className="text-xs text-muted-foreground">Alcance 3</p>
                    <p className="font-bold text-sm text-purple-600">
                      {formatEmissions(carbonMetrics.scope3_emissions)}
                    </p>
                  </div>
                </div>

                {/* Reduction Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Target className="h-4 w-4 text-green-600" />
                      Objetivo Net Zero
                    </span>
                    <span className="text-muted-foreground">
                      {carbonMetrics.current_reduction}% / {carbonMetrics.reduction_target}%
                    </span>
                  </div>
                  <Progress 
                    value={(carbonMetrics.current_reduction / carbonMetrics.reduction_target) * 100} 
                    className="h-2 [&>div]:bg-green-600"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Factory className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Carga los datos para ver la huella de carbono</p>
              </div>
            )}
          </TabsContent>

          {/* ESG Score Tab */}
          <TabsContent value="esg" className="mt-0">
            {esgScore ? (
              <div className="space-y-4">
                {/* Overall Score */}
                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                  <Award className={cn("h-8 w-8 mx-auto mb-2", getScoreColor(esgScore.overall))} />
                  <p className={cn("text-4xl font-bold", getScoreColor(esgScore.overall))}>
                    {esgScore.overall}
                  </p>
                  <p className="text-sm text-muted-foreground">Puntuación ESG Global</p>
                </div>

                {/* Individual Scores */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Leaf className="h-4 w-4 text-green-600" />
                        Environmental
                      </span>
                      <span className={cn("font-medium", getScoreColor(esgScore.environmental))}>
                        {esgScore.environmental}/100
                      </span>
                    </div>
                    <Progress value={esgScore.environmental} className="h-2 [&>div]:bg-green-600" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-600" />
                        Social
                      </span>
                      <span className={cn("font-medium", getScoreColor(esgScore.social))}>
                        {esgScore.social}/100
                      </span>
                    </div>
                    <Progress value={esgScore.social} className="h-2 [&>div]:bg-blue-600" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-purple-600" />
                        Governance
                      </span>
                      <span className={cn("font-medium", getScoreColor(esgScore.governance))}>
                        {esgScore.governance}/100
                      </span>
                    </div>
                    <Progress value={esgScore.governance} className="h-2 [&>div]:bg-purple-600" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Carga los datos para ver la puntuación ESG</p>
              </div>
            )}
          </TabsContent>

          {/* CSRD Tab */}
          <TabsContent value="csrd" className="mt-0">
            {csrdCompliance ? (
              <div className="space-y-4">
                {/* Compliance Status */}
                <div className={cn(
                  "p-4 rounded-lg text-center",
                  csrdCompliance.is_compliant 
                    ? 'bg-green-50 dark:bg-green-950/30' 
                    : 'bg-yellow-50 dark:bg-yellow-950/30'
                )}>
                  {csrdCompliance.is_compliant ? (
                    <Award className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                  )}
                  <p className={cn(
                    "font-bold",
                    csrdCompliance.is_compliant ? 'text-green-600' : 'text-yellow-600'
                  )}>
                    {csrdCompliance.is_compliant ? 'Cumple CSRD' : 'Cumplimiento Parcial'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {csrdCompliance.requirements_met}/{csrdCompliance.total_requirements} requisitos
                  </p>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progreso de cumplimiento</span>
                    <span className="text-muted-foreground">
                      {Math.round((csrdCompliance.requirements_met / csrdCompliance.total_requirements) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={(csrdCompliance.requirements_met / csrdCompliance.total_requirements) * 100} 
                    className="h-2"
                  />
                </div>

                {/* Missing Requirements */}
                {csrdCompliance.missing_requirements.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Requisitos pendientes:</p>
                    <ul className="space-y-1">
                      {csrdCompliance.missing_requirements.slice(0, 3).map((req, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                          <AlertTriangle className="h-3 w-3 mt-0.5 text-yellow-500 flex-shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Next Deadline */}
                <div className="p-3 rounded-lg bg-muted/50 text-center text-sm">
                  <span className="text-muted-foreground">Próximo vencimiento: </span>
                  <span className="font-medium">{csrdCompliance.next_deadline}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Carga los datos para ver el estado CSRD</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ESGCarbonPanel;
