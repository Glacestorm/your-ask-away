/**
 * LicensesDashboard - Panel principal de gestión de licencias
 * Fase 3 del Sistema de Licencias Enterprise
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Key, 
  Shield, 
  Laptop, 
  BarChart3, 
  AlertTriangle,
  Users,
  TrendingUp,
  Clock
} from 'lucide-react';
import { LicenseGenerator } from './LicenseGenerator';
import { LicensesList } from './LicensesList';
import { DeviceActivationsList } from './DeviceActivationsList';
import { LicenseUsageAnalytics } from './LicenseUsageAnalytics';
import { LicenseAnomalyAlerts } from './LicenseAnomalyAlerts';
import { useLicenseManager } from '@/hooks/admin/enterprise/useLicenseManager';

export function LicensesDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [licenses, setLicenses] = useState<any[]>([]);
  const { 
    plans, 
    isLoading,
    fetchPlans
  } = useLicenseManager();

  const fetchLicenses = async () => {
    const { data } = await import('@/integrations/supabase/client').then(m => 
      m.supabase.from('licenses').select('*').order('created_at', { ascending: false })
    );
    setLicenses(data || []);
  };

  useState(() => { fetchLicenses(); });

  // Calculate stats
  const activeLicenses = licenses.filter(l => l.status === 'active').length;
  const expiringSoon = licenses.filter(l => {
    if (!l.expires_at || l.status !== 'active') return false;
    const daysUntilExpiry = (new Date(l.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  }).length;
  const totalRevenue = licenses.reduce((sum, l) => {
    const plan = plans.find(p => p.id === l.plan_id);
    return sum + (plan?.price_yearly || 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Key className="h-6 w-6 text-primary" />
            Gestión de Licencias
          </h2>
          <p className="text-muted-foreground">
            Administra licencias, dispositivos y entitlements de tu plataforma SaaS
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Enterprise License Manager v1.0
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Licencias Activas</p>
                <p className="text-3xl font-bold text-foreground">{activeLicenses}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/20">
                <Shield className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expiran en 30 días</p>
                <p className="text-3xl font-bold text-foreground">{expiringSoon}</p>
              </div>
              <div className="p-3 rounded-full bg-amber-500/20">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ingresos Anuales</p>
                <p className="text-3xl font-bold text-foreground">
                  €{totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-full bg-emerald-500/20">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Planes Disponibles</p>
                <p className="text-3xl font-bold text-foreground">{plans.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/20">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">Licencias</span>
          </TabsTrigger>
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Generar</span>
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Laptop className="h-4 w-4" />
            <span className="hidden sm:inline">Dispositivos</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Alertas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <LicensesList 
            licenses={licenses} 
            plans={plans}
            isLoading={isLoading}
            onRefresh={fetchLicenses}
          />
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <LicenseGenerator 
            plans={plans}
            onGenerated={() => {
              fetchLicenses();
            }}
          />
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <DeviceActivationsList />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <LicenseUsageAnalytics licenses={licenses} />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <LicenseAnomalyAlerts />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default LicensesDashboard;
