import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Copy, Download, ExternalLink, Lock, Unlock, Zap, Database, Users, Building2, Calendar, Target, Bell, Shield } from "lucide-react";
import { toast } from "sonner";

interface APIEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  description: string;
  auth: "jwt" | "public" | "api_key";
  category: string;
  requestBody?: object;
  responseExample?: object;
  parameters?: { name: string; type: string; required: boolean; description: string }[];
}

const API_ENDPOINTS: APIEndpoint[] = [
  // Companies
  {
    method: "GET",
    path: "/rest/v1/companies",
    description: "Obtener lista de empresas con filtros y paginación",
    auth: "jwt",
    category: "Companies",
    parameters: [
      { name: "select", type: "string", required: false, description: "Campos a retornar (ej: id,name,address)" },
      { name: "gestor_id", type: "uuid", required: false, description: "Filtrar por gestor asignado" },
      { name: "status_id", type: "uuid", required: false, description: "Filtrar por estado" },
      { name: "limit", type: "integer", required: false, description: "Límite de resultados (default: 100)" },
      { name: "offset", type: "integer", required: false, description: "Offset para paginación" }
    ],
    responseExample: {
      data: [
        { id: "uuid", name: "Empresa S.L.", address: "Av. Principal 123", latitude: 42.5063, longitude: 1.5218 }
      ]
    }
  },
  {
    method: "POST",
    path: "/rest/v1/companies",
    description: "Crear nueva empresa",
    auth: "jwt",
    category: "Companies",
    requestBody: {
      name: "string (required)",
      address: "string (required)",
      latitude: "number (required)",
      longitude: "number (required)",
      parroquia: "string (required)",
      gestor_id: "uuid (optional)",
      email: "string (optional)",
      phone: "string (optional)"
    }
  },
  {
    method: "PATCH",
    path: "/rest/v1/companies?id=eq.{id}",
    description: "Actualizar empresa existente",
    auth: "jwt",
    category: "Companies",
    requestBody: { name: "string", address: "string", "...": "otros campos" }
  },
  // Visits
  {
    method: "GET",
    path: "/rest/v1/visits",
    description: "Obtener visitas programadas",
    auth: "jwt",
    category: "Visits",
    parameters: [
      { name: "gestor_id", type: "uuid", required: false, description: "Filtrar por gestor" },
      { name: "company_id", type: "uuid", required: false, description: "Filtrar por empresa" },
      { name: "visit_date", type: "date", required: false, description: "Filtrar por fecha (gte, lte)" }
    ]
  },
  {
    method: "POST",
    path: "/rest/v1/visits",
    description: "Programar nueva visita",
    auth: "jwt",
    category: "Visits",
    requestBody: {
      company_id: "uuid (required)",
      gestor_id: "uuid (required)",
      visit_date: "timestamp (required)",
      result_type: "string (optional): 'exitosa'|'pendiente'|'fallida'|'reprogramada'",
      products: "string[] (optional)",
      notes: "string (optional)"
    }
  },
  // Visit Sheets
  {
    method: "GET",
    path: "/rest/v1/visit_sheets",
    description: "Obtener fichas de visita completas",
    auth: "jwt",
    category: "Visit Sheets",
    parameters: [
      { name: "company_id", type: "uuid", required: false, description: "Filtrar por empresa" },
      { name: "validation_status", type: "string", required: false, description: "'pending'|'validated'|'rejected'" }
    ]
  },
  // Goals
  {
    method: "GET",
    path: "/rest/v1/goals",
    description: "Obtener objetivos y metas",
    auth: "jwt",
    category: "Goals",
    parameters: [
      { name: "gestor_id", type: "uuid", required: false, description: "Filtrar por gestor" },
      { name: "goal_type", type: "string", required: false, description: "'visits'|'revenue'|'clients'|..." },
      { name: "period_start", type: "date", required: false, description: "Inicio del período" }
    ]
  },
  // Profiles/Users
  {
    method: "GET",
    path: "/rest/v1/profiles",
    description: "Obtener perfiles de usuarios (RLS aplicado)",
    auth: "jwt",
    category: "Users",
    parameters: [
      { name: "role", type: "string", required: false, description: "Filtrar por rol" },
      { name: "office", type: "string", required: false, description: "Filtrar por oficina" }
    ]
  },
  // Products
  {
    method: "GET",
    path: "/rest/v1/products",
    description: "Catálogo de productos bancarios",
    auth: "jwt",
    category: "Products"
  },
  // Notifications
  {
    method: "GET",
    path: "/rest/v1/notifications",
    description: "Notificaciones del usuario actual",
    auth: "jwt",
    category: "Notifications",
    parameters: [
      { name: "read", type: "boolean", required: false, description: "Filtrar por leídas/no leídas" }
    ]
  },
  // Edge Functions
  {
    method: "POST",
    path: "/functions/v1/geocode-address",
    description: "Geocodificar dirección a coordenadas GPS",
    auth: "jwt",
    category: "Edge Functions",
    requestBody: { address: "string (required)" },
    responseExample: { latitude: 42.5063, longitude: 1.5218, display_name: "Andorra la Vella" }
  },
  {
    method: "POST",
    path: "/functions/v1/summarize-visit",
    description: "Generar resumen IA de notas de visita",
    auth: "jwt",
    category: "Edge Functions",
    requestBody: { meetingNotes: "string (required)", language: "string (optional, default: es)" },
    responseExample: { summary: "...", nextSteps: ["..."], risks: ["..."] }
  },
  {
    method: "POST",
    path: "/functions/v1/calculate-rfm-analysis",
    description: "Calcular análisis RFM de clientes",
    auth: "jwt",
    category: "Edge Functions"
  },
  {
    method: "POST",
    path: "/functions/v1/segment-customers-ml",
    description: "Segmentación ML con predicción churn y CLV",
    auth: "jwt",
    category: "Edge Functions",
    requestBody: { includeChurnPrediction: "boolean", includeCLV: "boolean" }
  }
];

