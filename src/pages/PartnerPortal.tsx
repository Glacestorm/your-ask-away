import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMyPartnerCompany, usePartnerApplications, usePartnerRevenue, useApplyForPartnership } from '@/hooks/usePartnerPortal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Package, 
  TrendingUp, 
  Users,
  Plus,
  Star,
  Download,
  DollarSign,
  Award,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PARTNER_TIERS } from '@/types/marketplace';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function PartnerOnboarding() {
  const applyMutation = useApplyForPartnership();
  const [formData, setFormData] = useState({
    company_name: '',
    legal_name: '',
    tax_id: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b">
        <div className="container mx-auto px-4 py-16 text-center">
          <Badge className="mb-4 bg-primary/20 text-primary">Partner Program</Badge>
          <h1 className="text-4xl font-bold mb-4">
            Únete al programa de partners de ObelixCRM
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Desarrolla integraciones, publica apps en nuestro marketplace y genera ingresos recurrentes
          </p>
        </div>
      </div>

      {/* Benefits */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center mb-8">Beneficios del programa</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {Object.entries(PARTNER_TIERS).map(([key, tier]) => (
            <Card key={key} className={`${key === 'platinum' ? 'border-amber-500/50 bg-gradient-to-br from-amber-500/5 to-amber-500/10' : ''}`}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Award className={`h-5 w-5 ${
                    key === 'bronze' ? 'text-amber-700' :
                    key === 'silver' ? 'text-gray-400' :
                    key === 'gold' ? 'text-yellow-500' :
                    'text-purple-500'
                  }`} />
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                </div>
                <CardDescription>
                  Revenue share: <strong>{tier.revenueShare}%</strong>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {tier.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
                {tier.minRevenue > 0 && (
                  <p className="text-xs text-muted-foreground mt-4">
                    Requisitos: €{tier.minRevenue.toLocaleString()}/año, {tier.minApps} apps
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Application Form */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Solicitar acceso al programa</CardTitle>
            <CardDescription>
              Completa el formulario y revisaremos tu solicitud en 24-48 horas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nombre de la empresa *</label>
                  <Input
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Mi Empresa SL"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Razón social</label>
                  <Input
                    value={formData.legal_name}
                    onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                    placeholder="Razón social completa"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Email de contacto *</label>
                  <Input
                    type="email"
                    required
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="partners@empresa.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Teléfono</label>
                  <Input
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="+34 600 000 000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">CIF/NIF</label>
                  <Input
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    placeholder="B12345678"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Website</label>
                  <Input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://empresa.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Descripción de la empresa</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Cuéntanos sobre tu empresa, qué tipo de integraciones queréis desarrollar..."
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full" disabled={applyMutation.isPending}>
                {applyMutation.isPending ? 'Enviando solicitud...' : 'Enviar solicitud'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PartnerDashboard({ company, role }: { company: any; role: string }) {
  const { data: apps } = usePartnerApplications(company.id);
  const { data: revenue } = usePartnerRevenue(company.id);

  const stats = {
    totalApps: apps?.length || 0,
    publishedApps: apps?.filter(a => a.status === 'published').length || 0,
    totalInstalls: apps?.reduce((acc, app) => acc + app.install_count, 0) || 0,
    totalRevenue: revenue?.reduce((acc, t) => acc + (t.partner_amount || 0), 0) || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                {company.logo_url ? (
                  <img src={company.logo_url} alt="" className="h-8 w-8 rounded" />
                ) : (
                  <Building2 className="h-6 w-6 text-primary" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold">{company.company_name}</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">{company.partner_tier} Partner</Badge>
                  <Badge variant={company.status === 'active' ? 'default' : 'secondary'}>
                    {company.status === 'active' ? 'Activo' : company.status}
                  </Badge>
                </div>
              </div>
            </div>
            <Link to="/developers">
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Developer Portal
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Package className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalApps}</p>
                  <p className="text-xs text-muted-foreground">Apps totales</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.publishedApps}</p>
                  <p className="text-xs text-muted-foreground">Publicadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Download className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalInstalls.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Instalaciones</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">€{stats.totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Ingresos totales</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="apps">
          <TabsList>
            <TabsTrigger value="apps">Mis Apps</TabsTrigger>
            <TabsTrigger value="revenue">Ingresos</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>

          <TabsContent value="apps" className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Mis Aplicaciones</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva App
              </Button>
            </div>

            {apps && apps.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {apps.map((app) => (
                  <Card key={app.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{app.app_name}</h4>
                            <Badge variant={
                              app.status === 'published' ? 'default' :
                              app.status === 'in_review' ? 'secondary' :
                              'outline'
                            }>
                              {app.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            v{app.version} • {app.install_count} instalaciones
                          </p>
                          {app.rating_count > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs">{app.rating_average.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="sm">Editar</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h4 className="font-semibold mb-2">No tienes apps aún</h4>
                  <p className="text-muted-foreground mb-4">
                    Crea tu primera app y publícala en el marketplace
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear primera app
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="revenue" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Historial de ingresos</CardTitle>
                <CardDescription>
                  Revenue share actual: {company.revenue_share_percent}%
                </CardDescription>
              </CardHeader>
              <CardContent>
                {revenue && revenue.length > 0 ? (
                  <div className="space-y-3">
                    {revenue.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{transaction.application?.app_name || 'App'}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(transaction.created_at), 'dd MMM yyyy', { locale: es })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            +€{transaction.partner_amount.toFixed(2)}
                          </p>
                          <Badge variant={transaction.status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Aún no hay transacciones
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de la cuenta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nombre de la empresa</label>
                  <Input value={company.company_name} disabled />
                </div>
                <div>
                  <label className="text-sm font-medium">Email de contacto</label>
                  <Input value={company.contact_email} disabled />
                </div>
                <div>
                  <label className="text-sm font-medium">Tier actual</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="capitalize">{company.partner_tier}</Badge>
                    <span className="text-sm text-muted-foreground">
                      Revenue share: {company.revenue_share_percent}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function PartnerPortal() {
  const { user } = useAuth();
  const { data: partnerData, isLoading } = useMyPartnerCompany();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Inicia sesión</h2>
            <p className="text-muted-foreground mb-4">
              Necesitas iniciar sesión para acceder al portal de partners
            </p>
            <Link to="/auth">
              <Button>Iniciar sesión</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (partnerData?.company) {
    return <PartnerDashboard company={partnerData.company} role={partnerData.role} />;
  }

  return <PartnerOnboarding />;
}
