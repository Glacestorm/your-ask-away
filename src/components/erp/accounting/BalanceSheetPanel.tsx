/**
 * BalanceSheetPanel - Balance de Situación
 * Fusiona funcionalidad de admin/accounting/BalanceSheetForm.tsx
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Scale, 
  Download, 
  FileSpreadsheet, 
  TrendingUp, 
  TrendingDown,
  Building2,
  Coins,
  CreditCard,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { useERPAccounting } from '@/hooks/erp/useERPAccounting';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface BalanceSection {
  code: string;
  name: string;
  amount: number;
  previousAmount?: number;
  children?: BalanceSection[];
}

export function BalanceSheetPanel() {
  const { selectedCompany, selectedFiscalYear } = useERPContext();
  const { accounts, isLoading, refetch } = useERPAccounting();
  
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [showComparison, setShowComparison] = useState(true);

  // Calcular balance de situación desde cuentas
  const balanceData = useMemo(() => {
    if (!accounts?.length) return null;

    const getAccountBalance = (groupStart: string, groupEnd: string) => {
      return accounts
        .filter(acc => {
          const code = acc.account_code;
          return code >= groupStart && code < groupEnd;
        })
        .reduce((sum, acc) => sum + (acc.balance || 0), 0);
    };

    // ACTIVO
    const activoNoCorreinte = {
      code: 'A.I',
      name: 'Activo No Corriente',
      amount: getAccountBalance('20', '30'),
      children: [
        { code: '20', name: 'Inmovilizado intangible', amount: getAccountBalance('20', '21') },
        { code: '21', name: 'Inmovilizado material', amount: getAccountBalance('21', '22') },
        { code: '22-27', name: 'Inversiones inmobiliarias y financieras', amount: getAccountBalance('22', '28') },
        { code: '28-29', name: 'Amortizaciones', amount: getAccountBalance('28', '30') },
      ]
    };

    const activoCorriente = {
      code: 'A.II',
      name: 'Activo Corriente',
      amount: getAccountBalance('30', '60'),
      children: [
        { code: '30-39', name: 'Existencias', amount: getAccountBalance('30', '40') },
        { code: '43', name: 'Deudores comerciales', amount: getAccountBalance('43', '44') },
        { code: '44-47', name: 'Otros deudores', amount: getAccountBalance('44', '48') },
        { code: '57', name: 'Tesorería', amount: getAccountBalance('57', '58') },
      ]
    };

    // PATRIMONIO NETO
    const patrimonioNeto = {
      code: 'P.N',
      name: 'Patrimonio Neto',
      amount: getAccountBalance('10', '20'),
      children: [
        { code: '10', name: 'Capital', amount: getAccountBalance('10', '11') },
        { code: '11', name: 'Reservas', amount: getAccountBalance('11', '12') },
        { code: '12', name: 'Resultados pendientes', amount: getAccountBalance('12', '13') },
        { code: '129', name: 'Resultado del ejercicio', amount: getAccountBalance('129', '130') },
      ]
    };

    // PASIVO
    const pasivoNoCorreinte = {
      code: 'P.I',
      name: 'Pasivo No Corriente',
      amount: getAccountBalance('14', '18'),
      children: [
        { code: '14', name: 'Provisiones a largo plazo', amount: getAccountBalance('14', '15') },
        { code: '17', name: 'Deudas a largo plazo', amount: getAccountBalance('17', '18') },
      ]
    };

    const pasivoCorriente = {
      code: 'P.II',
      name: 'Pasivo Corriente',
      amount: getAccountBalance('40', '57'),
      children: [
        { code: '40', name: 'Proveedores', amount: getAccountBalance('40', '41') },
        { code: '41', name: 'Acreedores varios', amount: getAccountBalance('41', '42') },
        { code: '46', name: 'Personal', amount: getAccountBalance('46', '47') },
        { code: '47', name: 'Administraciones públicas', amount: getAccountBalance('47', '48') },
        { code: '52', name: 'Deudas a corto plazo', amount: getAccountBalance('52', '53') },
      ]
    };

    const totalActivo = activoNoCorreinte.amount + activoCorriente.amount;
    const totalPatrimonioYPasivo = patrimonioNeto.amount + pasivoNoCorreinte.amount + pasivoCorriente.amount;

    return {
      activo: [activoNoCorreinte, activoCorriente],
      totalActivo,
      patrimonioNeto,
      pasivo: [pasivoNoCorreinte, pasivoCorriente],
      totalPatrimonioYPasivo,
      isBalanced: Math.abs(totalActivo - totalPatrimonioYPasivo) < 0.01
    };
  }, [accounts]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: selectedCompany?.currency || 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const renderSection = (section: BalanceSection, level: number = 0) => {
    const isPositive = section.amount >= 0;
    
    return (
      <div key={section.code} className={cn("space-y-1", level > 0 && "ml-4")}>
        <div className={cn(
          "flex items-center justify-between py-2 px-3 rounded-lg",
          level === 0 ? "bg-muted/50 font-semibold" : "hover:bg-muted/30"
        )}>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-12">{section.code}</span>
            <span className={cn(level === 0 && "font-medium")}>{section.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className={cn(
              "font-mono",
              isPositive ? "text-foreground" : "text-destructive"
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

  if (!selectedCompany) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-muted-foreground">
          Selecciona una empresa para ver el balance de situación
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
            <Scale className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Balance de Situación</h3>
            <p className="text-sm text-muted-foreground">
              {selectedFiscalYear?.year || 'Ejercicio actual'}
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
          
          <Button variant="outline" size="icon" onClick={() => refetch()}>
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

      {/* Balance Status */}
      {balanceData && (
        <Card className={cn(
          "border-l-4",
          balanceData.isBalanced ? "border-l-green-500" : "border-l-destructive"
        )}>
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {balanceData.isBalanced ? (
                  <>
                    <Badge variant="default" className="bg-green-500">Cuadrado</Badge>
                    <span className="text-sm text-muted-foreground">
                      Activo = Patrimonio Neto + Pasivo
                    </span>
                  </>
                ) : (
                  <>
                    <Badge variant="destructive">Descuadre</Badge>
                    <span className="text-sm text-destructive">
                      Diferencia: {formatCurrency(Math.abs(balanceData.totalActivo - balanceData.totalPatrimonioYPasivo))}
                    </span>
                  </>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Balance Sheet */}
      <div className="grid grid-cols-2 gap-4">
        {/* ACTIVO */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              ACTIVO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {balanceData?.activo.map(section => renderSection(section))}
              </div>
            </ScrollArea>
            <div className="mt-4 pt-4 border-t flex items-center justify-between font-bold">
              <span>TOTAL ACTIVO</span>
              <span className="font-mono text-lg">
                {formatCurrency(balanceData?.totalActivo || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* PATRIMONIO NETO Y PASIVO */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Coins className="h-5 w-5 text-green-500" />
              PATRIMONIO NETO Y PASIVO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {/* Patrimonio Neto */}
                {balanceData && renderSection(balanceData.patrimonioNeto)}
                
                {/* Pasivo */}
                {balanceData?.pasivo.map(section => renderSection(section))}
              </div>
            </ScrollArea>
            <div className="mt-4 pt-4 border-t flex items-center justify-between font-bold">
              <span>TOTAL P.N. + PASIVO</span>
              <span className="font-mono text-lg">
                {formatCurrency(balanceData?.totalPatrimonioYPasivo || 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ratios Financieros */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ratios Financieros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Ratio de Liquidez</p>
              <p className="text-xl font-bold">
                {balanceData ? ((balanceData.activo[1]?.amount || 0) / (balanceData.pasivo[1]?.amount || 1)).toFixed(2) : '-'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Ratio de Endeudamiento</p>
              <p className="text-xl font-bold">
                {balanceData ? (((balanceData.pasivo[0]?.amount || 0) + (balanceData.pasivo[1]?.amount || 0)) / (balanceData.patrimonioNeto?.amount || 1) * 100).toFixed(1) : '-'}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Fondo de Maniobra</p>
              <p className="text-xl font-bold">
                {balanceData ? formatCurrency((balanceData.activo[1]?.amount || 0) - (balanceData.pasivo[1]?.amount || 0)) : '-'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Autonomía Financiera</p>
              <p className="text-xl font-bold">
                {balanceData ? ((balanceData.patrimonioNeto?.amount || 0) / (balanceData.totalActivo || 1) * 100).toFixed(1) : '-'}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BalanceSheetPanel;
