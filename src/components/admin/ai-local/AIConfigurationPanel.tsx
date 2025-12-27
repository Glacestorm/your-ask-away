/**
 * Panel de Configuración de IA Local
 * 
 * Permite configurar la conexión a Ollama local o remoto,
 * seleccionar modelos y gestionar el fallback a Lovable AI.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Server,
  Wifi,
  WifiOff,
  RefreshCw,
  Settings,
  Cpu,
  HardDrive,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Cloud,
  Download,
  Terminal,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { useLocalAI, type LocalAIConfig, type AIModel } from '@/hooks/admin/useLocalAI';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AIConfigurationPanelProps {
  className?: string;
}

export function AIConfigurationPanel({ className }: AIConfigurationPanelProps) {
  const {
    config,
    saveConfig,
    connectionStatus,
    testConnection,
    listModels,
  } = useLocalAI();

  const [localConfig, setLocalConfig] = useState<LocalAIConfig>(config);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [activeTab, setActiveTab] = useState('connection');

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    const status = await testConnection();
    setIsTesting(false);
    
    if (status.connected) {
      toast.success('Conexión exitosa con Ollama local');
    } else if (status.source === 'fallback') {
      toast.info('Ollama no disponible. Fallback a Lovable AI activo.');
    } else {
      toast.error('No se pudo conectar a ningún servicio de IA');
    }
  };

  const handleLoadModels = async () => {
    setIsLoadingModels(true);
    await listModels();
    setIsLoadingModels(false);
  };

  const handleSaveConfig = () => {
    saveConfig(localConfig);
    toast.success('Configuración guardada');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const getStatusColor = () => {
    if (connectionStatus.connected) return 'text-green-500';
    if (connectionStatus.source === 'fallback') return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusIcon = () => {
    if (connectionStatus.connected) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (connectionStatus.source === 'fallback') return <Cloud className="h-5 w-5 text-yellow-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Cpu className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Configuración IA Local</CardTitle>
              <CardDescription>Gestiona la conexión a Ollama y modelos de IA</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge variant={connectionStatus.connected ? 'default' : 'secondary'}>
              {connectionStatus.connected ? 'Conectado' : 
               connectionStatus.source === 'fallback' ? 'Fallback' : 'Desconectado'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="connection" className="text-xs">
              <Wifi className="h-3.5 w-3.5 mr-1.5" />
              Conexión
            </TabsTrigger>
            <TabsTrigger value="models" className="text-xs">
              <HardDrive className="h-3.5 w-3.5 mr-1.5" />
              Modelos
            </TabsTrigger>
            <TabsTrigger value="install" className="text-xs">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Instalación
            </TabsTrigger>
          </TabsList>

          {/* Connection Tab */}
          <TabsContent value="connection" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ollamaUrl">URL del Servidor Ollama</Label>
                <div className="flex gap-2">
                  <Input
                    id="ollamaUrl"
                    value={localConfig.ollamaUrl}
                    onChange={(e) => setLocalConfig(prev => ({ ...prev, ollamaUrl: e.target.value }))}
                    placeholder="http://localhost:11434"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                  >
                    <RefreshCw className={cn("h-4 w-4", isTesting && "animate-spin")} />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Puerto por defecto: 11434. Usa localhost para instalación local.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultModel">Modelo Predeterminado</Label>
                <Select
                  value={localConfig.defaultModel}
                  onValueChange={(value) => setLocalConfig(prev => ({ ...prev, defaultModel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="llama3.2">Llama 3.2 (8B)</SelectItem>
                    <SelectItem value="llama3.1">Llama 3.1 (8B)</SelectItem>
                    <SelectItem value="phi3:mini">Phi-3 Mini (3.8B)</SelectItem>
                    <SelectItem value="mistral">Mistral (7B)</SelectItem>
                    <SelectItem value="codellama">Code Llama (7B)</SelectItem>
                    <SelectItem value="gemma2">Gemma 2 (9B)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Fallback a Lovable AI</Label>
                  <p className="text-xs text-muted-foreground">
                    Usar Lovable AI si Ollama no está disponible
                  </p>
                </div>
                <Switch
                  checked={localConfig.enableFallback}
                  onCheckedChange={(checked) => setLocalConfig(prev => ({ ...prev, enableFallback: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (ms)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={localConfig.timeout}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) || 60000 }))}
                />
              </div>

              <Button onClick={handleSaveConfig} className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Guardar Configuración
              </Button>
            </div>

            {/* Connection Status Card */}
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Estado:</span>
                    <span className={getStatusColor()}>
                      {connectionStatus.connected ? 'Conectado a Ollama' :
                       connectionStatus.source === 'fallback' ? 'Usando Lovable AI' : 'Sin conexión'}
                    </span>
                  </div>
                  {connectionStatus.lastChecked && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Última verificación:</span>
                      <span>{connectionStatus.lastChecked.toLocaleTimeString()}</span>
                    </div>
                  )}
                  {connectionStatus.error && (
                    <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                      <span className="text-xs text-destructive">{connectionStatus.error}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Models Tab */}
          <TabsContent value="models" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Modelos Disponibles</Label>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLoadModels}
                disabled={isLoadingModels}
              >
                <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isLoadingModels && "animate-spin")} />
                Actualizar
              </Button>
            </div>

            <ScrollArea className="h-[250px]">
              <div className="space-y-2">
                {connectionStatus.models.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <HardDrive className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay modelos disponibles</p>
                    <p className="text-xs mt-1">Instala modelos con: ollama pull llama3.2</p>
                  </div>
                ) : (
                  connectionStatus.models.map((model: AIModel, index: number) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Cpu className="h-4 w-4 text-primary" />
                          <div>
                            <p className="font-medium text-sm">{model.name}</p>
                            {model.size && (
                              <p className="text-xs text-muted-foreground">
                                {typeof model.size === 'number' 
                                  ? `${(model.size / 1e9).toFixed(1)} GB`
                                  : model.size}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant={model.source === 'lovable' ? 'secondary' : 'outline'}>
                          {model.source === 'lovable' ? 'Cloud' : 'Local'}
                        </Badge>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>

            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <h4 className="font-medium text-sm mb-2">Modelos Recomendados</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>phi3:mini</span>
                    <span className="text-muted-foreground">4GB RAM - Rápido</span>
                  </div>
                  <div className="flex justify-between">
                    <span>llama3.2</span>
                    <span className="text-muted-foreground">8GB RAM - Equilibrado</span>
                  </div>
                  <div className="flex justify-between">
                    <span>llama3.1:70b-q4</span>
                    <span className="text-muted-foreground">48GB RAM - Potente</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Installation Tab */}
          <TabsContent value="install" className="space-y-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {/* Windows */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      Windows
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">PowerShell (Admin)</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => copyToClipboard('winget install Ollama.Ollama')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <code className="text-xs">winget install Ollama.Ollama</code>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      O descarga desde: 
                      <a href="https://ollama.com/download" target="_blank" rel="noopener noreferrer" className="text-primary ml-1 inline-flex items-center">
                        ollama.com/download <ExternalLink className="h-3 w-3 ml-0.5" />
                      </a>
                    </p>
                  </CardContent>
                </Card>

                {/* macOS */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Terminal className="h-4 w-4" />
                      macOS
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Terminal</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => copyToClipboard('brew install ollama')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <code className="text-xs">brew install ollama</code>
                    </div>
                  </CardContent>
                </Card>

                {/* Linux */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Terminal className="h-4 w-4" />
                      Linux
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Terminal</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => copyToClipboard('curl -fsSL https://ollama.com/install.sh | sh')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <code className="text-xs break-all">curl -fsSL https://ollama.com/install.sh | sh</code>
                    </div>
                  </CardContent>
                </Card>

                {/* Docker */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      Docker
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Docker</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => copyToClipboard('docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <code className="text-xs break-all">docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama</code>
                    </div>
                  </CardContent>
                </Card>

                {/* Pull Model */}
                <Card className="border-primary/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Download className="h-4 w-4 text-primary" />
                      Descargar Modelo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Después de instalar</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => copyToClipboard('ollama pull llama3.2')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <code className="text-xs">ollama pull llama3.2</code>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Este comando descarga el modelo Llama 3.2 (~4.7GB)
                    </p>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default AIConfigurationPanel;
