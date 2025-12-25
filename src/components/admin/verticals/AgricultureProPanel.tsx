import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Leaf, 
  CloudRain, 
  Droplets,
  Satellite,
  RefreshCw,
  ThermometerSun,
  Gauge
} from 'lucide-react';
import { useAgriculturePro, PrecisionFarmingData, WeatherPrediction, IrrigationPlan } from '@/hooks/admin/verticals/useAgriculturePro';

export function AgricultureProPanel() {
  const [activeTab, setActiveTab] = useState('precision');
  const [precisionData, setPrecisionData] = useState<PrecisionFarmingData | null>(null);
  const [weatherPredictions, setWeatherPredictions] = useState<WeatherPrediction[] | null>(null);
  const [irrigationPlan, setIrrigationPlan] = useState<IrrigationPlan | null>(null);

  const {
    isLoading,
    getPrecisionFarmingData,
    getWeatherPredictions,
    getIrrigationPlan,
  } = useAgriculturePro();

  const handlePrecisionData = async () => {
    const data = await getPrecisionFarmingData('field-demo-1');
    if (data) setPrecisionData(data);
  };

  const handleWeather = async () => {
    const predictions = await getWeatherPredictions({ lat: 40.4168, lng: -3.7038 }, 7);
    if (predictions) setWeatherPredictions(predictions);
  };

  const handleIrrigation = async () => {
    const plan = await getIrrigationPlan('field-demo-1');
    if (plan) setIrrigationPlan(plan);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Agriculture PRO</CardTitle>
              <p className="text-xs text-muted-foreground">Agricultura de Precisión & IoT</p>
            </div>
          </div>
          <Badge variant="outline" className="text-green-500 border-green-500">
            PRO
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="precision" className="text-xs">
              <Satellite className="h-3 w-3 mr-1" />
              Precisión
            </TabsTrigger>
            <TabsTrigger value="weather" className="text-xs">
              <CloudRain className="h-3 w-3 mr-1" />
              Clima AI
            </TabsTrigger>
            <TabsTrigger value="irrigation" className="text-xs">
              <Droplets className="h-3 w-3 mr-1" />
              Riego
            </TabsTrigger>
          </TabsList>

          <TabsContent value="precision" className="mt-0">
            <ScrollArea className="h-[250px]">
              <div className="space-y-3">
                <Button 
                  onClick={handlePrecisionData} 
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Satellite className="h-4 w-4 mr-2" />}
                  Obtener Datos de Precisión
                </Button>

                {precisionData && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-3 space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>Índice NDVI</span>
                          <span className="font-medium">{precisionData.ndvi_index}</span>
                        </div>
                        <Progress value={precisionData.ndvi_index * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>Humedad del Suelo</span>
                          <span className="font-medium">{precisionData.soil_moisture}%</span>
                        </div>
                        <Progress value={precisionData.soil_moisture} className="h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>Salud del Cultivo</span>
                          <span className="font-medium">{precisionData.crop_health_score}/100</span>
                        </div>
                        <Progress value={precisionData.crop_health_score} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="weather" className="mt-0">
            <ScrollArea className="h-[250px]">
              <div className="space-y-3">
                <Button 
                  onClick={handleWeather} 
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <CloudRain className="h-4 w-4 mr-2" />}
                  Predicción Climática 7 días
                </Button>

                {weatherPredictions && weatherPredictions.length > 0 && (
                  <div className="space-y-2">
                    {weatherPredictions.slice(0, 5).map((day, idx) => (
                      <Card key={idx} className="bg-muted/50">
                        <CardContent className="p-2 flex items-center justify-between">
                          <span className="text-xs font-medium">{day.date}</span>
                          <div className="flex items-center gap-3 text-xs">
                            <div className="flex items-center gap-1">
                              <ThermometerSun className="h-3 w-3 text-orange-500" />
                              <span>{Math.round(day.temperature?.min || 0)}° - {Math.round(day.temperature?.max || 0)}°</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Droplets className="h-3 w-3 text-blue-500" />
                              <span>{Math.round(day.precipitation_probability || 0)}%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="irrigation" className="mt-0">
            <ScrollArea className="h-[250px]">
              <div className="space-y-3">
                <Button 
                  onClick={handleIrrigation} 
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Droplets className="h-4 w-4 mr-2" />}
                  Generar Plan de Riego AI
                </Button>

                {irrigationPlan && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Plan de Riego Optimizado</span>
                        <Badge variant="secondary" className="text-green-600">
                          -{irrigationPlan.water_savings_percent}% agua
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {irrigationPlan.zones?.map((zone, idx) => (
                          <div key={idx} className="p-2 rounded bg-background border text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Zona {zone.zone_id}</span>
                              <span>{zone.scheduled_time} - {zone.duration_minutes} min</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                              <Gauge className="h-3 w-3" />
                              <span>{zone.water_need_mm}mm necesarios</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 border-t text-xs text-muted-foreground">
                        Total estimado: {irrigationPlan.total_water_m3}m³
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default AgricultureProPanel;
