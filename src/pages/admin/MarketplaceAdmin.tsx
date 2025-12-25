import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Store, 
  Package, 
  Users, 
  TrendingUp, 
  Settings,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppReviewPanel, PartnerManagementPanel, MarketplaceSettingsDialog } from '@/components/marketplace/admin';
import { Navigate } from 'react-router-dom';

export default function MarketplaceAdmin() {
  const { user, userRole, isAdmin, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Only allow admins
  if (!isAdmin && !isSuperAdmin) {
    return <Navigate to="/marketplace" replace />;
  }

  // Fetch marketplace stats
  const { data: stats } = useQuery({
    queryKey: ['marketplace-admin-stats'],
    queryFn: async () => {
      const [appsResult, partnersResult, installsResult] = await Promise.all([
        supabase.from('partner_applications').select('id, status', { count: 'exact' }),
        supabase.from('partner_companies').select('id, status', { count: 'exact' }),
        supabase.from('marketplace_installations').select('id', { count: 'exact' }).eq('is_active', true),
      ]);

      const apps = appsResult.data || [];
      const partners = partnersResult.data || [];

      return {
        totalApps: appsResult.count || 0,
        publishedApps: apps.filter(a => a.status === 'published').length,
        pendingApps: apps.filter(a => a.status === 'in_review').length,
        totalPartners: partnersResult.count || 0,
        activePartners: partners.filter(p => p.status === 'active').length,
        pendingPartners: partners.filter(p => p.status === 'pending').length,
        totalInstalls: installsResult.count || 0,
      };
    },
  });

  return (
    <DashboardLayout
      title="Admin Marketplace"
      subtitle="Gestión del marketplace y programa de partners"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
              <Store className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Administración del Marketplace</h1>
              <p className="text-muted-foreground">Panel de control para gestionar apps y partners</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </Button>
        </div>

        {/* Settings Dialog */}
        <MarketplaceSettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Apps Totales</p>
                  <p className="text-2xl font-bold">{stats?.totalApps || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.publishedApps || 0} publicadas
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={stats?.pendingApps ? 'border-amber-500/50' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes Revisión</p>
                  <p className="text-2xl font-bold">{stats?.pendingApps || 0}</p>
                  <p className="text-xs text-amber-500 mt-1">Requieren atención</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Partners</p>
                  <p className="text-2xl font-bold">{stats?.totalPartners || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.activePartners || 0} activos
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Instalaciones</p>
                  <p className="text-2xl font-bold">{stats?.totalInstalls?.toLocaleString() || 0}</p>
                  <p className="text-xs text-green-500 mt-1">Activas</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">
              <Store className="h-4 w-4 mr-2" />
              Visión General
            </TabsTrigger>
            <TabsTrigger value="reviews">
              <Shield className="h-4 w-4 mr-2" />
              Revisión de Apps
              {stats?.pendingApps ? (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 justify-center">
                  {stats.pendingApps}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="partners">
              <Users className="h-4 w-4 mr-2" />
              Partners
            </TabsTrigger>
            <TabsTrigger value="revenue">
              <DollarSign className="h-4 w-4 mr-2" />
              Ingresos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Actividad reciente */}
              <Card>
                <CardHeader>
                  <CardTitle>Actividad Reciente</CardTitle>
                  <CardDescription>Últimas acciones en el marketplace</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">App "Sales Analytics" aprobada</p>
                        <p className="text-xs text-muted-foreground">Hace 2 horas</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Clock className="h-5 w-5 text-amber-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Nueva solicitud de partner</p>
                        <p className="text-xs text-muted-foreground">Hace 5 horas</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Package className="h-5 w-5 text-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Nueva versión "Email Marketing" v2.1</p>
                        <p className="text-xs text-muted-foreground">Ayer</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Alertas */}
              <Card>
                <CardHeader>
                  <CardTitle>Alertas</CardTitle>
                  <CardDescription>Elementos que requieren atención</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats?.pendingApps || stats?.pendingPartners ? (
                    <div className="space-y-4">
                      {stats?.pendingApps > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{stats.pendingApps} apps pendientes de revisión</p>
                            <p className="text-xs text-muted-foreground">Revisar en la pestaña "Revisión de Apps"</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => setActiveTab('reviews')}>
                            Ver
                          </Button>
                        </div>
                      )}
                      {stats?.pendingPartners > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                          <Users className="h-5 w-5 text-blue-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{stats.pendingPartners} solicitudes de partner</p>
                            <p className="text-xs text-muted-foreground">Revisar en la pestaña "Partners"</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => setActiveTab('partners')}>
                            Ver
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3" />
                      <p className="text-muted-foreground">Todo al día, sin alertas pendientes</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <AppReviewPanel />
          </TabsContent>

          <TabsContent value="partners" className="mt-6">
            <PartnerManagementPanel />
          </TabsContent>

          <TabsContent value="revenue" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Ingresos</CardTitle>
                <CardDescription>Revenue share y transacciones del marketplace</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">
                  Dashboard de ingresos en desarrollo...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
