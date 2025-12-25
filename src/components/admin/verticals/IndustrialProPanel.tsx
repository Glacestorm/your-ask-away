import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Factory, 
  Boxes, 
  Gauge,
  Truck,
  RefreshCw,
  Wrench
} from 'lucide-react';
import { useIndustrialPro, DigitalTwin, PredictiveMaintenance, OEEMetrics, FleetVehicle } from '@/hooks/admin/verticals/useIndustrialPro';

export function IndustrialProPanel() {
  const [activeTab, setActiveTab] = useState('twin');
  const [digitalTwin, setDigitalTwin] = useState<DigitalTwin | null>(null);
  const [predictiveMaintenance, setPredictiveMaintenance] = useState<PredictiveMaintenance | null>(null);
  const [oeeMetrics, setOeeMetrics] = useState<OEEMetrics | null>(null);
  const [fleetStatus, setFleetStatus] = useState<FleetVehicle[] | null>(null);

  const {
    isLoading,
    getDigitalTwin,
    getPredictiveMaintenance,
    getOEEMetrics,
    getFleetStatus,
  } = useIndustrialPro();

  const handleDigitalTwin = async () => {
    const twin = await getDigitalTwin('asset-demo-1');
    if (twin) setDigitalTwin(twin);
  };

  const handleMaintenance = async () => {
    const maintenance = await getPredictiveMaintenance('asset-demo-1');
    if (maintenance) setPredictiveMaintenance(maintenance);
  };

  const handleOEE = async () => {
    const metrics = await getOEEMetrics('asset-demo-1');
    if (metrics) setOeeMetrics(metrics);
  };

  const handleFleet = async () => {
    const fleet = await getFleetStatus();
    if (fleet) setFleetStatus(fleet);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3 bg-gradient-to-r from-slate-500/10 via-zinc-500/10 to-gray-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-slate-600 to-zinc-700">
              <Factory className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Industrial PRO</CardTitle>
              <p className="text-xs text-muted-foreground">Digital Twin, OEE & Logística</p>
            </div>
          </div>
          <Badge variant="outline" className="text-slate-500 border-slate-500">
            PRO
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="twin" className="text-xs">
              <Boxes className="h-3 w-3 mr-1" />
              Twin
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="text-xs">
              <Wrench className="h-3 w-3 mr-1" />
              Mant.
            </TabsTrigger>
            <TabsTrigger value="oee" className="text-xs">
              <Gauge className="h-3 w-3 mr-1" />
              OEE
            </TabsTrigger>
            <TabsTrigger value="fleet" className="text-xs">
              <Truck className="h-3 w-3 mr-1" />
              Flota
            </TabsTrigger>
          </TabsList>

          <TabsContent value="twin" className="mt-0">
            <ScrollArea className="h-[250px]">
              <div className="space-y-3">
                <Button 
                  onClick={handleDigitalTwin} 
                  disabled={isLoading}
                  className="w-full bg-slate-600 hover:bg-slate-700"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Boxes className="h-4 w-4 mr-2" />}
                  Cargar Digital Twin
                </Button>

                {digitalTwin && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Estado en Tiempo Real</span>
                        <Badge variant="outline" className="text-green-500">Sincronizado</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded bg-background">
                          <p className="text-lg font-bold">{digitalTwin.real_time_data?.temperature || 0}°</p>
                          <p className="text-xs text-muted-foreground">Temp</p>
                        </div>
                        <div className="p-2 rounded bg-background">
                          <p className="text-lg font-bold">{digitalTwin.real_time_data?.pressure || 0}</p>
                          <p className="text-xs text-muted-foreground">Bar</p>
                        </div>
                        <div className="p-2 rounded bg-background">
                          <p className="text-lg font-bold">{digitalTwin.real_time_data?.rpm || 0}</p>
                          <p className="text-xs text-muted-foreground">RPM</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="maintenance" className="mt-0">
            <ScrollArea className="h-[250px]">
              <div className="space-y-3">
                <Button 
                  onClick={handleMaintenance} 
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Wrench className="h-4 w-4 mr-2" />}
                  Análisis Predictivo
                </Button>

                {predictiveMaintenance && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Probabilidad de Fallo</span>
                        <Badge variant={predictiveMaintenance.failure_probability > 0.5 ? "destructive" : "secondary"}>
                          {Math.round(predictiveMaintenance.failure_probability * 100)}%
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Fecha estimada: {new Date(predictiveMaintenance.predicted_failure_date).toLocaleDateString()}
                      </div>
                      <div className="text-xs">
                        Confianza: {Math.round(predictiveMaintenance.confidence * 100)}%
                      </div>
                      {predictiveMaintenance.recommended_actions?.map((action, idx) => (
                        <div key={idx} className="p-2 rounded bg-background border text-xs">
                          <div className="flex items-center justify-between">
                            <span>{action.action}</span>
                            <Badge variant="outline">{action.priority}</Badge>
                          </div>
                          <span className="text-muted-foreground">Costo est.: ${action.estimated_cost}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="oee" className="mt-0">
            <ScrollArea className="h-[250px]">
              <div className="space-y-3">
                <Button 
                  onClick={handleOEE} 
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Gauge className="h-4 w-4 mr-2" />}
                  Calcular OEE
                </Button>

                {oeeMetrics && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-3 space-y-3">
                      <div className="text-center p-3 rounded bg-background">
                        <p className="text-3xl font-bold">{Math.round(oeeMetrics.oee * 100)}%</p>
                        <p className="text-xs text-muted-foreground">OEE Total</p>
                        <p className="text-xs text-muted-foreground">Objetivo: {Math.round(oeeMetrics.target_oee * 100)}%</p>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Disponibilidad</span>
                            <span>{Math.round(oeeMetrics.availability * 100)}%</span>
                          </div>
                          <Progress value={oeeMetrics.availability * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Rendimiento</span>
                            <span>{Math.round(oeeMetrics.performance * 100)}%</span>
                          </div>
                          <Progress value={oeeMetrics.performance * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Calidad</span>
                            <span>{Math.round(oeeMetrics.quality * 100)}%</span>
                          </div>
                          <Progress value={oeeMetrics.quality * 100} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="fleet" className="mt-0">
            <ScrollArea className="h-[250px]">
              <div className="space-y-3">
                <Button 
                  onClick={handleFleet} 
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Truck className="h-4 w-4 mr-2" />}
                  Estado de Flota
                </Button>

                {fleetStatus && fleetStatus.length > 0 && (
                  <div className="space-y-2">
                    {fleetStatus.map((vehicle, idx) => (
                      <Card key={idx} className="bg-muted/50">
                        <CardContent className="p-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            <div>
                              <p className="text-xs font-medium">{vehicle.id}</p>
                              <p className="text-xs text-muted-foreground">{vehicle.vehicle_type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={vehicle.status === 'available' ? 'secondary' : 'outline'}>
                              {vehicle.status}
                            </Badge>
                            <span className="text-xs">{vehicle.fuel_level}%</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default IndustrialProPanel;
