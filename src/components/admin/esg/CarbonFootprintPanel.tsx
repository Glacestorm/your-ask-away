/**
 * Carbon Footprint Panel
 * Calculadora de huella de carbono con Scope 1, 2, 3
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Calculator, 
  Globe, 
  Factory, 
  Zap, 
  Truck, 
  Plane,
  TreeDeciduous,
  TrendingDown,
  Leaf,
  Info,
  RefreshCw,
  Download,
  ShoppingCart
} from 'lucide-react';
import { useESGCompliance } from '@/hooks/admin/esg';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CarbonFootprintPanelProps {
  industry?: string;
  className?: string;
}

export function CarbonFootprintPanel({ industry, className }: CarbonFootprintPanelProps) {
  const [activeTab, setActiveTab] = useState('calculator');
  const [region, setRegion] = useState('europe');
  
  // Formulario de consumo
  const [consumption, setConsumption] = useState({
    // Scope 1
    natural_gas_m3: 5000,
    diesel_l: 2000,
    gasoline_l: 1000,
    company_vehicle_km: 50000,
    // Scope 2
    electricity_kwh: 150000,
    heating_kwh: 20000,
    cooling_kwh: 15000,
    // Scope 3
    flight_km: 25000,
    train_km: 10000,
    commute_km: 100000,
    waste_kg: 5000,
    water_m3: 1000,
    paper_kg: 500,
    plastic_kg: 100,
    purchased_goods_eur: 500000,
    upstream_transport_km: 50000
  });

  const [employees, setEmployees] = useState(50);
  const [revenue, setRevenue] = useState(5000000);

  const {
    isLoading,
    carbonFootprint,
    offsets,
    calculateCarbonFootprint,
    getOffsetOptions
  } = useESGCompliance();

  const handleCalculate = async () => {
    await calculateCarbonFootprint(consumption, { region, employees, revenue });
    toast.success('Huella de carbono calculada');
  };

  const handleGetOffsets = async () => {
    if (carbonFootprint?.total_emissions_tons) {
      await getOffsetOptions(carbonFootprint.total_emissions_tons);
    }
  };

  const updateConsumption = (key: string, value: number) => {
    setConsumption(prev => ({ ...prev, [key]: value }));
  };

  const totalEmissions = carbonFootprint?.total_emissions_tons || 0;
  const scope1Percent = carbonFootprint ? (carbonFootprint.scope1.total / carbonFootprint.total_emissions_kg * 100) : 0;
  const scope2Percent = carbonFootprint ? (carbonFootprint.scope2.total / carbonFootprint.total_emissions_kg * 100) : 0;
  const scope3Percent = carbonFootprint ? (carbonFootprint.scope3.total / carbonFootprint.total_emissions_kg * 100) : 0;

  return (
    <div className={cn("space-y-6", className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calculadora
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Resultados
          </TabsTrigger>
          <TabsTrigger value="offsets" className="flex items-center gap-2">
            <TreeDeciduous className="h-4 w-4" />
            Compensación
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scope 1 - Emisiones Directas */}
            <Card className="border-red-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Factory className="h-5 w-5 text-red-500" />
                  Scope 1 - Emisiones Directas
                </CardTitle>
                <CardDescription>Combustibles y vehículos propios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="natural_gas">Gas Natural (m³/año)</Label>
                  <Input
                    id="natural_gas"
                    type="number"
                    value={consumption.natural_gas_m3}
                    onChange={(e) => updateConsumption('natural_gas_m3', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diesel">Diesel (litros/año)</Label>
                  <Input
                    id="diesel"
                    type="number"
                    value={consumption.diesel_l}
                    onChange={(e) => updateConsumption('diesel_l', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gasoline">Gasolina (litros/año)</Label>
                  <Input
                    id="gasoline"
                    type="number"
                    value={consumption.gasoline_l}
                    onChange={(e) => updateConsumption('gasoline_l', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle_km">Vehículos empresa (km/año)</Label>
                  <Input
                    id="vehicle_km"
                    type="number"
                    value={consumption.company_vehicle_km}
                    onChange={(e) => updateConsumption('company_vehicle_km', Number(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Scope 2 - Energía Indirecta */}
            <Card className="border-yellow-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Scope 2 - Energía Indirecta
                </CardTitle>
                <CardDescription>Electricidad, calefacción, refrigeración</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="electricity">Electricidad (kWh/año)</Label>
                  <Input
                    id="electricity"
                    type="number"
                    value={consumption.electricity_kwh}
                    onChange={(e) => updateConsumption('electricity_kwh', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heating">Calefacción (kWh/año)</Label>
                  <Input
                    id="heating"
                    type="number"
                    value={consumption.heating_kwh}
                    onChange={(e) => updateConsumption('heating_kwh', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cooling">Refrigeración (kWh/año)</Label>
                  <Input
                    id="cooling"
                    type="number"
                    value={consumption.cooling_kwh}
                    onChange={(e) => updateConsumption('cooling_kwh', Number(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Scope 3 - Cadena de Valor */}
            <Card className="border-orange-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="h-5 w-5 text-orange-500" />
                  Scope 3 - Cadena de Valor
                </CardTitle>
                <CardDescription>Viajes, residuos, suministros</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="flights">Vuelos (km/año)</Label>
                  <Input
                    id="flights"
                    type="number"
                    value={consumption.flight_km}
                    onChange={(e) => updateConsumption('flight_km', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="train">Tren (km/año)</Label>
                  <Input
                    id="train"
                    type="number"
                    value={consumption.train_km}
                    onChange={(e) => updateConsumption('train_km', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waste">Residuos (kg/año)</Label>
                  <Input
                    id="waste"
                    type="number"
                    value={consumption.waste_kg}
                    onChange={(e) => updateConsumption('waste_kg', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchased">Compras (€/año)</Label>
                  <Input
                    id="purchased"
                    type="number"
                    value={consumption.purchased_goods_eur}
                    onChange={(e) => updateConsumption('purchased_goods_eur', Number(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configuración y Calcular */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                  <Label>Región</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="europe">Europa</SelectItem>
                      <SelectItem value="north_america">Norteamérica</SelectItem>
                      <SelectItem value="latam">Latinoamérica</SelectItem>
                      <SelectItem value="asia">Asia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Número de empleados</Label>
                  <Input
                    type="number"
                    value={employees}
                    onChange={(e) => setEmployees(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ingresos anuales (€)</Label>
                  <Input
                    type="number"
                    value={revenue}
                    onChange={(e) => setRevenue(Number(e.target.value))}
                  />
                </div>
                <Button onClick={handleCalculate} disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Calculando...</>
                  ) : (
                    <><Calculator className="h-4 w-4 mr-2" /> Calcular Huella</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          {carbonFootprint ? (
            <div className="space-y-6">
              {/* Resumen Total */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                  <CardContent className="pt-6 text-center">
                    <Globe className="h-8 w-8 mx-auto text-green-500 mb-2" />
                    <p className="text-3xl font-bold">{totalEmissions.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">tCO₂e Total</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-2xl font-bold">{carbonFootprint.per_employee.toFixed(0)}</p>
                    <p className="text-sm text-muted-foreground">kg CO₂e/empleado</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-2xl font-bold">{carbonFootprint.per_million_revenue.toFixed(0)}</p>
                    <p className="text-sm text-muted-foreground">kg CO₂e/M€ ingresos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-2xl font-bold">{carbonFootprint.carbon_intensity.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Intensidad de carbono</p>
                  </CardContent>
                </Card>
              </div>

              {/* Desglose por Scope */}
              <Card>
                <CardHeader>
                  <CardTitle>Desglose por Scope</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Barra visual */}
                    <div className="h-8 rounded-lg overflow-hidden flex">
                      <div 
                        className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${scope1Percent}%` }}
                      >
                        {scope1Percent > 10 && `${scope1Percent.toFixed(0)}%`}
                      </div>
                      <div 
                        className="bg-yellow-500 flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${scope2Percent}%` }}
                      >
                        {scope2Percent > 10 && `${scope2Percent.toFixed(0)}%`}
                      </div>
                      <div 
                        className="bg-orange-500 flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${scope3Percent}%` }}
                      >
                        {scope3Percent > 10 && `${scope3Percent.toFixed(0)}%`}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <span className="font-medium">Scope 1</span>
                        </div>
                        <p className="text-2xl font-bold">{(carbonFootprint.scope1.total / 1000).toFixed(2)} t</p>
                        <p className="text-sm text-muted-foreground">{scope1Percent.toFixed(1)}% del total</p>
                      </div>
                      <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500" />
                          <span className="font-medium">Scope 2</span>
                        </div>
                        <p className="text-2xl font-bold">{(carbonFootprint.scope2.total / 1000).toFixed(2)} t</p>
                        <p className="text-sm text-muted-foreground">{scope2Percent.toFixed(1)}% del total</p>
                      </div>
                      <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full bg-orange-500" />
                          <span className="font-medium">Scope 3</span>
                        </div>
                        <p className="text-2xl font-bold">{(carbonFootprint.scope3.total / 1000).toFixed(2)} t</p>
                        <p className="text-sm text-muted-foreground">{scope3Percent.toFixed(1)}% del total</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recomendaciones */}
              {carbonFootprint.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-green-500" />
                      Recomendaciones de Reducción
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {carbonFootprint.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Leaf className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-4">
                <Button onClick={handleGetOffsets}>
                  <TreeDeciduous className="h-4 w-4 mr-2" />
                  Ver opciones de compensación
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar informe
                </Button>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Completa el formulario y calcula tu huella de carbono
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="offsets" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TreeDeciduous className="h-5 w-5 text-green-500" />
                  Marketplace de Créditos de Carbono
                </CardTitle>
                <CardDescription>
                  Compensa tus emisiones con proyectos verificados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {offsets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {offsets.map((offset, idx) => (
                      <Card key={idx} className="border-green-500/20">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold">{offset.name}</h4>
                              <p className="text-sm text-muted-foreground">{offset.location}</p>
                            </div>
                            <Badge variant="outline" className="text-green-500 border-green-500/30">
                              ⭐ {offset.rating}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Tipo:</span>
                              <span className="capitalize">{offset.type.replace('_', ' ')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Precio/tCO₂:</span>
                              <span className="font-medium">${offset.price_per_ton}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Coste total:</span>
                              <span className="font-bold text-green-500">${offset.total_cost.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground mb-2">Co-beneficios:</p>
                            <div className="flex flex-wrap gap-1">
                              {offset.co_benefits.map((benefit, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {benefit}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button className="w-full mt-4" variant="outline" size="sm">
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Comprar créditos
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TreeDeciduous className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Calcula tu huella de carbono para ver opciones de compensación
                    </p>
                    <Button onClick={handleGetOffsets} disabled={!carbonFootprint}>
                      Ver opciones disponibles
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CarbonFootprintPanel;
