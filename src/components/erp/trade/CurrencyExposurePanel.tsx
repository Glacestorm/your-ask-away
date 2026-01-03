/**
 * Currency Exposure Panel - FX Risk Dashboard
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  DollarSign,
  Euro,
  PoundSterling,
  AlertTriangle,
  Shield,
  Activity,
} from 'lucide-react';
import { useERPCurrencyExposure, CurrencyExposure } from '@/hooks/erp/useERPCurrencyExposure';
import { cn } from '@/lib/utils';

const CURRENCY_ICONS: Record<string, React.ElementType> = {
  USD: DollarSign,
  EUR: Euro,
  GBP: PoundSterling,
};

const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  JPY: '🇯🇵',
  CHF: '🇨🇭',
  CNY: '🇨🇳',
  CAD: '🇨🇦',
  AUD: '🇦🇺',
};

function formatCurrency(amount: number, currency: string = 'EUR') {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    notation: amount > 999999 ? 'compact' : 'standard',
    maximumFractionDigits: 0,
  }).format(amount);
}

function ExposureRow({ exposure, baseCurrency = 'EUR' }: { exposure: CurrencyExposure; baseCurrency?: string }) {
  const isLongPosition = exposure.netExposure > 0;
  const hedgeRatio = exposure.netExposure !== 0 
    ? Math.min((exposure.hedged / Math.abs(exposure.netExposure)) * 100, 100) 
    : 0;
  
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="text-xl">{CURRENCY_FLAGS[exposure.currency] || '💱'}</span>
          <div>
            <p className="font-medium">{exposure.currency}</p>
            <p className="text-xs text-muted-foreground">
              {isLongPosition ? 'Long' : 'Short'}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right font-mono text-green-600">
        {formatCurrency(exposure.receivables, exposure.currency)}
      </TableCell>
      <TableCell className="text-right font-mono text-red-600">
        {formatCurrency(exposure.payables, exposure.currency)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          {isLongPosition ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span className={cn(
            "font-mono font-medium",
            isLongPosition ? "text-green-600" : "text-red-600"
          )}>
            {formatCurrency(Math.abs(exposure.netExposure), exposure.currency)}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="w-full max-w-24">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Cobertura</span>
            <span className={cn(
              "font-medium",
              hedgeRatio >= 70 ? "text-green-600" : hedgeRatio >= 40 ? "text-yellow-600" : "text-red-600"
            )}>
              {hedgeRatio.toFixed(0)}%
            </span>
          </div>
          <Progress 
            value={hedgeRatio} 
            className={cn(
              "h-2",
              hedgeRatio >= 70 ? "[&>div]:bg-green-500" : 
              hedgeRatio >= 40 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-red-500"
            )}
          />
        </div>
      </TableCell>
      <TableCell className="text-right font-mono text-muted-foreground">
        {formatCurrency(exposure.unhedged, exposure.currency)}
      </TableCell>
    </TableRow>
  );
}

export function CurrencyExposurePanel() {
  const {
    exposures,
    rates,
    loading,
    stats,
    calculateExposures,
    fetchRates,
    getRate,
  } = useERPCurrencyExposure();

  useEffect(() => {
    calculateExposures();
    fetchRates();
  }, [calculateExposures, fetchRates]);

  const handleRefresh = () => {
    calculateExposures();
    fetchRates();
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.totalExposure, 'EUR')}
                </p>
                <p className="text-xs text-muted-foreground">Exposición Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.hedgeRatio.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Ratio Cobertura</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Euro className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{exposures.length}</p>
                <p className="text-xs text-muted-foreground">Divisas Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={cn(
                "h-5 w-5",
                stats.riskLevel === 'high' ? "text-red-500" :
                stats.riskLevel === 'medium' ? "text-yellow-500" : "text-green-500"
              )} />
              <div>
                <Badge variant={
                  stats.riskLevel === 'high' ? 'destructive' :
                  stats.riskLevel === 'medium' ? 'outline' : 'secondary'
                }>
                  {stats.riskLevel === 'high' ? 'Alto' :
                   stats.riskLevel === 'medium' ? 'Medio' : 'Bajo'}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Nivel de Riesgo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Panel */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Exposición por Divisas
            </CardTitle>
            <CardDescription>
              Gestión de riesgo cambiario en operaciones de comercio exterior
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
            Actualizar
          </Button>
        </CardHeader>

        <CardContent>
          {exposures.length === 0 ? (
            <div className="py-12 text-center">
              <Euro className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-lg font-medium text-muted-foreground">
                Sin exposición cambiaria
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                No hay operaciones activas en divisas distintas a EUR
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[350px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Divisa</TableHead>
                    <TableHead className="text-right">Cobros</TableHead>
                    <TableHead className="text-right">Pagos</TableHead>
                    <TableHead className="text-right">Neto</TableHead>
                    <TableHead>Cobertura</TableHead>
                    <TableHead className="text-right">Sin Cubrir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exposures.map((exposure) => (
                    <ExposureRow key={exposure.currency} exposure={exposure} />
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Exchange Rates */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Tipos de Cambio (EUR base)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {['USD', 'GBP', 'JPY', 'CHF', 'CNY', 'CAD'].map((currency) => {
              const rate = getRate('EUR', currency);
              return (
                <div
                  key={currency}
                  className="p-3 rounded-lg border bg-card text-center"
                >
                  <span className="text-xl">{CURRENCY_FLAGS[currency] || '💱'}</span>
                  <p className="font-medium mt-1">{currency}</p>
                  <p className="text-lg font-mono font-bold text-primary">
                    {rate > 0 ? rate.toFixed(4) : 'N/A'}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CurrencyExposurePanel;
