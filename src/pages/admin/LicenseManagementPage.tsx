/**
 * License Management Page
 * Unified dashboard for enterprise license management
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Key,
  Shield,
  BarChart3,
  Settings,
  Zap,
  Monitor,
  AlertTriangle,
  FileText,
  RefreshCw,
  Sparkles,
  Bot,
  Crown
} from 'lucide-react';

// License components
import {
  LicensesDashboard,
  LicenseReportingDashboard,
  LicenseAutomation,
  LicenseSystemPanel,
  LicenseHelpButton,
  LicenseAIAgentPanel,
  LicensePlansManager
} from '@/components/admin/enterprise/licenses';

export default function LicenseManagementPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Trigger refresh in child components
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
                <Key className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Sistema de Licencias Enterprise
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gestión completa de licencias, dispositivos y análisis
                </p>
              </div>
              <Badge variant="secondary" className="ml-2">
                <Sparkles className="h-3 w-3 mr-1" />
                v2.0
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <LicenseHelpButton />
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation */}
          <div className="bg-card rounded-lg border p-1">
            <TabsList className="grid w-full grid-cols-6 lg:grid-cols-6 gap-1 bg-transparent">
              <TabsTrigger
                value="dashboard"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger
                value="ai-agent"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Bot className="h-4 w-4" />
                <span className="hidden sm:inline">Agente IA</span>
              </TabsTrigger>
              <TabsTrigger
                value="plans"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Crown className="h-4 w-4" />
                <span className="hidden sm:inline">Planes</span>
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analítica</span>
              </TabsTrigger>
              <TabsTrigger
                value="automation"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Automatización</span>
              </TabsTrigger>
              <TabsTrigger
                value="system"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Sistema</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            <LicensesDashboard />
          </TabsContent>

          {/* AI Agent Tab */}
          <TabsContent value="ai-agent" className="space-y-6 mt-6">
            <LicenseAIAgentPanel />
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-6 mt-6">
            <LicensePlansManager />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 mt-6">
            <LicenseReportingDashboard />
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6 mt-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500" />
                    <CardTitle>Centro de Automatización</CardTitle>
                  </div>
                  <CardDescription>
                    Configure reglas automáticas para gestión de licencias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LicenseAutomation />
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="border-dashed hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <AlertTriangle className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">Alertas de Expiración</h4>
                        <p className="text-xs text-muted-foreground">
                          Notificar antes de que expiren
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-dashed hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <Monitor className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">Limpieza de Dispositivos</h4>
                        <p className="text-xs text-muted-foreground">
                          Desactivar dispositivos inactivos
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-dashed hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <FileText className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">Reportes Programados</h4>
                        <p className="text-xs text-muted-foreground">
                          Enviar informes automáticos
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6 mt-6">
            <LicenseSystemPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
