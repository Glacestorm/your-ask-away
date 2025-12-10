import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Brain, Settings, Shield, Key, Globe, Server, 
  CheckCircle2, XCircle, AlertTriangle, Info, 
  Loader2, TestTube, Save, RotateCcw, BookOpen,
  Lock, Zap, Database, FileText, HelpCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIConfig {
  enabled: boolean;
  provider: 'internal' | 'lovable' | 'custom';
  endpoint: string;
  apiKeyName: string;
  modelName: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
  contextWindow: number;
  rateLimit: number;
  timeoutSeconds: number;
  retryAttempts: number;
  enableAuditLog: boolean;
  enableContentFilter: boolean;
  allowedContextTypes: string[];
  fallbackEnabled: boolean;
  fallbackProvider: string;
}

const DEFAULT_CONFIG: AIConfig = {
  enabled: false,
  provider: 'internal',
  endpoint: '',
  apiKeyName: 'BANK_AI_API_KEY',
  modelName: '',
  maxTokens: 4096,
  temperature: 0.7,
  systemPrompt: `Eres un asistente interno del banco especializado en:
- Consultas sobre clientes y sus productos
- Normativas bancarias y de cumplimiento
- Procedimientos internos y políticas
- Productos y servicios bancarios

Reglas importantes:
1. Solo proporciona información basada en documentación oficial
2. No tomes decisiones autónomas sobre operaciones bancarias
3. Deriva consultas sensibles al personal autorizado
4. Mantén la confidencialidad de datos de clientes
5. Cumple con RGPD, APDA y normativas bancarias aplicables`,
  contextWindow: 32000,
  rateLimit: 100,
  timeoutSeconds: 30,
  retryAttempts: 3,
  enableAuditLog: true,
  enableContentFilter: true,
  allowedContextTypes: ['clients', 'regulations', 'products', 'procedures', 'internal_forms', 'client_forms'],
  fallbackEnabled: true,
  fallbackProvider: 'lovable',
};

const CONTEXT_TYPES = [
  { value: 'clients', label: 'Clientes', description: 'Información de cartera de clientes' },
  { value: 'regulations', label: 'Normativas', description: 'Regulaciones bancarias y compliance' },
  { value: 'products', label: 'Productos', description: 'Catálogo de productos bancarios' },
  { value: 'procedures', label: 'Procedimientos', description: 'Manuales y procedimientos internos' },
  { value: 'internal_forms', label: 'Formularios Internos', description: 'Formularios para uso interno' },
  { value: 'client_forms', label: 'Formularios Cliente', description: 'Formularios para clientes' },
];

