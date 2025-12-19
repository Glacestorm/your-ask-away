import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, Clock, Users, DollarSign } from 'lucide-react';
import { useMarketingAnalytics } from '@/hooks/useMarketingAnalytics';

interface ROICalculatorProps {
  onComplete?: (data: ROIResult) => void;
}

interface ROIResult {
  timeSavingsHours: number;
  costSavings: number;
  productivityGain: number;
  paybackMonths: number;
  threeYearROI: number;
}

export const ROICalculator: React.FC<ROICalculatorProps> = ({ onComplete }) => {
  const { trackEvent } = useMarketingAnalytics();
  
  const [employees, setEmployees] = useState(10);
  const [avgSalary, setAvgSalary] = useState(35000);
  const [manualHoursPerWeek, setManualHoursPerWeek] = useState(10);
  const [currentToolsCost, setCurrentToolsCost] = useState(500);

  const results = useMemo((): ROIResult => {
    const hourlyRate = avgSalary / 2080; // 52 weeks * 40 hours
    const weeklyTimeSaved = manualHoursPerWeek * 0.7; // 70% time savings
    const yearlyTimeSaved = weeklyTimeSaved * 52 * employees;
    const yearlyCostSavings = yearlyTimeSaved * hourlyRate;
    
    const obelixiaCost = employees * 99 * 12; // Professional plan
    const currentCosts = currentToolsCost * 12;
    const netSavings = yearlyCostSavings + currentCosts - obelixiaCost;
    
    const productivityGain = (weeklyTimeSaved / 40) * 100;
    const paybackMonths = obelixiaCost > 0 ? Math.ceil(obelixiaCost / (netSavings / 12)) : 0;
    const threeYearROI = ((netSavings * 3) / obelixiaCost) * 100;

    return {
      timeSavingsHours: Math.round(yearlyTimeSaved),
      costSavings: Math.round(netSavings),
      productivityGain: Math.round(productivityGain),
      paybackMonths: Math.max(0, paybackMonths),
      threeYearROI: Math.round(threeYearROI),
    };
  }, [employees, avgSalary, manualHoursPerWeek, currentToolsCost]);

  const handleCalculate = () => {
    trackEvent('roi_calculated', {
      employees: String(employees),
      savings: String(results.costSavings),
    });
    onComplete?.(results);
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <CardTitle className="text-white">Calculadora de ROI</CardTitle>
            <CardDescription className="text-slate-400">
              Descubre cuánto puedes ahorrar con Obelixia
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inputs */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-slate-300">Número de empleados</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[employees]}
                onValueChange={([v]) => setEmployees(v)}
                min={1}
                max={500}
                step={1}
                className="flex-1"
              />
              <Input
                type="number"
                value={employees}
                onChange={(e) => setEmployees(Number(e.target.value))}
                className="w-20 bg-slate-900 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-slate-300">Salario medio anual (€)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[avgSalary]}
                onValueChange={([v]) => setAvgSalary(v)}
                min={20000}
                max={100000}
                step={1000}
                className="flex-1"
              />
              <Input
                type="number"
                value={avgSalary}
                onChange={(e) => setAvgSalary(Number(e.target.value))}
                className="w-24 bg-slate-900 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-slate-300">Horas manuales/semana por empleado</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[manualHoursPerWeek]}
                onValueChange={([v]) => setManualHoursPerWeek(v)}
                min={1}
                max={40}
                step={1}
                className="flex-1"
              />
              <Input
                type="number"
                value={manualHoursPerWeek}
                onChange={(e) => setManualHoursPerWeek(Number(e.target.value))}
                className="w-20 bg-slate-900 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-slate-300">Coste actual herramientas/mes (€)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[currentToolsCost]}
                onValueChange={([v]) => setCurrentToolsCost(v)}
                min={0}
                max={10000}
                step={100}
                className="flex-1"
              />
              <Input
                type="number"
                value={currentToolsCost}
                onChange={(e) => setCurrentToolsCost(Number(e.target.value))}
                className="w-24 bg-slate-900 border-slate-600 text-white"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-700"
        >
          <div className="text-center p-4 bg-slate-900/50 rounded-lg">
            <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{results.timeSavingsHours.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Horas/año ahorradas</p>
          </div>
          
          <div className="text-center p-4 bg-slate-900/50 rounded-lg">
            <DollarSign className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-400">
              {results.costSavings > 0 ? '+' : ''}{results.costSavings.toLocaleString()}€
            </p>
            <p className="text-xs text-slate-400">Ahorro anual neto</p>
          </div>
          
          <div className="text-center p-4 bg-slate-900/50 rounded-lg">
            <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">+{results.productivityGain}%</p>
            <p className="text-xs text-slate-400">Productividad</p>
          </div>
          
          <div className="text-center p-4 bg-slate-900/50 rounded-lg">
            <TrendingUp className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{results.threeYearROI}%</p>
            <p className="text-xs text-slate-400">ROI a 3 años</p>
          </div>
        </motion.div>

        {results.costSavings > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-center"
          >
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 mb-2">
              ¡Gran oportunidad!
            </Badge>
            <p className="text-emerald-300">
              Con Obelixia recuperarías tu inversión en aproximadamente{' '}
              <strong>{results.paybackMonths} meses</strong>
            </p>
          </motion.div>
        )}

        <Button 
          onClick={handleCalculate}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Solicitar Propuesta Personalizada
        </Button>
      </CardContent>
    </Card>
  );
};
