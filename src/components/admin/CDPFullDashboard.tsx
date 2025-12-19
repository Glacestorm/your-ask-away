import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JourneyBuilder, SegmentManager, OmnichannelDashboard } from "@/components/cdp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Route, MessageSquare, Target, UserCheck, Bell, Mail, Phone } from "lucide-react";
import { useCustomerJourneys } from "@/hooks/useCustomerJourneys";
import { useSegmentRules } from "@/hooks/useSegmentRules";
import { useOmnichannelMessages, useChannelConnectors } from "@/hooks/useOmnichannelMessages";

export function CDPFullDashboard() {
  const { journeys } = useCustomerJourneys();
  const { segments } = useSegmentRules();
  const { messages } = useOmnichannelMessages();
  const { connectors } = useChannelConnectors();

  const activeJourneys = journeys?.filter(j => j.status === 'active').length || 0;
  const totalSegments = segments?.length || 0;
  const totalMessages = messages?.length || 0;
  const activeConnectors = connectors?.filter(c => c.is_active).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Customer Data Platform 360°
          </h2>
          <p className="text-muted-foreground">
            Unifica la identidad del cliente y orquesta journeys omnicanal
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-teal-500/30 bg-gradient-to-br from-teal-500/5 to-teal-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Journeys Activos</CardTitle>
            <Route className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJourneys}</div>
            <p className="text-xs text-muted-foreground">Automatizaciones en ejecución</p>
          </CardContent>
        </Card>
        
        <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-purple-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Segmentos</CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSegments}</div>
            <p className="text-xs text-muted-foreground">Audiencias definidas</p>
          </CardContent>
        </Card>
        
        <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensajes</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMessages}</div>
            <p className="text-xs text-muted-foreground">Comunicaciones enviadas</p>
          </CardContent>
        </Card>
        
        <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-green-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canales Activos</CardTitle>
            <Bell className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeConnectors}</div>
            <p className="text-xs text-muted-foreground">Email, SMS, WhatsApp, VoIP</p>
          </CardContent>
        </Card>
      </div>

      {/* Demo Case Card */}
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-amber-500/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600">
            <UserCheck className="h-5 w-5" />
            Caso Demo: Carrito Abandonado + Ticket Abierto + Lead Caliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
              <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="text-red-500 font-bold text-sm">1</span>
              </div>
              <div>
                <p className="font-medium text-sm">Trigger: Carrito Abandonado</p>
                <p className="text-xs text-muted-foreground">Usuario abandona checkout hace 2h</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
              <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <span className="text-amber-500 font-bold text-sm">2</span>
              </div>
              <div>
                <p className="font-medium text-sm">Condición: Ticket Abierto</p>
                <p className="text-xs text-muted-foreground">Tiene ticket soporte sin resolver</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
              <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-green-500 font-bold text-sm">3</span>
              </div>
              <div>
                <p className="font-medium text-sm">Acción: Secuencia Automática</p>
                <p className="text-xs text-muted-foreground">Email → Espera 1h → WhatsApp → Llamada</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-blue-500/20 text-blue-600 text-xs">
              <Mail className="h-3 w-3" /> Email
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-green-500/20 text-green-600 text-xs">
              <MessageSquare className="h-3 w-3" /> WhatsApp
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-purple-500/20 text-purple-600 text-xs">
              <Phone className="h-3 w-3" /> VoIP
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="journeys" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="journeys" className="flex items-center gap-2">
            <Route className="h-4 w-4" />
            Journey Builder
          </TabsTrigger>
          <TabsTrigger value="segments" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Segmentación
          </TabsTrigger>
          <TabsTrigger value="omnichannel" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Orquestación Omnicanal
          </TabsTrigger>
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
  );
}
