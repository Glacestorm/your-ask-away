/**
 * IncomeStatementPanel - Cuenta de Pérdidas y Ganancias
 * Fusiona funcionalidad de admin/accounting/IncomeStatementForm.tsx
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown,
  Download, 
  FileSpreadsheet, 
  RefreshCw,
  DollarSign,
  MinusCircle,
  PlusCircle,
  Percent
} from 'lucide-react';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { useERPAccounting } from '@/hooks/erp/useERPAccounting';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface IncomeSection {
  code: string;
  name: string;
  amount: number;
  previousAmount?: number;
  isSubtotal?: boolean;
  isTotal?: boolean;
  children?: IncomeSection[];
}

export function IncomeStatementPanel() {
  const { currentCompany } = useERPContext();
  const { chartOfAccounts, isLoading, fetchChartOfAccounts, dashboard } = useERPAccounting();
  
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [showComparison, setShowComparison] = useState(true);

  // Calculate income statement from accounts
  const incomeData = useMemo(() => {
    // In real implementation, this would aggregate from journal entries
    // Using mock data structure based on PGC Spanish chart of accounts
    
    const getAccountBalance = (groupStart: string, groupEnd: string) => {
      return chartOfAccounts
        .filter(acc => {
          const code = acc.account_code;
          return code >= groupStart && code < groupEnd;
        })
        .reduce((sum, acc) => sum + Math.random() * 10000, 0); // Mock values
    };

    // INGRESOS (Grupo 7)
    const ingresos = {
      ventasNetas: 150000 + Math.random() * 50000,
      otrosIngresos: 5000 + Math.random() * 2000,
      trabajosRealizados: 2000 + Math.random() * 1000,
    };

    // GASTOS (Grupos 6)
    const gastos = {
      aprovisionamientos: 45000 + Math.random() * 15000,
      gastosPersonal: 35000 + Math.random() * 10000,
      otrosGastosExplotacion: 15000 + Math.random() * 5000,
      amortizaciones: 8000 + Math.random() * 2000,
      deterioros: 1000 + Math.random() * 500,
    };

    const ingresosExplotacion = ingresos.ventasNetas + ingresos.otrosIngresos + ingresos.trabajosRealizados;
    const gastosExplotacion = gastos.aprovisionamientos + gastos.gastosPersonal + 
                              gastos.otrosGastosExplotacion + gastos.amortizaciones + gastos.deterioros;
    const resultadoExplotacion = ingresosExplotacion - gastosExplotacion;

    // FINANCIERO
    const ingresosFinancieros = 1500 + Math.random() * 500;
    const gastosFinancieros = 3000 + Math.random() * 1000;
    const resultadoFinanciero = ingresosFinancieros - gastosFinancieros;

    const resultadoAntesImpuestos = resultadoExplotacion + resultadoFinanciero;
    const impuestoSociedades = resultadoAntesImpuestos > 0 ? resultadoAntesImpuestos * 0.25 : 0;
    const resultadoEjercicio = resultadoAntesImpuestos - impuestoSociedades;

    return {
      sections: [
        {
          code: '1',
          name: 'INGRESOS DE EXPLOTACIÓN',
          amount: ingresosExplotacion,
          isSubtotal: true,
          children: [
            { code: '700', name: 'Ventas netas', amount: ingresos.ventasNetas },
            { code: '75', name: 'Otros ingresos de explotación', amount: ingresos.otrosIngresos },
            { code: '73', name: 'Trabajos realizados para la empresa', amount: ingresos.trabajosRealizados },
          ]
        },
        {
          code: '2',
          name: 'GASTOS DE EXPLOTACIÓN',
          amount: gastosExplotacion,
          isSubtotal: true,
          children: [
            { code: '60', name: 'Aprovisionamientos', amount: -gastos.aprovisionamientos },
            { code: '64', name: 'Gastos de personal', amount: -gastos.gastosPersonal },
            { code: '62', name: 'Otros gastos de explotación', amount: -gastos.otrosGastosExplotacion },
            { code: '68', name: 'Amortizaciones', amount: -gastos.amortizaciones },
            { code: '69', name: 'Deterioros', amount: -gastos.deterioros },
          ]
        },
        {
          code: 'A',
          name: 'RESULTADO DE EXPLOTACIÓN (1-2)',
          amount: resultadoExplotacion,
          isSubtotal: true,
        },
        {
          code: '3',
          name: 'INGRESOS FINANCIEROS',
          amount: ingresosFinancieros,
        },
        {
          code: '4',
          name: 'GASTOS FINANCIEROS',
          amount: -gastosFinancieros,
        },
        {
          code: 'B',
          name: 'RESULTADO FINANCIERO (3-4)',
          amount: resultadoFinanciero,
          isSubtotal: true,
        },
        {
          code: 'C',
          name: 'RESULTADO ANTES DE IMPUESTOS (A+B)',
          amount: resultadoAntesImpuestos,
          isSubtotal: true,
        },
        {
          code: '5',
          name: 'Impuesto sobre beneficios',
          amount: -impuestoSociedades,
        },
        {
          code: 'D',
          name: 'RESULTADO DEL EJERCICIO (C-5)',
          amount: resultadoEjercicio,
          isTotal: true,
        },
      ],
      summary: {
        ingresosExplotacion,
        gastosExplotacion,
        resultadoExplotacion,
        resultadoFinanciero,
        resultadoAntesImpuestos,
        resultadoEjercicio,
        margenBruto: ingresosExplotacion > 0 ? ((ingresosExplotacion - gastos.aprovisionamientos) / ingresosExplotacion * 100) : 0,
        margenNeto: ingresosExplotacion > 0 ? (resultadoEjercicio / ingresosExplotacion * 100) : 0,
      }
    };
  }, [chartOfAccounts]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currentCompany?.currency || 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const renderSection = (section: IncomeSection, level: number = 0) => {
    const isPositive = section.amount >= 0;
    
    return (
      <div key={section.code} className={cn("space-y-1", level > 0 && "ml-4")}>
        <div className={cn(
          "flex items-center justify-between py-2 px-3 rounded-lg",
          section.isTotal ? "bg-primary/10 font-bold" : 
          section.isSubtotal ? "bg-muted/50 font-semibold" : 
          "hover:bg-muted/30"
        )}>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-10">{section.code}</span>
            <span className={cn(
              section.isTotal && "text-lg",
              section.isSubtotal && "font-medium"
            )}>
              {section.name}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className={cn(
              "font-mono",
              section.isTotal && "text-lg",
              isPositive ? "text-green-600" : "text-destructive"
            )}>
              {formatCurrency(section.amount)}
            </span>
            {showComparison && section.previousAmount !== undefined && (
              <span className="text-xs text-muted-foreground font-mono w-24 text-right">
                {formatCurrency(section.previousAmount)}
              </span>
            )}
          </div>
        </div>
        {section.children?.map(child => renderSection(child, level + 1))}
      </div>
    );
  };

  if (!currentCompany) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-muted-foreground">
          Selecciona una empresa para ver la cuenta de resultados
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Cuenta de Pérdidas y Ganancias</h3>
            <p className="text-sm text-muted-foreground">
              Estado de resultados del ejercicio
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Periodo actual</SelectItem>
              <SelectItem value="q1">1er Trimestre</SelectItem>
              <SelectItem value="q2">2do Trimestre</SelectItem>
              <SelectItem value="q3">3er Trimestre</SelectItem>
              <SelectItem value="q4">4to Trimestre</SelectItem>
              <SelectItem value="annual">Anual</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={() => fetchChartOfAccounts()}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          
          <Button variant="outline" size="sm">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Result Summary */}
      <Card className={cn(
        "border-l-4",
        incomeData.summary.resultadoEjercicio >= 0 ? "border-l-green-500" : "border-l-destructive"
      )}>
        <CardContent className="py-4">
          <div className="grid grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Ingresos totales</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(incomeData.summary.ingresosExplotacion)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gastos totales</p>
              <p className="text-xl font-bold text-destructive">
                {formatCurrency(incomeData.summary.gastosExplotacion)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Resultado del ejercicio</p>
              <p className={cn(
                "text-xl font-bold",
                incomeData.summary.resultadoEjercicio >= 0 ? "text-green-600" : "text-destructive"
              )}>
                {formatCurrency(incomeData.summary.resultadoEjercicio)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Margen neto</p>
              <div className="flex items-center gap-2">
                {incomeData.summary.margenNeto >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                )}
                <p className={cn(
                  "text-xl font-bold",
                  incomeData.summary.margenNeto >= 0 ? "text-green-600" : "text-destructive"
                )}>
                  {incomeData.summary.margenNeto.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Income Statement */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Detalle de la Cuenta de Resultados</span>
            <div className="text-xs text-muted-foreground">
              {format(new Date(), "dd/MM/yyyy", { locale: es })}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[450px]">
            <div className="space-y-2">
              {incomeData.sections.map(section => renderSection(section))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Ratios */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ratios de Rentabilidad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Margen Bruto</p>
              <p className="text-xl font-bold">{incomeData.summary.margenBruto.toFixed(1)}%</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Margen Operativo</p>
              <p className="text-xl font-bold">
                {incomeData.summary.ingresosExplotacion > 0 
                  ? (incomeData.summary.resultadoExplotacion / incomeData.summary.ingresosExplotacion * 100).toFixed(1)
                  : 0}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Margen Neto</p>
              <p className="text-xl font-bold">{incomeData.summary.margenNeto.toFixed(1)}%</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Cobertura Financiera</p>
              <p className="text-xl font-bold">
                {incomeData.summary.resultadoExplotacion > 0 && incomeData.summary.resultadoFinanciero !== 0
                  ? Math.abs(incomeData.summary.resultadoExplotacion / incomeData.summary.resultadoFinanciero).toFixed(2)
                  : '-'}x
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default IncomeStatementPanel;
