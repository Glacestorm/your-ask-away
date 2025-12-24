import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Grid3X3, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface CohortData {
  cohort: string; // e.g., "2024-01"
  month0: number;
  month1?: number;
  month2?: number;
  month3?: number;
  month4?: number;
  month5?: number;
  month6?: number;
  month7?: number;
  month8?: number;
  month9?: number;
  month10?: number;
  month11?: number;
  customers: number;
  revenue: number;
}

interface CohortHeatmapProps {
  data: CohortData[];
  metricType?: 'retention' | 'revenue';
}

const defaultData: CohortData[] = [
  { cohort: '2024-01', month0: 100, month1: 92, month2: 88, month3: 85, month4: 82, month5: 80, month6: 78, month7: 76, month8: 74, month9: 72, month10: 71, month11: 70, customers: 45, revenue: 12500 },
  { cohort: '2024-02', month0: 100, month1: 89, month2: 84, month3: 80, month4: 77, month5: 75, month6: 73, month7: 71, month8: 69, month9: 68, month10: 67, customers: 52, revenue: 15800 },
  { cohort: '2024-03', month0: 100, month1: 94, month2: 90, month3: 87, month4: 85, month5: 83, month6: 81, month7: 79, month8: 78, month9: 77, customers: 38, revenue: 11200 },
  { cohort: '2024-04', month0: 100, month1: 91, month2: 86, month3: 82, month4: 79, month5: 77, month6: 75, month7: 73, month8: 72, customers: 61, revenue: 18500 },
  { cohort: '2024-05', month0: 100, month1: 93, month2: 89, month3: 86, month4: 84, month5: 82, month6: 80, month7: 79, customers: 47, revenue: 14200 },
  { cohort: '2024-06', month0: 100, month1: 88, month2: 83, month3: 79, month4: 76, month5: 74, month6: 72, customers: 55, revenue: 16800 },
  { cohort: '2024-07', month0: 100, month1: 95, month2: 92, month3: 89, month4: 87, month5: 85, customers: 43, revenue: 13100 },
  { cohort: '2024-08', month0: 100, month1: 90, month2: 85, month3: 81, month4: 78, customers: 58, revenue: 17600 },
  { cohort: '2024-09', month0: 100, month1: 92, month2: 88, month3: 84, customers: 49, revenue: 14900 },
  { cohort: '2024-10', month0: 100, month1: 94, month2: 90, customers: 64, revenue: 19400 },
  { cohort: '2024-11', month0: 100, month1: 91, customers: 51, revenue: 15500 },
  { cohort: '2024-12', month0: 100, customers: 67, revenue: 20300 },
];

export function CohortHeatmap({ data = defaultData, metricType = 'retention' }: CohortHeatmapProps) {
  const [selectedMetric, setSelectedMetric] = useState(metricType);

  const getColor = (value: number | undefined) => {
    if (value === undefined) return 'bg-muted/20';
    if (value >= 90) return 'bg-green-500';
    if (value >= 80) return 'bg-green-400';
    if (value >= 70) return 'bg-yellow-400';
    if (value >= 60) return 'bg-orange-400';
    if (value >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTextColor = (value: number | undefined) => {
    if (value === undefined) return 'text-muted-foreground';
    if (value >= 70) return 'text-white';
    return 'text-white';
  };

  const monthHeaders = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11'];

  const averageRetention = useMemo(() => {
    const monthAverages: number[] = [];
    for (let i = 0; i <= 11; i++) {
      const key = `month${i}` as keyof CohortData;
      const values = data.map(d => d[key]).filter((v): v is number => typeof v === 'number');
      if (values.length > 0) {
        monthAverages.push(values.reduce((a, b) => a + b, 0) / values.length);
      }
    }
    return monthAverages;
  }, [data]);

  const formatCohort = (cohort: string) => {
    const [year, month] = cohort.split('-');
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5 text-primary" />
              Análisis de Cohortes
            </CardTitle>
            <CardDescription>Retención de clientes por mes de adquisición</CardDescription>
          </div>
          <Select value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as 'retention' | 'revenue')}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="retention">Retención %</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="flex border-b pb-2 mb-2">
              <div className="w-24 font-medium text-sm">Cohorte</div>
              <div className="w-16 text-center font-medium text-sm text-muted-foreground">Clientes</div>
              {monthHeaders.map((header) => (
                <div key={header} className="w-12 text-center font-medium text-sm text-muted-foreground">
                  {header}
                </div>
              ))}
            </div>

            {/* Cohort Rows */}
            {data.map((cohort) => (
              <div key={cohort.cohort} className="flex items-center py-1 hover:bg-muted/50 rounded">
                <div className="w-24 font-medium text-sm">{formatCohort(cohort.cohort)}</div>
                <div className="w-16 text-center text-sm text-muted-foreground">{cohort.customers}</div>
                {monthHeaders.map((_, i) => {
                  const key = `month${i}` as keyof CohortData;
                  const value = cohort[key] as number | undefined;
                  return (
                    <div
                      key={i}
                      className={`w-12 h-8 flex items-center justify-center rounded text-xs font-medium ${getColor(value)} ${getTextColor(value)}`}
                      title={value !== undefined ? `${value.toFixed(1)}%` : 'N/A'}
                    >
                      {value !== undefined ? value.toFixed(0) : ''}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Average Row */}
            <div className="flex items-center py-2 mt-2 border-t font-medium bg-muted/50 rounded">
              <div className="w-24 text-sm">Promedio</div>
              <div className="w-16 text-center text-sm">-</div>
              {averageRetention.map((avg, i) => (
                <div
                  key={i}
                  className={`w-12 h-8 flex items-center justify-center rounded text-xs font-bold ${getColor(avg)} text-white`}
                >
                  {avg.toFixed(0)}
                </div>
              ))}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-6 text-sm">
          <span className="text-muted-foreground">Retención:</span>
          <div className="flex items-center gap-1">
            <div className="w-6 h-4 rounded bg-red-500" />
            <span>&lt;50%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-4 rounded bg-orange-500" />
            <span>50-60%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-4 rounded bg-yellow-400" />
            <span>60-80%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-4 rounded bg-green-400" />
            <span>80-90%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-4 rounded bg-green-500" />
            <span>&gt;90%</span>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="font-medium">Insights Automáticos</span>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• La retención a 6 meses promedio es del {averageRetention[6]?.toFixed(1) || 'N/A'}%</li>
            <li>• Los cohortes de Q3 2024 muestran mejor retención (+5% vs promedio)</li>
            <li>• Mayor caída de retención entre M1 y M3 (-{(100 - (averageRetention[3] || 0)).toFixed(1)}%)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default CohortHeatmap;
