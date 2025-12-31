/**
 * Simulador de Precios - Motor de cálculo de precios con descuentos
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calculator,
  ArrowRight,
  Package,
  Users,
  Tag,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { useMaestros, PriceCalculation } from '@/hooks/erp/useMaestros';
import { cn } from '@/lib/utils';

export const PriceSimulator: React.FC = () => {
  const { customers, items, calculatePrice } = useMaestros();
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [result, setResult] = useState<PriceCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async () => {
    if (!selectedItem) return;
    
    setIsCalculating(true);
    const calculation = await calculatePrice(
      selectedCustomer || null,
      selectedItem,
      quantity
    );
    setResult(calculation);
    setIsCalculating(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(price);
  };

  const selectedItemData = items.find(i => i.id === selectedItem);
  const selectedCustomerData = customers.find(c => c.id === selectedCustomer);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Panel de entrada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Simulador de Precios
          </CardTitle>
          <CardDescription>
            Calcula el precio final aplicando listas de precios y descuentos
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Cliente (opcional)
              </Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger id="customer">
                  <SelectValue placeholder="Seleccionar cliente para descuentos específicos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin cliente específico</SelectItem>
                  {customers.filter(c => c.is_active).map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} - {c.legal_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Artículo *
              </Label>
              <Select value={selectedItem} onValueChange={setSelectedItem}>
                <SelectTrigger id="item">
                  <SelectValue placeholder="Seleccionar artículo" />
                </SelectTrigger>
                <SelectContent>
                  {items.filter(i => i.is_active).map(i => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.sku} - {i.name} ({formatPrice(i.sale_price)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
          </div>

          <Button 
            onClick={handleCalculate} 
            className="w-full gap-2"
            disabled={!selectedItem || isCalculating}
          >
            {isCalculating ? (
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Calcular Precio
          </Button>

          {/* Info del artículo seleccionado */}
          {selectedItemData && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="text-sm font-medium">{selectedItemData.name}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Precio base:</span>
                <span className="font-mono">{formatPrice(selectedItemData.sale_price)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Coste:</span>
                <span className="font-mono">{formatPrice(selectedItemData.standard_cost)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Panel de resultados */}
      <Card className={cn(!result && 'opacity-50')}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Resultado del Cálculo
          </CardTitle>
        </CardHeader>

        <CardContent>
          {!result ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Selecciona un artículo y haz clic en calcular</p>
            </div>
          ) : result.error ? (
            <div className="text-center py-12 text-destructive">
              <p>Error: {result.error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Resumen principal */}
              <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-1">Precio Total</p>
                <p className="text-4xl font-bold text-primary">
                  {formatPrice(result.total_price)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {result.quantity} × {formatPrice(result.unit_price)}
                </p>
              </div>

              {/* Desglose */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Precio base</span>
                  <span className="font-mono">{formatPrice(result.base_price)}</span>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground flex items-center gap-2">
                    Origen
                    <Badge variant="outline" className="text-xs">
                      {result.price_source === 'price_list' ? 'Lista de Precios' : 'Artículo'}
                    </Badge>
                  </span>
                </div>

                {result.total_discount > 0 && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between py-2 text-green-600">
                      <span className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" />
                        Descuento total
                      </span>
                      <span className="font-mono">-{formatPrice(result.total_discount)}</span>
                    </div>

                    {/* Detalle de descuentos */}
                    {result.discounts_applied && result.discounts_applied.length > 0 && (
                      <div className="pl-4 space-y-2">
                        {result.discounts_applied.map((discount, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center justify-between text-sm text-muted-foreground"
                          >
                            <span className="flex items-center gap-2">
                              <ArrowRight className="h-3 w-3" />
                              {discount.rule_name}
                              <Badge variant="secondary" className="text-xs">
                                {discount.scope}
                              </Badge>
                            </span>
                            <span className="font-mono">-{formatPrice(discount.discount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                <Separator />

                <div className="flex items-center justify-between py-2 font-medium">
                  <span>Precio unitario final</span>
                  <span className="font-mono text-lg">{formatPrice(result.unit_price)}</span>
                </div>
              </div>

              {/* Info adicional */}
              {selectedCustomerData && (
                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  <span className="text-muted-foreground">Cliente: </span>
                  <span className="font-medium">{selectedCustomerData.legal_name}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PriceSimulator;