const CATEGORIES = [
  { id: "Companies", icon: Building2, color: "bg-blue-500" },
  { id: "Visits", icon: Calendar, color: "bg-green-500" },
  { id: "Visit Sheets", icon: Database, color: "bg-purple-500" },
  { id: "Goals", icon: Target, color: "bg-orange-500" },
  { id: "Users", icon: Users, color: "bg-pink-500" },
  { id: "Products", icon: Database, color: "bg-cyan-500" },
  { id: "Notifications", icon: Bell, color: "bg-yellow-500" },
  { id: "Edge Functions", icon: Zap, color: "bg-red-500" }
];

export default function APIDocumentation() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET": return "bg-green-500";
      case "POST": return "bg-blue-500";
      case "PUT": return "bg-yellow-500";
      case "PATCH": return "bg-orange-500";
      case "DELETE": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const filteredEndpoints = selectedCategory 
    ? API_ENDPOINTS.filter(e => e.category === selectedCategory)
    : API_ENDPOINTS;

  const downloadOpenAPISpec = () => {
    const spec = {
      openapi: "3.0.3",
      info: {
        title: "ObelixIA CRM Bancario API",
        version: "1.0.0",
        description: "API REST para integración con ObelixIA CRM Bancario. Autenticación via JWT Bearer token de Supabase.",
        contact: { email: "api@obelixia.com" }
      },
      servers: [
        { url: "https://avaugfnqvvqcilhiudlf.supabase.co", description: "Producción" }
      ],
      paths: API_ENDPOINTS.reduce((acc, ep) => {
        const path = ep.path.replace(/\{.*?\}/g, match => `{${match.slice(1, -1)}}`);
        if (!acc[path]) acc[path] = {};
        acc[path][ep.method.toLowerCase()] = {
          summary: ep.description,
          tags: [ep.category],
          security: ep.auth === "public" ? [] : [{ bearerAuth: [] }],
          parameters: ep.parameters?.map(p => ({
            name: p.name,
            in: "query",
            required: p.required,
            description: p.description,
            schema: { type: p.type }
          })),
          requestBody: ep.requestBody ? {
            content: { "application/json": { schema: { type: "object", example: ep.requestBody } } }
          } : undefined,
          responses: {
            "200": {
              description: "Respuesta exitosa",
              content: ep.responseExample ? {
                "application/json": { example: ep.responseExample }
              } : undefined
            }
          }
        };
        return acc;
      }, {} as Record<string, any>),
      components: {
        securitySchemes: {
          bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
        }
      }
    };

    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "obelixia-api-openapi-3.0.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("OpenAPI spec descargada");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Documentación API REST</h2>
          <p className="text-slate-400">API pública para integraciones de terceros</p>
        </div>
        <Button onClick={downloadOpenAPISpec} className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white">
          <Download className="h-4 w-4 mr-2" />
          Descargar OpenAPI 3.0
        </Button>
      </div>

      <Tabs defaultValue="endpoints" className="space-y-4">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="endpoints" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">Endpoints</TabsTrigger>
          <TabsTrigger value="authentication" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">Autenticación</TabsTrigger>
          <TabsTrigger value="quickstart" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">Quick Start</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints" className="space-y-4">
          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant={selectedCategory === null ? "default" : "outline"}
              className={`cursor-pointer ${selectedCategory === null ? 'bg-blue-600 text-white' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}`}
              onClick={() => setSelectedCategory(null)}
            >
              Todos ({API_ENDPOINTS.length})
            </Badge>
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const count = API_ENDPOINTS.filter(e => e.category === cat.id).length;
              return (
                <Badge 
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  className={`cursor-pointer ${selectedCategory === cat.id ? 'bg-blue-600 text-white' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {cat.id} ({count})
                </Badge>
              );
            })}
          </div>

          <ScrollArea className="h-[600px]">
            <Accordion type="multiple" className="space-y-2">
              {filteredEndpoints.map((endpoint, idx) => (
                <AccordionItem key={idx} value={`endpoint-${idx}`} className="border border-slate-700 rounded-lg px-4 bg-slate-800/30">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Badge className={`${getMethodColor(endpoint.method)} text-white`}>
                        {endpoint.method}
                      </Badge>
                      <code className="text-sm font-mono text-emerald-400">{endpoint.path}</code>
                      {endpoint.auth === "jwt" ? (
                        <Lock className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Unlock className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <p className="text-slate-300">{endpoint.description}</p>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-slate-600 text-slate-300">{endpoint.category}</Badge>
                      <Badge variant={endpoint.auth === "jwt" ? "destructive" : "secondary"} className={endpoint.auth === "jwt" ? "bg-red-600/20 text-red-400" : "bg-green-600/20 text-green-400"}>
                        {endpoint.auth === "jwt" ? "🔐 JWT Required" : "🔓 Public"}
                      </Badge>
                    </div>

                    {endpoint.parameters && endpoint.parameters.length > 0 && (
                      <div className="space-y-2">
                        <p className="font-semibold text-sm text-white">Parámetros:</p>
                        <div className="bg-slate-900/50 rounded p-3 space-y-1 border border-slate-700">
                          {endpoint.parameters.map((param, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm flex-wrap">
                              <code className="text-blue-400">{param.name}</code>
                              <span className="text-slate-500">({param.type})</span>
                              {param.required && <Badge variant="destructive" className="text-xs bg-red-600/20 text-red-400">required</Badge>}
                              <span className="text-slate-400">- {param.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {endpoint.requestBody && (
                      <div className="space-y-2">
                        <p className="font-semibold text-sm text-white">Request Body:</p>
                        <div className="bg-slate-900/50 rounded p-3 relative border border-slate-700">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="absolute top-2 right-2 h-6 w-6 text-slate-400 hover:text-white"
                            onClick={() => copyToClipboard(JSON.stringify(endpoint.requestBody, null, 2))}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <pre className="text-xs overflow-x-auto text-emerald-400">
                            {JSON.stringify(endpoint.requestBody, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {endpoint.responseExample && (
                      <div className="space-y-2">
                        <p className="font-semibold text-sm text-white">Response Example:</p>
                        <div className="bg-slate-900/50 rounded p-3 relative border border-slate-700">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="absolute top-2 right-2 h-6 w-6 text-slate-400 hover:text-white"
                            onClick={() => copyToClipboard(JSON.stringify(endpoint.responseExample, null, 2))}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <pre className="text-xs overflow-x-auto text-blue-400">
                            {JSON.stringify(endpoint.responseExample, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="authentication" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5 text-blue-400" />
                Autenticación JWT Bearer
              </CardTitle>
              <CardDescription className="text-slate-400">
                Todas las peticiones autenticadas requieren un token JWT válido de Supabase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="font-semibold text-white">1. Obtener token de sesión:</p>
                <div className="bg-slate-900/50 rounded p-3 relative border border-slate-700">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="absolute top-2 right-2 h-6 w-6 text-slate-400 hover:text-white"
                    onClick={() => copyToClipboard(`const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;`)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <pre className="text-sm font-mono text-emerald-400">{`const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;`}</pre>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-white">2. Incluir en headers:</p>
                <div className="bg-slate-900/50 rounded p-3 relative border border-slate-700">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="absolute top-2 right-2 h-6 w-6 text-slate-400 hover:text-white"
                    onClick={() => copyToClipboard(`Authorization: Bearer {token}
apikey: {SUPABASE_ANON_KEY}`)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <pre className="text-sm font-mono text-blue-400">{`Authorization: Bearer {token}
apikey: {SUPABASE_ANON_KEY}`}</pre>
                </div>
              </div>

              <div className="p-4 bg-yellow-900/30 rounded-lg border border-yellow-700">
                <p className="text-sm font-semibold text-yellow-300">⚠️ Importante:</p>
                <ul className="text-sm text-yellow-200 list-disc list-inside mt-2">
                  <li>Los tokens expiran después de 1 hora</li>
                  <li>RLS (Row Level Security) aplica según el rol del usuario</li>
                  <li>Rate limiting: 100 requests/minuto por IP</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quickstart" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Quick Start - JavaScript/TypeScript</CardTitle>
              <CardDescription className="text-slate-400">Ejemplo de integración básica con Supabase SDK</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-900/50 rounded p-4 relative border border-slate-700">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="absolute top-2 right-2 h-6 w-6 text-slate-400 hover:text-white"
                  onClick={() => copyToClipboard(`import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://avaugfnqvvqcilhiudlf.supabase.co',
  'YOUR_ANON_KEY'
);

// Login
const { data: { user } } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Fetch companies
const { data: companies } = await supabase
  .from('companies')
  .select('id, name, address, latitude, longitude')
  .limit(10);

// Create visit
const { data: visit } = await supabase
  .from('visits')
  .insert({
    company_id: 'uuid',
    gestor_id: user.id,
    visit_date: new Date().toISOString(),
    result_type: 'exitosa'
  })
  .select()
  .single();

// Call Edge Function
const { data: summary } = await supabase.functions.invoke('summarize-visit', {
  body: { meetingNotes: 'Notas de la reunión...' }
});`)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <pre className="text-xs font-mono overflow-x-auto text-emerald-400">{`import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://avaugfnqvvqcilhiudlf.supabase.co',
  'YOUR_ANON_KEY'
);

// Login
const { data: { user } } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Fetch companies
const { data: companies } = await supabase
  .from('companies')
  .select('id, name, address, latitude, longitude')
  .limit(10);

// Create visit
const { data: visit } = await supabase
  .from('visits')
  .insert({
    company_id: 'uuid',
    gestor_id: user.id,
    visit_date: new Date().toISOString(),
    result_type: 'exitosa'
  })
  .select()
  .single();

// Call Edge Function
const { data: summary } = await supabase.functions.invoke('summarize-visit', {
  body: { meetingNotes: 'Notas de la reunión...' }
});`}</pre>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Quick Start - cURL</CardTitle>
              <CardDescription className="text-slate-400">Ejemplo con cURL para testing rápido</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-900/50 rounded p-4 relative border border-slate-700">
                <pre className="text-xs font-mono overflow-x-auto text-blue-400">{`# Get companies
curl -X GET \\
  'https://avaugfnqvvqcilhiudlf.supabase.co/rest/v1/companies?limit=10' \\
  -H 'apikey: YOUR_ANON_KEY' \\
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'

# Call Edge Function
curl -X POST \\
  'https://avaugfnqvvqcilhiudlf.supabase.co/functions/v1/summarize-visit' \\
  -H 'apikey: YOUR_ANON_KEY' \\
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{"meetingNotes": "Notas..."}'`}</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
