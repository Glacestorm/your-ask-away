import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Calculator, Plus, Trash2, TrendingDown, Package, Sparkles, Euro } from 'lucide-react';
import { useCNAEPricing, CNAEPriceDetail } from '@/hooks/useCNAEPricing';
import { useLanguage } from '@/contexts/LanguageContext';

interface CNAEPricingCalculatorProps {
  companyId?: string;
  companyTurnover?: number;
  onPricingCalculated?: (total: number) => void;
}

export function CNAEPricingCalculator({ 
  companyId, 
  companyTurnover,
  onPricingCalculated 
}: CNAEPricingCalculatorProps) {
  const { t } = useLanguage();
  const [selectedCnaes, setSelectedCnaes] = useState<string[]>([]);
  const [cnaeInput, setCnaeInput] = useState('');
  const [turnover, setTurnover] = useState<number>(companyTurnover || 0);
  const [availableCnaes, setAvailableCnaes] = useState<any[]>([]);
  
  const {
    isLoading,
    pricingResult,
    calculatePricing,
    fetchCNAEPricing,
    getComplexityTierColor,
    getTurnoverTierLabel
  } = useCNAEPricing();

  useEffect(() => {
    loadAvailableCnaes();
  }, []);

  useEffect(() => {
    if (selectedCnaes.length > 0) {
      calculatePricing(selectedCnaes, turnover, companyId);
    }
  }, [selectedCnaes, turnover, companyId]);

  useEffect(() => {
    if (pricingResult && onPricingCalculated) {
      onPricingCalculated(pricingResult.summary.total_final_price);
    }
  }, [pricingResult, onPricingCalculated]);

  const loadAvailableCnaes = async () => {
    try {
      const data = await fetchCNAEPricing();
      setAvailableCnaes(data || []);
    } catch (error) {
      console.error('Error loading CNAEs:', error);
    }
  };

  const addCnae = (cnaeCode: string) => {
    if (cnaeCode && !selectedCnaes.includes(cnaeCode)) {
      setSelectedCnaes([...selectedCnaes, cnaeCode]);
      setCnaeInput('');
    }
  };

  const removeCnae = (cnaeCode: string) => {
    setSelectedCnaes(selectedCnaes.filter(c => c !== cnaeCode));
  };

  const filteredCnaes = availableCnaes.filter(cnae => 
    cnae.cnae_code.includes(cnaeInput) && !selectedCnaes.includes(cnae.cnae_code)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Calculadora de Precios CNAE
        </CardTitle>
        <CardDescription>
          Calcula el precio de licencia según los CNAEs seleccionados y facturación
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Turnover Input */}
        <div className="space-y-2">
          <Label>Facturación Anual (€)</Label>
          <Input
            type="number"
            value={turnover}
            onChange={(e) => setTurnover(Number(e.target.value))}
            placeholder="Ej: 1000000"
          />
          {pricingResult && (
            <p className="text-sm text-muted-foreground">
              Tier: {getTurnoverTierLabel(pricingResult.details[0]?.turnover_tier || 'medium')}
            </p>
          )}
        </div>

        {/* CNAE Selector */}
        <div className="space-y-2">
          <Label>Añadir CNAE</Label>
          <div className="flex gap-2">
            <Input
              value={cnaeInput}
              onChange={(e) => setCnaeInput(e.target.value)}
              placeholder="Buscar CNAE..."
            />
            <Button 
              onClick={() => addCnae(cnaeInput)}
              disabled={!cnaeInput || selectedCnaes.includes(cnaeInput)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {cnaeInput && filteredCnaes.length > 0 && (
            <ScrollArea className="h-32 border rounded-md p-2">
              {filteredCnaes.slice(0, 10).map(cnae => (
                <div
                  key={cnae.cnae_code}
                  className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                  onClick={() => addCnae(cnae.cnae_code)}
                >
                  <div>
                    <span className="font-medium">{cnae.cnae_code}</span>
                    <span className="text-muted-foreground ml-2 text-sm">
                      {cnae.sector_category}
                    </span>
                  </div>
                  <Badge className={getComplexityTierColor(cnae.complexity_tier)}>
                    {cnae.base_price.toLocaleString()}€
                  </Badge>
                </div>
              ))}
            </ScrollArea>
          )}
        </div>

        {/* Selected CNAEs */}
        {selectedCnaes.length > 0 && (
          <div className="space-y-2">
            <Label>CNAEs Seleccionados ({selectedCnaes.length})</Label>
            <div className="flex flex-wrap gap-2">
              {selectedCnaes.map(cnae => (
                <Badge key={cnae} variant="secondary" className="gap-1">
                  {cnae}
                  <button onClick={() => removeCnae(cnae)}>
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Pricing Result */}
        {isLoading ? (
          <div className="text-center py-4">Calculando...</div>
        ) : pricingResult ? (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground">Precio Base</div>
                  <div className="text-2xl font-bold">
                    {pricingResult.summary.total_base_price.toLocaleString()}€
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-primary/10">
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground">Precio Final</div>
                  <div className="text-2xl font-bold text-primary">
                    {pricingResult.summary.total_final_price.toLocaleString()}€
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Savings */}
            {pricingResult.summary.total_savings > 0 && (
              <div className="flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingDown className="h-5 w-5 text-green-600" />
                <span className="text-green-700 dark:text-green-300">
                  Ahorras {pricingResult.summary.total_savings.toLocaleString()}€ 
                  ({pricingResult.summary.savings_percentage}%)
                </span>
              </div>
            )}

            {/* Bundle Applied */}
            {pricingResult.summary.bundle_applied && (
              <div className="flex items-center gap-2 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Package className="h-5 w-5 text-purple-600" />
                <span className="text-purple-700 dark:text-purple-300">
                  {pricingResult.summary.bundle_applied.name}: 
                  -{pricingResult.summary.bundle_applied.discount}% descuento
                </span>
              </div>
            )}

            {/* Price Details */}
            <div className="space-y-2">
              <Label>Detalle por CNAE</Label>
              <ScrollArea className="h-40">
                {pricingResult.details.map((detail: CNAEPriceDetail) => (
                  <div key={detail.cnae_code} className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{detail.cnae_code}</span>
                      <Badge className={getComplexityTierColor(detail.complexity_tier)} variant="outline">
                        {detail.complexity_tier}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{detail.final_price.toLocaleString()}€</div>
                      {detail.volume_discount_pct > 0 && (
                        <div className="text-xs text-green-600">-{detail.volume_discount_pct}%</div>
                      )}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>

            {/* Recommendations */}
            {pricingResult.recommendations.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Recomendaciones
                </Label>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {pricingResult.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : selectedCnaes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Euro className="h-12 w-12 mx-auto mb-2 opacity-50" />
            Selecciona al menos un CNAE para calcular el precio
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
