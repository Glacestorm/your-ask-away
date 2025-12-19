import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JourneyBuilder, SegmentManager, OmnichannelDashboard } from "@/components/cdp";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Route, MessageSquare, Target } from "lucide-react";

const CDPDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Customer Data Platform
          </h1>
          <p className="text-muted-foreground">
            Unifica la identidad del cliente y orquesta journeys omnicanal
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Perfiles Unificados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12,847</div>
              <p className="text-xs text-muted-foreground">+8% vs mes anterior</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Journeys Activos</CardTitle>
              <Route className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">5 automatizados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensajes Enviados</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45,231</div>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Segmentos</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-muted-foreground">3 dinámicos</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="journeys" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="journeys">Journey Builder</TabsTrigger>
            <TabsTrigger value="segments">Segmentación</TabsTrigger>
            <TabsTrigger value="omnichannel">Orquestación Omnicanal</TabsTrigger>
          </TabsList>

          <TabsContent value="journeys">
            <JourneyBuilder />
          </TabsContent>

          <TabsContent value="segments">
            <SegmentManager />
          </TabsContent>

          <TabsContent value="omnichannel">
            <OmnichannelDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CDPDashboard;
