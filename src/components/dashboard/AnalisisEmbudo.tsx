import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, FunnelChart, Funnel, LabelList } from 'recharts';
import { Loader2, TrendingDown, Users, Target, Award, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FunnelStage {
  name: string;
  value: number;
  percentage: number;
  fill: string;
}

interface CompanyJourney {
  companyId: string;
  companyName: string;
  firstContact: Date;
  totalVisits: number;
  successfulVisits: number;
  productsOffered: number;
  avgVinculacion: number;
  currentStage: string;
}

export const AnalisisEmbudo = () => {
  const [loading, setLoading] = useState(true);
  const [funnelData, setFunnelData] = useState<FunnelStage[]>([]);
  const [journeys, setJourneys] = useState<CompanyJourney[]>([]);
  const [conversionRates, setConversionRates] = useState({
    firstToSecond: 0,
    secondToProduct: 0,
    productToSuccess: 0,
    successToHigh: 0,
  });

  useEffect(() => {
    fetchFunnelData();
  }, []);

  const fetchFunnelData = async () => {
    try {
      setLoading(true);

      // Fetch all visits with company info
      const { data: visits, error: visitsError } = await supabase
        .from('visits')
        .select('*, companies(id, name)')
        .order('visit_date', { ascending: true });

      if (visitsError) throw visitsError;
      if (!visits || visits.length === 0) {
        setFunnelData([]);
        setLoading(false);
        return;
      }

      // Group visits by company
      const companyVisitsMap = new Map<string, any[]>();
      visits.forEach((visit) => {
        const companyId = visit.company_id;
        if (!companyVisitsMap.has(companyId)) {
          companyVisitsMap.set(companyId, []);
        }
        companyVisitsMap.get(companyId)!.push(visit);
      });

      // Analyze each company's journey
      const journeyData: CompanyJourney[] = [];
      let stage1Count = 0; // First contact
      let stage2Count = 0; // 2+ visits
      let stage3Count = 0; // Products offered
      let stage4Count = 0; // At least 1 successful visit
      let stage5Count = 0; // High vinculación (>50%)

      companyVisitsMap.forEach((companyVisits, companyId) => {
        const company = companyVisits[0].companies;
        const totalVisits = companyVisits.length;
        const successfulVisits = companyVisits.filter(v => v.result === 'exitosa').length;
        const productsOffered = companyVisits.reduce((sum, v) => sum + (v.productos_ofrecidos?.length || 0), 0);
        
        const vinculacionVisits = companyVisits.filter(v => v.porcentaje_vinculacion != null);
        const avgVinculacion = vinculacionVisits.length > 0
          ? vinculacionVisits.reduce((sum, v) => sum + (v.porcentaje_vinculacion || 0), 0) / vinculacionVisits.length
          : 0;

        // Determine current stage
        let currentStage = 'Primera Visita';
        stage1Count++;

        if (totalVisits >= 2) {
          currentStage = 'Seguimiento';
          stage2Count++;
        }

        if (productsOffered > 0) {
          currentStage = 'Productos Ofrecidos';
          stage3Count++;
        }

        if (successfulVisits > 0) {
          currentStage = 'Visita Exitosa';
          stage4Count++;
        }

        if (avgVinculacion > 50) {
          currentStage = 'Alta Vinculación';
          stage5Count++;
        }

        journeyData.push({
          companyId,
          companyName: company?.name || 'Desconocido',
          firstContact: new Date(companyVisits[0].visit_date),
          totalVisits,
          successfulVisits,
          productsOffered,
          avgVinculacion,
          currentStage,
        });
      });

      // Calculate funnel stages
      const totalCompanies = companyVisitsMap.size;
      
      const stages: FunnelStage[] = [
        {
          name: '1. Primera Visita',
          value: stage1Count,
          percentage: 100,
          fill: 'hsl(var(--primary))',
        },
        {
          name: '2. Seguimiento (2+ visitas)',
          value: stage2Count,
          percentage: (stage2Count / stage1Count) * 100,
          fill: 'hsl(var(--chart-2))',
        },
        {
          name: '3. Productos Ofrecidos',
          value: stage3Count,
          percentage: (stage3Count / stage2Count) * 100,
          fill: 'hsl(var(--chart-3))',
        },
        {
          name: '4. Visita Exitosa',
          value: stage4Count,
          percentage: (stage4Count / stage3Count) * 100,
          fill: 'hsl(var(--chart-4))',
        },
        {
          name: '5. Alta Vinculación (>50%)',
          value: stage5Count,
          percentage: (stage5Count / stage4Count) * 100,
          fill: 'hsl(var(--chart-5))',
        },
      ];

      setFunnelData(stages);
      setJourneys(journeyData.sort((a, b) => b.firstContact.getTime() - a.firstContact.getTime()).slice(0, 20));
      
      setConversionRates({
        firstToSecond: (stage2Count / stage1Count) * 100,
        secondToProduct: (stage3Count / stage2Count) * 100,
        productToSuccess: (stage4Count / stage3Count) * 100,
        successToHigh: (stage5Count / stage4Count) * 100,
      });

    } catch (error) {
      console.error('Error fetching funnel data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'Primera Visita':
        return <Users className="h-4 w-4" />;
      case 'Seguimiento':
        return <TrendingDown className="h-4 w-4" />;
      case 'Productos Ofrecidos':
        return <Target className="h-4 w-4" />;
      case 'Visita Exitosa':
        return <CheckCircle className="h-4 w-4" />;
      case 'Alta Vinculación':
        return <Award className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Primera Visita':
        return 'default';
      case 'Seguimiento':
        return 'secondary';
      case 'Productos Ofrecidos':
        return 'default';
      case 'Visita Exitosa':
        return 'default';
      case 'Alta Vinculación':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (funnelData.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">
          No hay datos suficientes para el análisis de embudo
        </p>
      </Card>
    );
  }

  const overallConversion = ((funnelData[funnelData.length - 1].value / funnelData[0].value) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">Primera Visita</div>
          </div>
          <div className="text-2xl font-bold">{funnelData[0]?.value || 0}</div>
          <div className="text-xs text-muted-foreground mt-1">100% del total</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">Seguimiento</div>
          </div>
          <div className="text-2xl font-bold">{funnelData[1]?.value || 0}</div>
          <div className="text-xs text-green-600 mt-1">
            {conversionRates.firstToSecond.toFixed(1)}% conversión
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">Con Productos</div>
          </div>
          <div className="text-2xl font-bold">{funnelData[2]?.value || 0}</div>
          <div className="text-xs text-green-600 mt-1">
            {conversionRates.secondToProduct.toFixed(1)}% conversión
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">Exitosas</div>
          </div>
          <div className="text-2xl font-bold">{funnelData[3]?.value || 0}</div>
          <div className="text-xs text-green-600 mt-1">
            {conversionRates.productToSuccess.toFixed(1)}% conversión
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Award className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">Alta Vinculación</div>
          </div>
          <div className="text-2xl font-bold">{funnelData[4]?.value || 0}</div>
          <div className="text-xs text-green-600 mt-1">
            {conversionRates.successToHigh.toFixed(1)}% conversión
          </div>
        </Card>
      </div>

      {/* Conversion Summary */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Resumen de Conversión</h3>
            <p className="text-sm text-muted-foreground">
              Tasa de conversión completa del embudo
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{overallConversion}%</div>
            <div className="text-sm text-muted-foreground">
              {funnelData[4]?.value || 0} de {funnelData[0]?.value || 0} empresas
            </div>
          </div>
        </div>
      </Card>

      {/* Funnel Visualization */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Visualización del Embudo</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={funnelData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 150, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={140} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as FunnelStage;
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-semibold">{data.name}</p>
                      <p className="text-sm">Empresas: {data.value}</p>
                      <p className="text-sm">Conversión: {data.percentage.toFixed(1)}%</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="value" radius={[0, 8, 8, 0]}>
              {funnelData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <LabelList dataKey="value" position="right" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Drop-off Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Análisis de Abandono</h3>
        <div className="space-y-4">
          {funnelData.slice(0, -1).map((stage, index) => {
            const nextStage = funnelData[index + 1];
            const dropOff = stage.value - nextStage.value;
            const dropOffPercentage = ((dropOff / stage.value) * 100).toFixed(1);
            
            return (
              <div key={stage.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-semibold text-sm mb-1">
                    {stage.name} → {nextStage.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {dropOff} empresas abandonaron ({dropOffPercentage}% de pérdida)
                  </div>
                </div>
                <Badge variant={parseFloat(dropOffPercentage) > 50 ? 'destructive' : 'secondary'}>
                  {dropOffPercentage}%
                </Badge>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recent Company Journeys */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recorridos Recientes de Empresas</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-semibold">Empresa</th>
                <th className="text-center p-2 font-semibold">Visitas</th>
                <th className="text-center p-2 font-semibold">Exitosas</th>
                <th className="text-center p-2 font-semibold">Productos</th>
                <th className="text-center p-2 font-semibold">Vinculación</th>
                <th className="text-center p-2 font-semibold">Etapa Actual</th>
              </tr>
            </thead>
            <tbody>
              {journeys.map((journey) => (
                <tr key={journey.companyId} className="border-b hover:bg-muted/50">
                  <td className="p-2">{journey.companyName}</td>
                  <td className="text-center p-2">{journey.totalVisits}</td>
                  <td className="text-center p-2">{journey.successfulVisits}</td>
                  <td className="text-center p-2">{journey.productsOffered}</td>
                  <td className="text-center p-2">{journey.avgVinculacion.toFixed(0)}%</td>
                  <td className="text-center p-2">
                    <Badge variant={getStageColor(journey.currentStage)} className="gap-1">
                      {getStageIcon(journey.currentStage)}
                      {journey.currentStage}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Insights & Recommendations */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Insights y Recomendaciones</h3>
        <div className="space-y-3">
          {conversionRates.firstToSecond < 50 && (
            <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10">
              <p className="font-semibold text-sm">⚠️ Baja tasa de seguimiento</p>
              <p className="text-sm text-muted-foreground mt-1">
                Solo el {conversionRates.firstToSecond.toFixed(1)}% de las empresas reciben seguimiento. 
                Considera implementar un sistema de recordatorios automáticos.
              </p>
            </div>
          )}
          
          {conversionRates.secondToProduct < 60 && (
            <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10">
              <p className="font-semibold text-sm">⚠️ Oportunidad en ofertas de productos</p>
              <p className="text-sm text-muted-foreground mt-1">
                Solo el {conversionRates.secondToProduct.toFixed(1)}% de empresas con seguimiento reciben ofertas. 
                Capacita al equipo en técnicas de cross-selling.
              </p>
            </div>
          )}

          {conversionRates.productToSuccess < 40 && (
            <div className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10">
              <p className="font-semibold text-sm">🚨 Tasa de éxito crítica</p>
              <p className="text-sm text-muted-foreground mt-1">
                Solo el {conversionRates.productToSuccess.toFixed(1)}% de ofertas resultan exitosas. 
                Revisa la calidad de las ofertas y el timing de presentación.
              </p>
            </div>
          )}

          {conversionRates.successToHigh > 70 && (
            <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/10">
              <p className="font-semibold text-sm">✅ Excelente vinculación</p>
              <p className="text-sm text-muted-foreground mt-1">
                El {conversionRates.successToHigh.toFixed(1)}% de visitas exitosas logran alta vinculación. 
                ¡Mantén este enfoque en relaciones a largo plazo!
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