export function AIIntegrationConfig() {
  const [config, setConfig] = useState<AIConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('concepts')
        .select('*')
        .eq('concept_type', 'ai_config')
        .eq('concept_key', 'internal_ai_settings')
        .single();

      if (data && !error) {
        const savedConfig = JSON.parse(data.concept_value);
        setConfig({ ...DEFAULT_CONFIG, ...savedConfig });
      }
    } catch (e) {
      console.log('No saved AI config found, using defaults');
    }
  };

  const saveConfig = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('concepts')
        .upsert({
          concept_type: 'ai_config',
          concept_key: 'internal_ai_settings',
          concept_value: JSON.stringify(config),
          description: 'Configuración de integración IA interna del banco',
          active: true,
        }, {
          onConflict: 'concept_type,concept_key'
        });

      if (error) throw error;
      
      toast.success('Configuración guardada correctamente');
      setHasChanges(false);
    } catch (e) {
      console.error('Error saving config:', e);
      toast.error('Error al guardar la configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!config.endpoint) {
        setTestResult({ success: false, message: 'Endpoint no configurado' });
        return;
      }

      // In real implementation, this would call the actual endpoint
      setTestResult({ 
        success: true, 
        message: 'Conexión simulada exitosa. Configure el endpoint real para prueba completa.' 
      });
    } catch (e) {
      setTestResult({ success: false, message: 'Error de conexión' });
    } finally {
      setIsTesting(false);
    }
  };

  const updateConfig = (updates: Partial<AIConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Integración IA Interna del Banco
          </h2>
          <p className="text-muted-foreground mt-1">
            Configure la conexión con el modelo de IA interno de la entidad bancaria
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-300">
              Cambios sin guardar
            </Badge>
          )}
          <Button variant="outline" onClick={resetConfig} disabled={isLoading}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar
          </Button>
          <Button onClick={saveConfig} disabled={isLoading || !hasChanges}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Guardar
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      <Alert className={config.enabled ? "border-green-500 bg-green-50 dark:bg-green-950/30" : "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30"}>
        {config.enabled ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
        )}
        <AlertTitle className={config.enabled ? "text-green-700 dark:text-green-400" : "text-yellow-700 dark:text-yellow-400"}>
          {config.enabled ? 'IA Interna Habilitada' : 'IA Interna Deshabilitada'}
        </AlertTitle>
        <AlertDescription className={config.enabled ? "text-green-600 dark:text-green-500" : "text-yellow-600 dark:text-yellow-500"}>
          {config.enabled 
            ? 'El asistente utilizará el modelo de IA interno configurado.'
            : 'El asistente utilizará Lovable AI como proveedor predeterminado.'}
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="connection" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="connection">
            <Server className="h-4 w-4 mr-2" />
            Conexión
          </TabsTrigger>
          <TabsTrigger value="model">
            <Brain className="h-4 w-4 mr-2" />
            Modelo
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="context">
            <Database className="h-4 w-4 mr-2" />
            Contexto
          </TabsTrigger>
          <TabsTrigger value="help">
            <BookOpen className="h-4 w-4 mr-2" />
            Documentación
          </TabsTrigger>
        </TabsList>

        {/* Connection Tab */}
        <TabsContent value="connection">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Configuración de Conexión
              </CardTitle>
              <CardDescription>
                Configure los parámetros de conexión con el servidor de IA interno
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Habilitar IA Interna</Label>
                  <p className="text-sm text-muted-foreground">
                    Activa el uso del modelo de IA interno del banco
                  </p>
                </div>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(checked) => updateConfig({ enabled: checked })}
                />
              </div>

              {/* Endpoint */}
              <div className="space-y-2">
                <Label htmlFor="endpoint">Endpoint de la API</Label>
                <Input
                  id="endpoint"
                  placeholder="https://ai.banco-interno.local/v1/chat/completions"
                  value={config.endpoint}
                  onChange={(e) => updateConfig({ endpoint: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  URL del servidor de IA interno. Debe ser compatible con el formato OpenAI Chat Completions API.
                </p>
              </div>

              {/* API Key Name */}
              <div className="space-y-2">
                <Label htmlFor="apiKeyName">Nombre del Secreto (API Key)</Label>
                <div className="flex gap-2">
                  <Input
                    id="apiKeyName"
                    placeholder="BANK_AI_API_KEY"
                    value={config.apiKeyName}
                    onChange={(e) => updateConfig({ apiKeyName: e.target.value })}
                  />
                  <Button variant="outline" size="icon" title="La clave debe configurarse en Supabase Secrets">
                    <Key className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Nombre del secreto en Supabase que contiene la API key. Configure el valor en Cloud → Secrets.
                </p>
              </div>

              {/* Timeouts and Retries */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout (segundos)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    min={5}
                    max={120}
                    value={config.timeoutSeconds}
                    onChange={(e) => updateConfig({ timeoutSeconds: parseInt(e.target.value) || 30 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retries">Reintentos</Label>
                  <Input
                    id="retries"
                    type="number"
                    min={0}
                    max={5}
                    value={config.retryAttempts}
                    onChange={(e) => updateConfig({ retryAttempts: parseInt(e.target.value) || 3 })}
                  />
                </div>
              </div>

              {/* Fallback */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Fallback a Lovable AI</Label>
                  <p className="text-sm text-muted-foreground">
                    Si la IA interna falla, usar Lovable AI como respaldo
                  </p>
                </div>
                <Switch
                  checked={config.fallbackEnabled}
                  onCheckedChange={(checked) => updateConfig({ fallbackEnabled: checked })}
                />
              </div>

              {/* Test Connection */}
              <div className="pt-4 border-t">
                <Button 
                  onClick={testConnection} 
                  disabled={isTesting || !config.endpoint}
                  className="w-full"
                >
                  {isTesting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  Probar Conexión
                </Button>
                {testResult && (
                  <Alert className={`mt-4 ${testResult.success ? 'border-green-500' : 'border-red-500'}`}>
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription>
                      {testResult.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Model Tab */}
        <TabsContent value="model">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Configuración del Modelo
              </CardTitle>
              <CardDescription>
                Parámetros del modelo de IA y comportamiento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Model Name */}
              <div className="space-y-2">
                <Label htmlFor="modelName">Nombre del Modelo</Label>
                <Input
                  id="modelName"
                  placeholder="bank-gpt-4-internal / llama-3-70b-banking"
                  value={config.modelName}
                  onChange={(e) => updateConfig({ modelName: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Identificador del modelo en el servidor interno (ej: gpt-4, llama-3-70b, mistral-large)
                </p>
              </div>

              {/* Max Tokens */}
              <div className="space-y-2">
                <Label htmlFor="maxTokens">Tokens Máximos de Respuesta</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  min={256}
                  max={32000}
                  value={config.maxTokens}
                  onChange={(e) => updateConfig({ maxTokens: parseInt(e.target.value) || 4096 })}
                />
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperatura (Creatividad)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="temperature"
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={config.temperature}
                    onChange={(e) => updateConfig({ temperature: parseFloat(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="w-12 text-center font-mono">{config.temperature}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  0 = Respuestas más determinísticas | 1 = Respuestas más creativas
                </p>
              </div>

              {/* Context Window */}
              <div className="space-y-2">
                <Label htmlFor="contextWindow">Ventana de Contexto (tokens)</Label>
                <Input
                  id="contextWindow"
                  type="number"
                  min={4000}
                  max={128000}
                  value={config.contextWindow}
                  onChange={(e) => updateConfig({ contextWindow: parseInt(e.target.value) || 32000 })}
                />
                <p className="text-xs text-muted-foreground">
                  Cantidad máxima de tokens que el modelo puede procesar en una conversación
                </p>
              </div>

              {/* System Prompt */}
              <div className="space-y-2">
                <Label htmlFor="systemPrompt">Prompt del Sistema</Label>
                <Textarea
                  id="systemPrompt"
                  rows={10}
                  value={config.systemPrompt}
                  onChange={(e) => updateConfig({ systemPrompt: e.target.value })}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Instrucciones base que definen el comportamiento y personalidad del asistente
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Seguridad y Cumplimiento
              </CardTitle>
              <CardDescription>
                Configuraciones de seguridad, auditoría y cumplimiento normativo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Rate Limit */}
              <div className="space-y-2">
                <Label htmlFor="rateLimit">Límite de Peticiones por Minuto</Label>
                <Input
                  id="rateLimit"
                  type="number"
                  min={10}
                  max={1000}
                  value={config.rateLimit}
                  onChange={(e) => updateConfig({ rateLimit: parseInt(e.target.value) || 100 })}
                />
                <p className="text-xs text-muted-foreground">
                  Número máximo de peticiones por minuto por usuario
                </p>
              </div>

              {/* Audit Log */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Registro de Auditoría
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Registrar todas las conversaciones para auditoría y cumplimiento
                  </p>
                </div>
                <Switch
                  checked={config.enableAuditLog}
                  onCheckedChange={(checked) => updateConfig({ enableAuditLog: checked })}
                />
              </div>

              {/* Content Filter */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Filtro de Contenido
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Detectar y marcar contenido sensible o inapropiado
                  </p>
                </div>
                <Switch
                  checked={config.enableContentFilter}
                  onCheckedChange={(checked) => updateConfig({ enableContentFilter: checked })}
                />
              </div>

              {/* Security Notes */}
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Notas de Seguridad</AlertTitle>
                <AlertDescription className="text-sm space-y-2">
                  <ul className="list-disc pl-4 space-y-1">
                    <li>La API key debe almacenarse como secreto en Supabase, nunca en código</li>
                    <li>Todas las comunicaciones deben usar HTTPS/TLS 1.3</li>
                    <li>Los logs de auditoría se mantienen por el período legalmente requerido</li>
                    <li>El acceso a la configuración está restringido a administradores</li>
                    <li>Se recomienda implementar autenticación mutua (mTLS) para conexiones internas</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Context Tab */}
        <TabsContent value="context">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Tipos de Contexto Permitidos
              </CardTitle>
              <CardDescription>
                Define qué tipos de información puede consultar el asistente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {CONTEXT_TYPES.map((type) => (
                <div 
                  key={type.value}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">{type.label}</Label>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                  <Switch
                    checked={config.allowedContextTypes.includes(type.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateConfig({ 
                          allowedContextTypes: [...config.allowedContextTypes, type.value] 
                        });
                      } else {
                        updateConfig({ 
                          allowedContextTypes: config.allowedContextTypes.filter(t => t !== type.value) 
                        });
                      }
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Help Tab */}
        <TabsContent value="help">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Guía de Implementación
              </CardTitle>
              <CardDescription>
                Documentación técnica para la integración de IA interna
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="requirements">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Requisitos Previos
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm space-y-3">
                    <p>Para integrar la IA interna del banco, necesita:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Servidor de IA:</strong> Un servidor que exponga una API compatible con OpenAI Chat Completions</li>
                      <li><strong>Modelo LLM:</strong> GPT-4, LLaMA 3, Mistral, u otro modelo entrenado/fine-tuned para banca</li>
                      <li><strong>API Key:</strong> Credenciales de acceso al servicio de IA</li>
                      <li><strong>Conectividad:</strong> El servidor Supabase debe poder conectar con el endpoint de IA</li>
                      <li><strong>Certificados SSL:</strong> Para conexiones seguras HTTPS</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="api-format">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      Formato de API Requerido
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm space-y-3">
                    <p>El endpoint debe aceptar peticiones POST con el siguiente formato:</p>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
{`POST /v1/chat/completions
Authorization: Bearer {API_KEY}
Content-Type: application/json

{
  "model": "bank-gpt-4",
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "..."}
  ],
  "temperature": 0.7,
  "max_tokens": 4096,
  "stream": true
}`}
                    </pre>
                    <p className="mt-4">Respuesta esperada (streaming SSE):</p>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
{`data: {"choices":[{"delta":{"content":"Token..."}}]}
data: {"choices":[{"delta":{"content":" siguiente"}}]}
data: [DONE]`}
                    </pre>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="secret-config">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Configurar API Key en Supabase
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm space-y-3">
                    <ol className="list-decimal pl-6 space-y-2">
                      <li>Acceda a la configuración del proyecto en Lovable</li>
                      <li>Navegue a <strong>Cloud → Secrets</strong></li>
                      <li>Añada un nuevo secreto con el nombre configurado (ej: <code>BANK_AI_API_KEY</code>)</li>
                      <li>Introduzca el valor de la API key proporcionada por su departamento de TI</li>
                      <li>Guarde los cambios y redespliegue las edge functions</li>
                    </ol>
                    <Alert className="mt-4">
                      <Lock className="h-4 w-4" />
                      <AlertDescription>
                        Nunca comparta la API key ni la incluya en el código fuente. 
                        Utilice siempre variables de entorno/secretos.
                      </AlertDescription>
                    </Alert>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="edge-function">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Modificar Edge Function
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm space-y-3">
                    <p>La edge function <code>internal-assistant-chat</code> debe modificarse para usar la IA interna:</p>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
{`// En supabase/functions/internal-assistant-chat/index.ts

// Obtener configuración
const aiConfig = await getAIConfig();

// Determinar endpoint y key
const endpoint = aiConfig.enabled 
  ? aiConfig.endpoint 
  : "https://ai.gateway.lovable.dev/v1/chat/completions";

const apiKey = aiConfig.enabled
  ? Deno.env.get(aiConfig.apiKeyName)
  : Deno.env.get("LOVABLE_API_KEY");

// Realizar petición
const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${apiKey}\`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: aiConfig.modelName || "google/gemini-2.5-flash",
    messages: [...],
    stream: true
  })
});`}
                    </pre>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="security-recommendations">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Recomendaciones de Seguridad
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm space-y-3">
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Autenticación mTLS:</strong> Implemente certificados mutuos entre Supabase y el servidor de IA</li>
                      <li><strong>VPN/Red privada:</strong> El servidor de IA debe estar en una red privada no expuesta a internet</li>
                      <li><strong>Rotación de claves:</strong> Rote las API keys periódicamente (recomendado: cada 90 días)</li>
                      <li><strong>Logs inmutables:</strong> Configure logs de auditoría write-once para cumplimiento</li>
                      <li><strong>DLP:</strong> Implemente Data Loss Prevention para evitar fugas de datos sensibles</li>
                      <li><strong>Rate limiting:</strong> Configure límites de peticiones por usuario y globales</li>
                      <li><strong>Monitorización:</strong> Implemente alertas para patrones de uso anómalos</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="compliance">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Cumplimiento Normativo
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm space-y-3">
                    <p>La integración de IA debe cumplir con:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>RGPD (UE 2016/679):</strong> Protección de datos personales procesados por la IA</li>
                      <li><strong>APDA (Llei 29/2021):</strong> Ley andorrana de protección de datos</li>
                      <li><strong>AI Act (UE):</strong> Regulación europea de inteligencia artificial</li>
                      <li><strong>DORA:</strong> Resiliencia operativa digital para servicios financieros</li>
                      <li><strong>EBA Guidelines:</strong> Directrices de la Autoridad Bancaria Europea sobre IA</li>
                      <li><strong>ISO 27001:</strong> Seguridad de la información</li>
                    </ul>
                    <Alert className="mt-4">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Consulte con el departamento de Cumplimiento antes de activar la IA interna 
                        para asegurar que todas las políticas están implementadas.
                      </AlertDescription>
                    </Alert>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="troubleshooting">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Resolución de Problemas
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm space-y-3">
                    <div className="space-y-4">
                      <div>
                        <p className="font-medium">Error: Connection refused</p>
                        <p className="text-muted-foreground">Verifique que el endpoint es accesible desde Supabase Edge Functions. Compruebe firewalls y reglas de red.</p>
                      </div>
                      <div>
                        <p className="font-medium">Error: 401 Unauthorized</p>
                        <p className="text-muted-foreground">La API key es incorrecta o ha expirado. Verifique el secreto en Supabase y contacte con TI.</p>
                      </div>
                      <div>
                        <p className="font-medium">Error: Timeout</p>
                        <p className="text-muted-foreground">Aumente el timeout configurado o verifique la latencia de red con el servidor de IA.</p>
                      </div>
                      <div>
                        <p className="font-medium">Error: Invalid response format</p>
                        <p className="text-muted-foreground">El servidor de IA debe responder en formato compatible con OpenAI. Contacte con el equipo de infraestructura.</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
