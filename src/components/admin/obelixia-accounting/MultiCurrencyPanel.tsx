/**
 * MultiCurrencyPanel - Fase 6: Multi-Currency & International Operations
 * Panel de gestión de múltiples divisas, tipos de cambio y exposición cambiaria
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RefreshCw, 
  Globe2, 
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Maximize2,
  Minimize2,
  DollarSign,
  Euro,
  PoundSterling,
  Coins,
  BarChart3,
  Shield,
  Plus,
  Trash2
} from 'lucide-react';
import { useObelixiaMultiCurrency, Currency, ExchangeRate, CurrencyExposure } from '@/hooks/admin/obelixia-accounting/useObelixiaMultiCurrency';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface MultiCurrencyPanelProps {
  className?: string;
}

const getCurrencyIcon = (code: string) => {
  switch (code) {
    case 'EUR': return Euro;
    case 'USD': return DollarSign;
    case 'GBP': return PoundSterling;
    default: return Coins;
  }
};

const getRiskColor = (level: string) => {
  switch (level) {
    case 'low': return 'text-green-500 bg-green-500/10';
    case 'medium': return 'text-yellow-500 bg-yellow-500/10';
    case 'high': return 'text-red-500 bg-red-500/10';
    default: return 'text-muted-foreground bg-muted';
  }
};

export function MultiCurrencyPanel({ className }: MultiCurrencyPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('currencies');
  const [convertFrom, setConvertFrom] = useState('EUR');
  const [convertTo, setConvertTo] = useState('USD');
  const [convertAmount, setConvertAmount] = useState('1000');
  const [conversionResult, setConversionResult] = useState<number | null>(null);

  const {
    isLoading,
    currencies,
    exchangeRates,
    exposureReport,
    error,
    lastRefresh,
    fetchCurrencies,
    updateExchangeRates,
    convertCurrency,
    getExposureReport,
    manageCurrency
  } = useObelixiaMultiCurrency();

  // Cargar datos iniciales
  useEffect(() => {
    fetchCurrencies({ baseCurrency: 'EUR' });
  }, [fetchCurrencies]);

  // Manejar conversión
  const handleConvert = useCallback(async () => {
    const result = await convertCurrency(
      parseFloat(convertAmount),
      convertFrom,
      convertTo
    );
    if (result) {
      setConversionResult(result.toAmount);
    }
  }, [convertAmount, convertFrom, convertTo, convertCurrency]);

  // Cargar reporte de exposición
  const handleLoadExposure = useCallback(() => {
    getExposureReport({ baseCurrency: 'EUR' });
  }, [getExposureReport]);

  const baseCurrency = currencies.find(c => c.isBase);
  const activeCurrencies = currencies.filter(c => c.isActive);

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden border-primary/20",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-500/10 via-green-500/10 to-purple-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 shadow-lg">
              <Globe2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Multi-Divisa
                <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
                  Fase 6
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {lastRefresh 
                  ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Cargando divisas...'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => fetchCurrencies({ baseCurrency: 'EUR' })}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        {baseCurrency && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="p-2 rounded-lg bg-background/50 border">
              <p className="text-xs text-muted-foreground">Divisa Base</p>
              <p className="text-sm font-semibold flex items-center gap-1">
                {baseCurrency.symbol} {baseCurrency.code}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-background/50 border">
              <p className="text-xs text-muted-foreground">Divisas Activas</p>
              <p className="text-sm font-semibold">{activeCurrencies.length}</p>
            </div>
            <div className="p-2 rounded-lg bg-background/50 border">
              <p className="text-xs text-muted-foreground">Tipos de Cambio</p>
              <p className="text-sm font-semibold">{exchangeRates.length}</p>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className={cn("pt-3", isExpanded ? "h-[calc(100%-140px)]" : "")}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4 mb-3">
            <TabsTrigger value="currencies" className="text-xs gap-1">
              <Coins className="h-3 w-3" />
              Divisas
            </TabsTrigger>
            <TabsTrigger value="rates" className="text-xs gap-1">
              <ArrowRightLeft className="h-3 w-3" />
              Tipos
            </TabsTrigger>
            <TabsTrigger value="convert" className="text-xs gap-1">
              <DollarSign className="h-3 w-3" />
              Convertir
            </TabsTrigger>
            <TabsTrigger value="exposure" className="text-xs gap-1">
              <Shield className="h-3 w-3" />
              Exposición
            </TabsTrigger>
          </TabsList>

          {/* TAB: Divisas */}
          <TabsContent value="currencies" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-320px)]" : "h-[280px]"}>
              {error ? (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-sm">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  {error}
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {currencies.map((currency, index) => {
                      const Icon = getCurrencyIcon(currency.code);
                      return (
                        <motion.div
                          key={currency.code}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            "p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors",
                            currency.isBase && "border-primary/50 bg-primary/5"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "p-2 rounded-lg",
                                currency.isBase ? "bg-primary/20" : "bg-muted"
                              )}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{currency.code}</span>
                                  {currency.isBase && (
                                    <Badge variant="secondary" className="text-xs">Base</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{currency.name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              {currency.lastRate && (
                                <p className="text-sm font-mono">
                                  {currency.isBase ? '1.0000' : currency.lastRate.toFixed(4)}
                                </p>
                              )}
                              <div className="flex items-center gap-1">
                                {currency.isActive ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : (
                                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {currency.isActive ? 'Activa' : 'Inactiva'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* TAB: Tipos de Cambio */}
          <TabsContent value="rates" className="flex-1 mt-0">
            <div className="mb-3">
              <Button 
                size="sm" 
                onClick={() => updateExchangeRates('api')}
                disabled={isLoading}
                className="w-full"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                Actualizar Tipos de Cambio
              </Button>
            </div>
            <ScrollArea className={isExpanded ? "h-[calc(100vh-370px)]" : "h-[230px]"}>
              <div className="space-y-2">
                {exchangeRates.map((rate, index) => (
                  <motion.div
                    key={rate.id || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{rate.fromCurrency}</span>
                        <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{rate.toCurrency}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm">{rate.rate.toFixed(4)}</p>
                        <p className="text-xs text-muted-foreground">
                          Inv: {rate.inverseRate.toFixed(4)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {rate.source === 'api' ? 'API' : rate.source === 'manual' ? 'Manual' : 'Banco'}
                      </Badge>
                      <span>
                        {rate.validFrom ? new Date(rate.validFrom).toLocaleDateString('es-ES') : 'N/A'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* TAB: Convertidor */}
          <TabsContent value="convert" className="flex-1 mt-0">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">De</Label>
                  <Select value={convertFrom} onValueChange={setConvertFrom}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(c => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.symbol} {c.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">A</Label>
                  <Select value={convertTo} onValueChange={setConvertTo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(c => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.symbol} {c.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Cantidad</Label>
                <Input 
                  type="number"
                  value={convertAmount}
                  onChange={(e) => setConvertAmount(e.target.value)}
                  placeholder="1000"
                />
              </div>

              <Button 
                onClick={handleConvert}
                disabled={isLoading}
                className="w-full"
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Convertir
              </Button>

              {conversionResult !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20"
                >
                  <p className="text-sm text-muted-foreground text-center">Resultado</p>
                  <p className="text-2xl font-bold text-center text-primary">
                    {conversionResult.toLocaleString('es-ES', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })} {convertTo}
                  </p>
                </motion.div>
              )}
            </div>
          </TabsContent>

          {/* TAB: Exposición Cambiaria */}
          <TabsContent value="exposure" className="flex-1 mt-0">
            <div className="mb-3">
              <Button 
                size="sm" 
                onClick={handleLoadExposure}
                disabled={isLoading}
                className="w-full"
              >
                <BarChart3 className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                Generar Reporte de Exposición
              </Button>
            </div>

            <ScrollArea className={isExpanded ? "h-[calc(100vh-370px)]" : "h-[230px]"}>
              {exposureReport ? (
                <div className="space-y-3">
                  {/* Risk Score */}
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Puntuación de Riesgo</span>
                      <Badge className={getRiskColor(
                        exposureReport.riskScore < 40 ? 'low' : 
                        exposureReport.riskScore < 70 ? 'medium' : 'high'
                      )}>
                        {exposureReport.riskScore}/100
                      </Badge>
                    </div>
                    <Progress value={exposureReport.riskScore} className="h-2" />
                  </div>

                  {/* Exposures */}
                  {exposureReport.exposures?.map((exp, index) => (
                    <motion.div
                      key={exp.currency}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{exp.currency}</span>
                        <Badge className={getRiskColor(exp.riskLevel)}>
                          {exp.riskLevel === 'low' ? 'Bajo' : 
                           exp.riskLevel === 'medium' ? 'Medio' : 'Alto'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Exposición Neta</p>
                          <p className="font-mono">
                            {exp.netExposure?.toLocaleString('es-ES')} €
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">G/P No Realizada</p>
                          <p className={cn(
                            "font-mono",
                            (exp.unrealizedGainLoss || 0) >= 0 ? "text-green-500" : "text-red-500"
                          )}>
                            {(exp.unrealizedGainLoss || 0) >= 0 ? '+' : ''}
                            {exp.unrealizedGainLoss?.toLocaleString('es-ES')} €
                          </p>
                        </div>
                      </div>
                      <Progress 
                        value={exp.percentageOfTotal || 0} 
                        className="h-1.5 mt-2" 
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {exp.percentageOfTotal?.toFixed(1)}% del total
                      </p>
                    </motion.div>
                  ))}

                  {/* Recommendations */}
                  {exposureReport.recommendations && exposureReport.recommendations.length > 0 && (
                    <div className="p-3 rounded-lg border bg-amber-500/10 border-amber-500/30">
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Recomendaciones
                      </p>
                      <ul className="space-y-1">
                        {exposureReport.recommendations.map((rec, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="text-amber-500">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Genera un reporte para ver la exposición cambiaria</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default MultiCurrencyPanel;
