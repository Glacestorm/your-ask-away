import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calculator, Sparkles, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import { useCSMetricsKnowledge } from '@/hooks/useCSMetricsKnowledge';
import { CSMetricDefinition } from '@/types/cs-metrics';
import { cn } from '@/lib/utils';

interface CalculatorInput {
  key: string;
  label: string;
  placeholder: string;
  type: 'number' | 'currency';
}

const METRIC_INPUTS: Record<string, CalculatorInput[]> = {
  nps: [
    { key: 'promoters', label: 'Promotores (9-10)', placeholder: '50', type: 'number' },
    { key: 'passives', label: 'Pasivos (7-8)', placeholder: '30', type: 'number' },
    { key: 'detractors', label: 'Detractores (0-6)', placeholder: '20', type: 'number' }
  ],
  csat: [
    { key: 'satisfied', label: 'Respuestas 4-5', placeholder: '80', type: 'number' },
    { key: 'total', label: 'Total respuestas', placeholder: '100', type: 'number' }
  ],
  ces: [
    { key: 'sumScores', label: 'Suma de puntuaciones', placeholder: '350', type: 'number' },
    { key: 'responses', label: 'Número de respuestas', placeholder: '100', type: 'number' }
  ],
  churn_rate: [
    { key: 'churned', label: 'Clientes perdidos', placeholder: '10', type: 'number' },
    { key: 'startCustomers', label: 'Clientes inicio período', placeholder: '200', type: 'number' }
  ],
  retention_rate: [
    { key: 'endCustomers', label: 'Clientes fin período', placeholder: '180', type: 'number' },
    { key: 'newCustomers', label: 'Nuevos clientes', placeholder: '20', type: 'number' },
    { key: 'startCustomers', label: 'Clientes inicio', placeholder: '200', type: 'number' }
  ],
  nrr: [
    { key: 'endRevenue', label: 'Ingresos fin (existentes)', placeholder: '110000', type: 'currency' },
    { key: 'startRevenue', label: 'Ingresos inicio', placeholder: '100000', type: 'currency' }
  ],
  grr: [
    { key: 'startMRR', label: 'MRR inicio', placeholder: '100000', type: 'currency' },
    { key: 'downgrades', label: 'Downgrades', placeholder: '3000', type: 'currency' },
    { key: 'churned', label: 'MRR perdido (churn)', placeholder: '5000', type: 'currency' }
  ],
  clv: [
    { key: 'avgRevenue', label: 'Ingreso medio mensual', placeholder: '500', type: 'currency' },
    { key: 'lifespan', label: 'Duración cliente (meses)', placeholder: '36', type: 'number' },
    { key: 'cac', label: 'CAC', placeholder: '1500', type: 'currency' }
  ],
  cac: [
    { key: 'marketingCost', label: 'Coste marketing', placeholder: '50000', type: 'currency' },
    { key: 'salesCost', label: 'Coste ventas', placeholder: '30000', type: 'currency' },
    { key: 'newCustomers', label: 'Nuevos clientes', placeholder: '40', type: 'number' }
  ],
  arr: [
    { key: 'mrr', label: 'MRR actual', placeholder: '85000', type: 'currency' }
  ],
  roi: [
    { key: 'benefit', label: 'Beneficio total', placeholder: '150000', type: 'currency' },
    { key: 'investment', label: 'Inversión total', placeholder: '100000', type: 'currency' }
  ],
  quick_ratio: [
    { key: 'newMRR', label: 'Nuevo MRR', placeholder: '15000', type: 'currency' },
    { key: 'expansion', label: 'Expansión MRR', placeholder: '8000', type: 'currency' },
    { key: 'churnMRR', label: 'Churn MRR', placeholder: '5000', type: 'currency' },
    { key: 'contraction', label: 'Contracción MRR', placeholder: '2000', type: 'currency' }
  ],
  time_to_value: [
    { key: 'activationDate', label: 'Días hasta activación', placeholder: '14', type: 'number' }
  ],
  feature_adoption: [
    { key: 'usersUsingFeature', label: 'Usuarios usando feature', placeholder: '150', type: 'number' },
    { key: 'totalUsers', label: 'Total usuarios activos', placeholder: '200', type: 'number' }
  ],
  expansion_rate: [
    { key: 'expansionRevenue', label: 'Ingresos expansión', placeholder: '12000', type: 'currency' },
    { key: 'startRevenue', label: 'Ingresos inicio período', placeholder: '100000', type: 'currency' }
  ],
  payback_period: [
    { key: 'cac', label: 'CAC', placeholder: '2000', type: 'currency' },
    { key: 'monthlyRevenue', label: 'Ingreso mensual cliente', placeholder: '200', type: 'currency' },
    { key: 'grossMargin', label: 'Margen bruto (%)', placeholder: '75', type: 'number' }
  ]
};

