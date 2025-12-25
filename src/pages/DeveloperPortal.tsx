import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import StoreNavbar from '@/components/store/StoreNavbar';
import UnifiedFooter from '@/components/layout/UnifiedFooter';
import {
  Code2,
  Book,
  Terminal,
  Webhook,
  Key,
  Shield,
  ArrowRight,
  Copy,
  CheckCircle2,
  ExternalLink,
  Zap,
  Lock,
  Globe
} from 'lucide-react';
import { PERMISSION_SCOPES } from '@/types/marketplace';
import { toast } from 'sonner';

const API_ENDPOINTS = [
  { method: 'GET', path: '/companies', description: 'Listar empresas' },
  { method: 'GET', path: '/companies/:id', description: 'Obtener empresa' },
  { method: 'POST', path: '/companies', description: 'Crear empresa' },
  { method: 'PUT', path: '/companies/:id', description: 'Actualizar empresa' },
  { method: 'GET', path: '/contacts', description: 'Listar contactos' },
  { method: 'GET', path: '/visits', description: 'Listar visitas' },
  { method: 'POST', path: '/visits', description: 'Crear visita' },
  { method: 'GET', path: '/opportunities', description: 'Listar oportunidades' },
  { method: 'GET', path: '/analytics/kpis', description: 'Obtener KPIs' },
];

const WEBHOOK_EVENTS = [
  { event: 'company.created', description: 'Nueva empresa creada' },
  { event: 'company.updated', description: 'Empresa actualizada' },
  { event: 'contact.created', description: 'Nuevo contacto creado' },
  { event: 'visit.created', description: 'Nueva visita registrada' },
  { event: 'visit.completed', description: 'Visita completada' },
  { event: 'opportunity.created', description: 'Nueva oportunidad' },
  { event: 'opportunity.won', description: 'Oportunidad ganada' },
  { event: 'opportunity.lost', description: 'Oportunidad perdida' },
  { event: 'installation.created', description: 'Tu app fue instalada' },
  { event: 'installation.removed', description: 'Tu app fue desinstalada' },
];

