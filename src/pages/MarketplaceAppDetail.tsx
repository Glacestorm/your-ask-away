import { useParams, Link } from 'react-router-dom';
import { useMarketplaceApp, useInstallApp, useMyInstallations } from '@/hooks/useMarketplace';
import { AppReviews } from '@/components/marketplace';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Star, 
  Download, 
  ExternalLink, 
  Shield, 
  CheckCircle2,
  Calendar,
  Globe,
  FileText,
  HelpCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { APP_CATEGORY_LABELS } from '@/types/marketplace';
import { useAuth } from '@/hooks/useAuth';

export default function MarketplaceAppDetail() {
  const { appKey } = useParams<{ appKey: string }>();
  const { user } = useAuth();
  const { data: app, isLoading } = useMarketplaceApp(appKey || '');
  const { data: installations } = useMyInstallations();
  const installApp = useInstallApp();

  const isInstalled = installations?.some(i => i.application_id === app?.id);

  const formatPrice = () => {
    if (!app) return '';
    if (app.price_type === 'free') return 'Gratis';
    const amount = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: app.price_currency,
    }).format(app.price_amount);
    if (app.price_type === 'subscription') {
      return `${amount}/${app.billing_period === 'yearly' ? 'año' : 'mes'}`;
    }
    return amount;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">App no encontrada</h1>
        <Link to="/marketplace">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Marketplace
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 py-6">
          <Link to="/marketplace" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver al Marketplace
          </Link>

          <div className="flex flex-col md:flex-row gap-6">
            {/* App Icon */}
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
              {app.icon_url ? (
                <img src={app.icon_url} alt={app.app_name} className="h-16 w-16 rounded-xl object-cover" />
              ) : (
                <span className="text-4xl font-bold text-primary">{app.app_name.charAt(0)}</span>
              )}
            </div>

            {/* App Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h1 className="text-2xl font-bold">{app.app_name}</h1>
                {app.is_certified && (
                  <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300">
                    <Shield className="h-3 w-3 mr-1" />
                    Certificado
                  </Badge>
                )}
                {app.is_premium && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                    Premium
                  </Badge>
                )}
              </div>

              <p className="text-muted-foreground mb-3">
                {app.partner_company?.company_name || 'Partner Oficial'}
              </p>

              <div className="flex items-center gap-4 flex-wrap text-sm">
                <Badge variant="outline">{APP_CATEGORY_LABELS[app.category]}</Badge>
                {app.rating_count > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {app.rating_average.toFixed(1)}
                    <span className="text-muted-foreground">({app.rating_count} reseñas)</span>
                  </span>
                )}
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Download className="h-4 w-4" />
                  {app.install_count.toLocaleString()} instalaciones
                </span>
              </div>
            </div>

            {/* Install Card */}
            <Card className="md:w-64 shrink-0">
              <CardContent className="p-4 space-y-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${app.price_type === 'free' ? 'text-green-600' : ''}`}>
                    {formatPrice()}
                  </div>
                  {app.trial_days > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {app.trial_days} días de prueba gratis
                    </p>
                  )}
                </div>

                {user ? (
                  isInstalled ? (
                    <Button variant="secondary" className="w-full" disabled>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Instalada
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={() => installApp.mutate(app.id)}
                      disabled={installApp.isPending}
                    >
                      {installApp.isPending ? 'Instalando...' : 'Instalar'}
                    </Button>
                  )
                ) : (
                  <Link to="/auth" className="block">
                    <Button className="w-full">Iniciar sesión para instalar</Button>
                  </Link>
                )}

                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Versión {app.version}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Actualizado {format(new Date(app.updated_at), 'dd MMM yyyy', { locale: es })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Descripción</TabsTrigger>
                <TabsTrigger value="reviews">Reseñas ({app.rating_count})</TabsTrigger>
                {app.api_scopes && app.api_scopes.length > 0 && (
                  <TabsTrigger value="permissions">Permisos</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6">
                {/* Screenshots */}
                {app.screenshots && app.screenshots.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">Capturas de pantalla</h3>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {(app.screenshots as string[]).map((url, idx) => (
                        <img 
                          key={idx} 
                          src={url} 
                          alt={`Screenshot ${idx + 1}`}
                          className="h-48 rounded-lg border object-cover"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Descripción</h3>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {app.description || app.short_description || 'Sin descripción disponible.'}
                  </div>
                </div>

                {/* Tags */}
                {app.tags && app.tags.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">Etiquetas</h3>
                    <div className="flex flex-wrap gap-2">
                      {app.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <AppReviews 
                  applicationId={app.id}
                  ratingAverage={app.rating_average}
                  ratingCount={app.rating_count}
                />
              </TabsContent>

              <TabsContent value="permissions" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Permisos requeridos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Esta app requiere los siguientes permisos para funcionar:
                    </p>
                    <ul className="space-y-2">
                      {app.api_scopes?.map((scope) => (
                        <li key={scope} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          {scope}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Developer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Desarrollador</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    {app.partner_company?.logo_url ? (
                      <img src={app.partner_company.logo_url} alt="" className="h-8 w-8 rounded" />
                    ) : (
                      <span className="font-bold text-primary">
                        {app.partner_company?.company_name?.charAt(0) || 'P'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{app.partner_company?.company_name || 'Partner Oficial'}</p>
                    {app.partner_company?.partner_tier && (
                      <Badge variant="outline" className="text-xs">
                        {app.partner_company.partner_tier} Partner
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Enlaces</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {app.documentation_url && (
                  <a 
                    href={app.documentation_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    Documentación
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {app.support_url && (
                  <a 
                    href={app.support_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <HelpCircle className="h-4 w-4" />
                    Soporte
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {app.privacy_policy_url && (
                  <a 
                    href={app.privacy_policy_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:underline"
                  >
                    <Shield className="h-4 w-4" />
                    Política de privacidad
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {app.terms_url && (
                  <a 
                    href={app.terms_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    Términos de uso
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
