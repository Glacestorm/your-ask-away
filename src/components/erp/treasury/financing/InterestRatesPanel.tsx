import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Euro,
  DollarSign,
  PoundSterling,
  Landmark,
  Info
} from 'lucide-react';
import { useERPMarketRates, type MarketRate } from '@/hooks/erp/useERPMarketRates';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const currencyIcons: Record<string, React.ElementType> = {
  EUR: Euro,
  USD: DollarSign,
  GBP: PoundSterling,
  CHF: () => <span className="font-bold text-sm">CHF</span>
};

const sourceLabels: Record<string, string> = {
  ECB: 'Banco Central Europeo',
  FED: 'Reserva Federal',
  BOE: 'Banco de Inglaterra',
  SNB: 'Banco Nacional Suizo'
};

interface RateCardProps {
  rate: MarketRate;
  previousValue?: number;
}

function RateCard({ rate, previousValue }: RateCardProps) {
  const change = previousValue ? rate.rate_value - previousValue : 0;
  const Icon = currencyIcons[rate.currency] || Euro;
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{rate.rate_code.toUpperCase().replace(/_/g, ' ')}</span>
            <Badge variant="outline" className="text-xs">{rate.tenor}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{sourceLabels[rate.source] || rate.source}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold">{rate.rate_value.toFixed(3)}%</p>
        {change !== 0 && (
          <div className={`flex items-center justify-end gap-1 text-xs ${change > 0 ? 'text-red-500' : 'text-green-500'}`}>
            {change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{change > 0 ? '+' : ''}{change.toFixed(3)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function InterestRatesPanel() {
  const [activeTab, setActiveTab] = useState('EUR');
  
  const {
    rates,
    ratesByCurrency,
    centralBankRates,
    referenceRates,
    isLoading,
    refetch
  } = useERPMarketRates();

  const currencies = ['EUR', 'USD', 'GBP', 'CHF'];

  return (
    <div className="space-y-4">
      {/* Central Bank Rates Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {centralBankRates.slice(0, 4).map((rate) => {
          const Icon = currencyIcons[rate.currency] || Landmark;
          return (
            <Card key={rate.rate_code}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {rate.source}
                    </span>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{sourceLabels[rate.source]}</p>
                        <p className="text-xs">Actualizado: {rate.rate_date}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-2xl font-bold mt-1">{rate.rate_value.toFixed(2)}%</p>
                <p className="text-xs text-muted-foreground mt-1">Tipo oficial {rate.currency}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Rates by Currency */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tipos de Interés de Referencia
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              {currencies.map((currency) => {
                const Icon = currencyIcons[currency] || Euro;
                return (
                  <TabsTrigger key={currency} value={currency} className="flex items-center gap-1">
                    <Icon className="h-4 w-4" />
                    {currency}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            
            {currencies.map((currency) => (
              <TabsContent key={currency} value={currency} className="mt-4">
                <ScrollArea className="h-[350px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : !ratesByCurrency[currency]?.length ? (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <Minus className="h-8 w-8 mb-2" />
                      <p>No hay tipos disponibles para {currency}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {ratesByCurrency[currency].map((rate) => (
                        <RateCard key={rate.rate_code} rate={rate} />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Reference Rates Quick View */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Euribor - Tipos de Referencia Hipotecarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {referenceRates
              .filter(r => r.rate_code.startsWith('euribor_'))
              .map((rate) => (
                <div key={rate.rate_code} className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground mb-1">
                    Euribor {rate.tenor}
                  </p>
                  <p className="text-xl font-bold">{rate.rate_value.toFixed(3)}%</p>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default InterestRatesPanel;
