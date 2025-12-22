import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Grid3X3, 
  TrendingUp, 
  Users,
  DollarSign
} from 'lucide-react';
import { useRevenueIntelligence } from '@/hooks/useRevenueIntelligence';
import { cn } from '@/lib/utils';

const CohortAnalysisChart = () => {
  const { cohorts, isLoading } = useRevenueIntelligence();
  const [cohortType, setCohortType] = useState<'retention' | 'revenue'>('retention');
  const [period, setPeriod] = useState('monthly');

  // Mock cohort data - Customer Retention
  const mockRetentionCohorts = [
    { cohort: 'Ene 2024', m0: 100, m1: 92, m2: 88, m3: 85, m4: 82, m5: 80, m6: 78 },
    { cohort: 'Feb 2024', m0: 100, m1: 94, m2: 90, m3: 87, m4: 84, m5: 82, m6: null },
    { cohort: 'Mar 2024', m0: 100, m1: 91, m2: 86, m3: 83, m4: 80, m5: null, m6: null },
    { cohort: 'Abr 2024', m0: 100, m1: 93, m2: 89, m3: 86, m4: null, m5: null, m6: null },
    { cohort: 'May 2024', m0: 100, m1: 95, m2: 91, m3: null, m4: null, m5: null, m6: null },
    { cohort: 'Jun 2024', m0: 100, m1: 96, m2: null, m3: null, m4: null, m5: null, m6: null },
    { cohort: 'Jul 2024', m0: 100, m1: null, m2: null, m3: null, m4: null, m5: null, m6: null },
  ];

  // Mock cohort data - Net Revenue Retention
  const mockRevenueCohorts = [
    { cohort: 'Ene 2024', m0: 100, m1: 102, m2: 108, m3: 112, m4: 118, m5: 122, m6: 128 },
    { cohort: 'Feb 2024', m0: 100, m1: 104, m2: 110, m3: 115, m4: 120, m5: 125, m6: null },
    { cohort: 'Mar 2024', m0: 100, m1: 101, m2: 105, m3: 108, m4: 112, m5: null, m6: null },
    { cohort: 'Abr 2024', m0: 100, m1: 103, m2: 109, m3: 114, m4: null, m5: null, m6: null },
    { cohort: 'May 2024', m0: 100, m1: 105, m2: 112, m3: null, m4: null, m5: null, m6: null },
    { cohort: 'Jun 2024', m0: 100, m1: 106, m2: null, m3: null, m4: null, m5: null, m6: null },
    { cohort: 'Jul 2024', m0: 100, m1: null, m2: null, m3: null, m4: null, m5: null, m6: null },
  ];

  const currentCohorts = cohortType === 'retention' ? mockRetentionCohorts : mockRevenueCohorts;

  const getCellColor = (value: number | null, type: 'retention' | 'revenue') => {
    if (value === null) return 'bg-muted/30';
    
    if (type === 'retention') {
      if (value >= 90) return 'bg-green-500/80 text-white';
      if (value >= 80) return 'bg-green-500/50';
      if (value >= 70) return 'bg-amber-500/50';
      if (value >= 60) return 'bg-orange-500/50';
      return 'bg-red-500/50';
    } else {
      if (value >= 120) return 'bg-green-500/80 text-white';
      if (value >= 110) return 'bg-green-500/50';
      if (value >= 100) return 'bg-blue-500/50';
      if (value >= 90) return 'bg-amber-500/50';
      return 'bg-red-500/50';
    }
  };

  const months = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'];

  // Calculate averages
  const calculateColumnAverage = (monthKey: string) => {
    const values = currentCohorts
      .map(c => c[monthKey as keyof typeof c] as number | null)
      .filter((v): v is number => v !== null);
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5 text-primary" />
            Análisis de Cohortes
          </CardTitle>
          <div className="flex items-center gap-3">
            <Tabs value={cohortType} onValueChange={(v) => setCohortType(v as typeof cohortType)}>
              <TabsList className="h-8">
                <TabsTrigger value="retention" className="text-xs gap-1">
                  <Users className="h-3 w-3" />
                  Retención
                </TabsTrigger>
                <TabsTrigger value="revenue" className="text-xs gap-1">
                  <DollarSign className="h-3 w-3" />
                  NRR
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensual</SelectItem>
                <SelectItem value="quarterly">Trimestral</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-2 border-b font-medium text-muted-foreground">
                  Cohorte
                </th>
                {months.map((month) => (
                  <th key={month} className="text-center p-2 border-b font-medium text-muted-foreground">
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentCohorts.map((cohort, idx) => (
                <tr key={idx} className="hover:bg-muted/30">
                  <td className="p-2 border-b font-medium">
                    {cohort.cohort}
                  </td>
                  {months.map((month) => {
                    const key = month.toLowerCase() as keyof typeof cohort;
                    const value = cohort[key] as number | null;
                    return (
                      <td key={month} className="p-1 border-b">
                        <div 
                          className={cn(
                            "h-10 w-full flex items-center justify-center rounded text-sm font-medium",
                            getCellColor(value, cohortType)
                          )}
                        >
                          {value !== null ? `${value}%` : '—'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Average row */}
              <tr className="bg-muted/20 font-semibold">
                <td className="p-2 border-t-2">Promedio</td>
                {months.map((month) => {
                  const avg = calculateColumnAverage(month.toLowerCase());
                  return (
                    <td key={month} className="p-1 border-t-2">
                      <div className="h-10 flex items-center justify-center text-sm">
                        {avg !== null ? `${avg.toFixed(1)}%` : '—'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Escala:</span>
            {cohortType === 'retention' ? (
              <>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-green-500/80" />
                  <span className="text-xs">≥90%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-green-500/50" />
                  <span className="text-xs">80-89%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-amber-500/50" />
                  <span className="text-xs">70-79%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-red-500/50" />
                  <span className="text-xs">&lt;70%</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-green-500/80" />
                  <span className="text-xs">≥120%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-green-500/50" />
                  <span className="text-xs">110-119%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-blue-500/50" />
                  <span className="text-xs">100-109%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-red-500/50" />
                  <span className="text-xs">&lt;100%</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm">
              {cohortType === 'retention' 
                ? 'Tendencia de retención mejorando' 
                : 'NRR >100% indica expansión neta'
              }
            </span>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Insights del Análisis
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {cohortType === 'retention' ? (
              <>
                <li>• Las cohortes recientes (May-Jun) muestran mejor retención en M1 (+3-4pp vs promedio)</li>
                <li>• Mayor caída de retención ocurre entre M0-M1, foco en onboarding</li>
                <li>• Cohorte Feb 2024 con mejor performance general (94% M1)</li>
              </>
            ) : (
              <>
                <li>• Todas las cohortes muestran NRR &gt;100%, indicando expansión neta</li>
                <li>• Cohortes Ene-Feb muestran mejor expansión a largo plazo (128% en M6)</li>
                <li>• La expansión se acelera después del M3, buen momento para upsell</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default CohortAnalysisChart;