function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-zinc-950 rounded-lg p-4 font-mono text-sm">
      <button 
        onClick={copyToClipboard}
        className="absolute top-2 right-2 p-2 rounded hover:bg-white/10 transition-colors"
      >
        {copied ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4 text-zinc-400" />
        )}
      </button>
      <pre className="text-zinc-100 overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function DeveloperPortal() {
  return (
    <>
      <StoreNavbar />
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-20">
        {/* Hero */}
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white border-b">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
              Developer Portal
            </Badge>
            <h1 className="text-4xl font-bold mb-4">
              Construye sobre ObelixCRM
            </h1>
            <p className="text-lg text-zinc-400 mb-8">
              APIs REST, Webhooks y SDK para crear integraciones potentes. 
              Accede a datos de empresas, contactos, visitas y más.
            </p>
            <div className="flex gap-3">
              <Link to="/partners">
                <Button size="lg">
                  Obtener API Key
                  <Key className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800">
                Ver documentación
                <Book className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-2">
                <Zap className="h-5 w-5 text-blue-500" />
              </div>
              <CardTitle className="text-lg">Rápido de integrar</CardTitle>
              <CardDescription>
                API REST estándar con respuestas JSON. Tu primera llamada en minutos.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center mb-2">
                <Lock className="h-5 w-5 text-green-500" />
              </div>
              <CardTitle className="text-lg">Seguro por defecto</CardTitle>
              <CardDescription>
                Autenticación OAuth 2.0, permisos granulares y rate limiting configurable.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-2">
                <Globe className="h-5 w-5 text-purple-500" />
              </div>
              <CardTitle className="text-lg">Webhooks en tiempo real</CardTitle>
              <CardDescription>
                Recibe notificaciones instantáneas de eventos en el CRM.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="quickstart" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
            <TabsTrigger value="api">API Reference</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="permissions">Permisos</TabsTrigger>
          </TabsList>

          <TabsContent value="quickstart" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Obtén tu API Key</CardTitle>
                <CardDescription>
                  Regístrate como partner y genera tu primera API key desde el portal.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/partners">
                  <Button variant="outline">
                    Ir al Portal de Partners
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Haz tu primera llamada</CardTitle>
                <CardDescription>
                  Usa tu API key para autenticar las peticiones.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock 
                  code={`curl -X GET "https://api.obelixcrm.com/v1/companies" \\
  -H "Authorization: Bearer obx_live_your_api_key" \\
  -H "Content-Type: application/json"`}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Procesa la respuesta</CardTitle>
                <CardDescription>
                  Todas las respuestas son JSON con estructura consistente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock 
                  language="json"
                  code={`{
  "data": [
    {
      "id": "c1234567-89ab-cdef-0123-456789abcdef",
      "name": "Empresa Ejemplo SL",
      "email": "contacto@empresa.com",
      "phone": "+34 600 000 000",
      "status": "active",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "per_page": 20
  }
}`}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Base URL</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <code className="bg-muted px-3 py-2 rounded text-sm flex-1">
                    https://api.obelixcrm.com/v1
                  </code>
                  <Badge variant="outline">v1 (stable)</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Endpoints disponibles</CardTitle>
                <CardDescription>
                  Lista de endpoints principales de la API REST.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {API_ENDPOINTS.map((endpoint, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Badge 
                        variant="outline" 
                        className={`w-16 justify-center ${
                          endpoint.method === 'GET' ? 'text-green-600 border-green-600' :
                          endpoint.method === 'POST' ? 'text-blue-600 border-blue-600' :
                          'text-amber-600 border-amber-600'
                        }`}
                      >
                        {endpoint.method}
                      </Badge>
                      <code className="text-sm flex-1">{endpoint.path}</code>
                      <span className="text-sm text-muted-foreground">{endpoint.description}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rate Limiting</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-primary">60</p>
                    <p className="text-sm text-muted-foreground">requests/minuto (sandbox)</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-primary">1,000</p>
                    <p className="text-sm text-muted-foreground">requests/minuto (production)</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-primary">100K</p>
                    <p className="text-sm text-muted-foreground">requests/día (production)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Eventos disponibles</CardTitle>
                <CardDescription>
                  Configura webhooks para recibir notificaciones en tiempo real.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {WEBHOOK_EVENTS.map((event, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-lg border"
                    >
                      <Webhook className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <code className="text-sm font-medium">{event.event}</code>
                        <p className="text-xs text-muted-foreground">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ejemplo de payload</CardTitle>
              </CardHeader>
              <CardContent>
                <CodeBlock 
                  language="json"
                  code={`{
  "event": "company.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "c1234567-89ab-cdef-0123-456789abcdef",
    "name": "Nueva Empresa SL",
    "created_by": "user_123"
  },
  "signature": "sha256=abc123..."
}`}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Scopes de permisos</CardTitle>
                <CardDescription>
                  Define qué datos puede acceder tu integración. Los usuarios deben aprobar estos permisos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-500" />
                      Permisos de lectura
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(PERMISSION_SCOPES)
                        .filter(([key]) => key.startsWith('read:'))
                        .map(([key, description]) => (
                          <div key={key} className="flex items-center gap-2 p-2 rounded border">
                            <code className="text-xs bg-muted px-2 py-1 rounded">{key}</code>
                            <span className="text-sm text-muted-foreground">{description}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-amber-500" />
                      Permisos de escritura
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(PERMISSION_SCOPES)
                        .filter(([key]) => key.startsWith('write:'))
                        .map(([key, description]) => (
                          <div key={key} className="flex items-center gap-2 p-2 rounded border">
                            <code className="text-xs bg-muted px-2 py-1 rounded">{key}</code>
                            <span className="text-sm text-muted-foreground">{description}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-red-500" />
                      Permisos de administración
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(PERMISSION_SCOPES)
                        .filter(([key]) => key.startsWith('admin:') || key.startsWith('ai:'))
                        .map(([key, description]) => (
                          <div key={key} className="flex items-center gap-2 p-2 rounded border">
                            <code className="text-xs bg-muted px-2 py-1 rounded">{key}</code>
                            <span className="text-sm text-muted-foreground">{description}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <Card className="mt-12 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">¿Listo para empezar?</h3>
              <p className="text-muted-foreground">
                Únete al programa de partners y empieza a construir hoy mismo
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/partners">
                <Button size="lg">
                  Ser Partner
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link to="/marketplace">
                <Button size="lg" variant="outline">
                  Ver Marketplace
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      <UnifiedFooter />
    </div>
    </>
  );
}