export function MetricCalculator() {
  const { allMetrics, getMetricById } = useCSMetricsKnowledge();
  const [selectedMetricId, setSelectedMetricId] = useState<string>('nps');
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    value: number;
    interpretation: string;
    benchmark: string;
    recommendation: string;
  } | null>(null);

  const selectedMetric = useMemo(() => 
    allMetrics.find(m => m.id === selectedMetricId),
    [allMetrics, selectedMetricId]
  );

  const currentInputs = METRIC_INPUTS[selectedMetricId] || [];

  const handleInputChange = (key: string, value: string) => {
    setInputs(prev => ({ ...prev, [key]: value }));
    setResult(null);
  };

  const handleCalculate = () => {
    if (!selectedMetric) return;

    const numericInputs: Record<string, number> = {};
    for (const input of currentInputs) {
      const val = parseFloat(inputs[input.key] || '0');
      if (isNaN(val)) {
        return; // Invalid input
      }
      numericInputs[input.key] = val;
    }

    let calculatedValue: number;

    switch (selectedMetricId) {
      case 'nps': {
        const total = numericInputs.promoters + numericInputs.passives + numericInputs.detractors;
        calculatedValue = total > 0 
          ? ((numericInputs.promoters / total) - (numericInputs.detractors / total)) * 100 
          : 0;
        break;
      }
      case 'csat':
        calculatedValue = numericInputs.total > 0 
          ? (numericInputs.satisfied / numericInputs.total) * 100 
          : 0;
        break;
      case 'ces':
        calculatedValue = numericInputs.responses > 0 
          ? numericInputs.sumScores / numericInputs.responses 
          : 0;
        break;
      case 'churn_rate':
        calculatedValue = numericInputs.startCustomers > 0 
          ? (numericInputs.churned / numericInputs.startCustomers) * 100 
          : 0;
        break;
      case 'retention_rate':
        calculatedValue = numericInputs.startCustomers > 0 
          ? ((numericInputs.endCustomers - numericInputs.newCustomers) / numericInputs.startCustomers) * 100 
          : 0;
        break;
      case 'nrr':
        calculatedValue = numericInputs.startRevenue > 0 
          ? (numericInputs.endRevenue / numericInputs.startRevenue) * 100 
          : 0;
        break;
      case 'grr':
        calculatedValue = numericInputs.startMRR > 0 
          ? ((numericInputs.startMRR - numericInputs.downgrades - numericInputs.churned) / numericInputs.startMRR) * 100 
          : 0;
        break;
      case 'clv':
        calculatedValue = (numericInputs.avgRevenue * numericInputs.lifespan) - numericInputs.cac;
        break;
      case 'cac':
        calculatedValue = numericInputs.newCustomers > 0 
          ? (numericInputs.marketingCost + numericInputs.salesCost) / numericInputs.newCustomers 
          : 0;
        break;
      case 'arr':
        calculatedValue = numericInputs.mrr * 12;
        break;
      case 'roi':
        calculatedValue = numericInputs.investment > 0 
          ? ((numericInputs.benefit - numericInputs.investment) / numericInputs.investment) * 100 
          : 0;
        break;
      case 'quick_ratio':
        const denominator = numericInputs.churnMRR + numericInputs.contraction;
        calculatedValue = denominator > 0 
          ? (numericInputs.newMRR + numericInputs.expansion) / denominator 
          : 0;
        break;
      case 'time_to_value':
        calculatedValue = numericInputs.activationDate;
        break;
      case 'feature_adoption':
        calculatedValue = numericInputs.totalUsers > 0 
          ? (numericInputs.usersUsingFeature / numericInputs.totalUsers) * 100 
          : 0;
        break;
      case 'expansion_rate':
        calculatedValue = numericInputs.startRevenue > 0 
          ? (numericInputs.expansionRevenue / numericInputs.startRevenue) * 100 
          : 0;
        break;
      case 'payback_period':
        const monthlyGrossProfit = numericInputs.monthlyRevenue * (numericInputs.grossMargin / 100);
        calculatedValue = monthlyGrossProfit > 0 
          ? numericInputs.cac / monthlyGrossProfit 
          : 0;
        break;
      default:
        calculatedValue = 0;
    }

    // Get interpretation from metric ranges
    const matchedRange = selectedMetric?.interpretation.ranges.find(
      r => calculatedValue >= r.min && calculatedValue <= r.max
    );
    const interpretation = matchedRange?.label || 'Valor calculado';
    const benchmark = `Comparado con benchmarks SaaS: ${matchedRange?.label || 'N/A'}`;

    setResult({
      value: calculatedValue,
      interpretation,
      benchmark,
      recommendation: matchedRange?.recommendation || 'Analiza los factores que influyen en esta métrica.'
    });
  };

  const formatResult = (value: number): string => {
    if (!selectedMetric) return value.toString();
    switch (selectedMetric.unit) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return `€${value.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
      case 'ratio':
        return value.toFixed(2);
      case 'score':
        return value.toFixed(1);
      case 'days':
        return `${value.toFixed(0)} días`;
      case 'months':
        return `${value.toFixed(1)} meses`;
      default:
        return value.toFixed(2);
    }
  };

  const getResultColor = () => {
    if (!result || !selectedMetric) return 'text-foreground';
    const range = selectedMetric.interpretation.ranges.find(
      r => result.value >= r.min && result.value <= r.max
    );
    if (!range) return 'text-foreground';
    
    // Map color names to Tailwind classes
    const colorMap: Record<string, string> = {
      red: 'text-red-500',
      orange: 'text-orange-500',
      yellow: 'text-yellow-500',
      green: 'text-green-500',
      blue: 'text-blue-500'
    };
    return colorMap[range.color] || 'text-foreground';
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
            <Calculator className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg">Calculadora de Métricas CS</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metric selector */}
        <div className="space-y-2">
          <Label>Selecciona métrica</Label>
          <Select value={selectedMetricId} onValueChange={(val) => {
            setSelectedMetricId(val);
            setInputs({});
            setResult(null);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Elige una métrica" />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-60">
                {allMetrics.map((metric) => (
                  <SelectItem key={metric.id} value={metric.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{metric.shortName}</span>
                      <span className="text-muted-foreground text-sm">- {metric.name}</span>
                      {metric.isAdvanced2025 && (
                        <Badge className="text-xs bg-purple-500/20 text-purple-500 border-0">2025</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>

        {/* Formula display */}
        {selectedMetric && (
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Fórmula:</p>
            <code className="text-sm font-mono">{selectedMetric.formula}</code>
          </div>
        )}

        {/* Input fields */}
        <div className="grid gap-3">
          {currentInputs.map((input) => (
            <div key={input.key} className="space-y-1.5">
              <Label className="text-sm">{input.label}</Label>
              <div className="relative">
                {input.type === 'currency' && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                )}
                <Input
                  type="number"
                  placeholder={input.placeholder}
                  value={inputs[input.key] || ''}
                  onChange={(e) => handleInputChange(input.key, e.target.value)}
                  className={cn(input.type === 'currency' && 'pl-7')}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Calculate button */}
        <Button 
          className="w-full" 
          onClick={handleCalculate}
          disabled={currentInputs.some(i => !inputs[i.key])}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Calcular {selectedMetric?.shortName}
        </Button>

        {/* Result */}
        {result && (
          <div className="space-y-3 pt-3 border-t border-border/50 animate-in fade-in slide-in-from-bottom-2">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Resultado</p>
              <p className={cn("text-4xl font-bold", getResultColor())}>
                {formatResult(result.value)}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2 p-2 bg-muted/30 rounded-lg">
                <Target className="h-4 w-4 mt-0.5 text-primary" />
                <div>
                  <p className="text-xs font-medium">Interpretación</p>
                  <p className="text-sm text-muted-foreground">{result.interpretation}</p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 bg-muted/30 rounded-lg">
                <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                <div>
                  <p className="text-xs font-medium">Benchmark SaaS</p>
                  <p className="text-sm text-muted-foreground">{result.benchmark}</p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 bg-primary/5 rounded-lg border border-primary/20">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-primary" />
                <div>
                  <p className="text-xs font-medium">Recomendación</p>
                  <p className="text-sm text-muted-foreground">{result.recommendation}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MetricCalculator;
