/**
 * Guía de Instalación de IA Local
 * 
 * Documentación interactiva paso a paso para instalar Ollama
 * en diferentes sistemas operativos.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Monitor,
  Apple,
  Terminal,
  Server,
  Download,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  HardDrive,
  Cpu,
  MemoryStick,
  Zap,
  BookOpen,
  Play,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  title: string;
  description: string;
  command?: string;
  note?: string;
  completed?: boolean;
}

interface InstallationGuideProps {
  className?: string;
}

export function AIInstallationGuide({ className }: InstallationGuideProps) {
  const [activeOS, setActiveOS] = useState('windows');
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Comando copiado al portapapeles');
  };

  const toggleStep = (stepId: string) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const windowsSteps: Step[] = [
    {
      id: 'win-1',
      title: 'Verificar Requisitos del Sistema',
      description: 'Windows 10/11 64-bit, mínimo 8GB RAM (16GB recomendado), 20GB espacio libre',
    },
    {
      id: 'win-2',
      title: 'Instalar con Winget (Recomendado)',
      description: 'Abre PowerShell como Administrador y ejecuta:',
      command: 'winget install Ollama.Ollama',
    },
    {
      id: 'win-2b',
      title: 'Alternativa: Descargar Instalador',
      description: 'Descarga el instalador desde la web oficial:',
      note: 'https://ollama.com/download/windows',
    },
    {
      id: 'win-3',
      title: 'Verificar Instalación',
      description: 'Abre una nueva terminal y verifica:',
      command: 'ollama --version',
    },
    {
      id: 'win-4',
      title: 'Descargar Modelo Recomendado',
      description: 'Descarga Llama 3.2 (~4.7GB):',
      command: 'ollama pull llama3.2',
    },
    {
      id: 'win-5',
      title: 'Probar el Modelo',
      description: 'Ejecuta una prueba rápida:',
      command: 'ollama run llama3.2 "Hola, ¿cómo estás?"',
    },
    {
      id: 'win-6',
      title: 'Iniciar Servicio',
      description: 'El servicio se inicia automáticamente. Si necesitas iniciarlo manualmente:',
      command: 'ollama serve',
    },
  ];

  const macSteps: Step[] = [
    {
      id: 'mac-1',
      title: 'Verificar Requisitos del Sistema',
      description: 'macOS 11 Big Sur o posterior, mínimo 8GB RAM (16GB recomendado para modelos grandes)',
    },
    {
      id: 'mac-2',
      title: 'Instalar con Homebrew (Recomendado)',
      description: 'Si tienes Homebrew instalado, ejecuta:',
      command: 'brew install ollama',
    },
    {
      id: 'mac-2b',
      title: 'Alternativa: Descargar App',
      description: 'Descarga la aplicación desde:',
      note: 'https://ollama.com/download/mac',
    },
    {
      id: 'mac-3',
      title: 'Verificar Instalación',
      description: 'Abre Terminal y verifica:',
      command: 'ollama --version',
    },
    {
      id: 'mac-4',
      title: 'Descargar Modelo Recomendado',
      description: 'Descarga Llama 3.2:',
      command: 'ollama pull llama3.2',
    },
    {
      id: 'mac-5',
      title: 'Probar el Modelo',
      description: 'Ejecuta una prueba rápida:',
      command: 'ollama run llama3.2 "Hola, ¿cómo estás?"',
    },
    {
      id: 'mac-6',
      title: 'Iniciar Servicio',
      description: 'Para iniciar el servidor manualmente:',
      command: 'ollama serve',
    },
  ];

  const linuxSteps: Step[] = [
    {
      id: 'linux-1',
      title: 'Verificar Requisitos del Sistema',
      description: 'Linux x86_64, mínimo 8GB RAM, kernel 4.x o superior',
    },
    {
      id: 'linux-2',
      title: 'Instalación Automática (Recomendado)',
      description: 'Ejecuta el script de instalación oficial:',
      command: 'curl -fsSL https://ollama.com/install.sh | sh',
    },
    {
      id: 'linux-3',
      title: 'Verificar Instalación',
      description: 'Verifica que se instaló correctamente:',
      command: 'ollama --version',
    },
    {
      id: 'linux-4',
      title: 'Habilitar Servicio Systemd',
      description: 'Configura el servicio para inicio automático:',
      command: 'sudo systemctl enable ollama && sudo systemctl start ollama',
    },
    {
      id: 'linux-5',
      title: 'Descargar Modelo Recomendado',
      description: 'Descarga Llama 3.2:',
      command: 'ollama pull llama3.2',
    },
    {
      id: 'linux-6',
      title: 'Probar el Modelo',
      description: 'Ejecuta una prueba:',
      command: 'ollama run llama3.2 "Hola, ¿cómo estás?"',
    },
  ];

  const dockerSteps: Step[] = [
    {
      id: 'docker-1',
      title: 'Verificar Docker Instalado',
      description: 'Asegúrate de tener Docker instalado y funcionando:',
      command: 'docker --version',
    },
    {
      id: 'docker-2',
      title: 'Ejecutar Contenedor Ollama',
      description: 'Inicia el contenedor con persistencia de datos:',
      command: 'docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama',
    },
    {
      id: 'docker-3',
      title: 'Descargar Modelo',
      description: 'Descarga un modelo dentro del contenedor:',
      command: 'docker exec -it ollama ollama pull llama3.2',
    },
    {
      id: 'docker-4',
      title: 'Probar Conexión',
      description: 'Verifica que el servicio responde:',
      command: 'curl http://localhost:11434/api/tags',
    },
    {
      id: 'docker-5',
      title: 'Docker Compose (Opcional)',
      description: 'Crea un archivo docker-compose.yml para gestión fácil',
      note: 'Ver ejemplo en la sección de Docker Compose',
    },
  ];

  const getSteps = () => {
    switch (activeOS) {
      case 'windows': return windowsSteps;
      case 'mac': return macSteps;
      case 'linux': return linuxSteps;
      case 'docker': return dockerSteps;
      default: return windowsSteps;
    }
  };

  const steps = getSteps();
  const progress = (completedSteps.size / steps.length) * 100;

  const renderStep = (step: Step, index: number) => (
    <div 
      key={step.id}
      className={cn(
        "p-4 rounded-lg border transition-colors",
        completedSteps.has(step.id) ? "bg-green-500/10 border-green-500/30" : "bg-card"
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={completedSteps.has(step.id)}
          onCheckedChange={() => toggleStep(step.id)}
          className="mt-1"
        />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Paso {index + 1}
            </Badge>
            <h4 className="font-medium text-sm">{step.title}</h4>
          </div>
          <p className="text-sm text-muted-foreground">{step.description}</p>
          
          {step.command && (
            <div className="flex items-center gap-2 bg-muted rounded-lg p-3 mt-2">
              <code className="text-xs flex-1 break-all">{step.command}</code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => copyToClipboard(step.command!)}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          
          {step.note && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{step.note}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Guía de Instalación de IA Local</CardTitle>
              <CardDescription>
                Instala Ollama en tu sistema para ejecutar IA 100% local
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Progreso de instalación</span>
              <span className="font-medium">{completedSteps.size}/{steps.length} pasos</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Requirements */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Requisitos del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <MemoryStick className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">RAM</p>
                <p className="text-xs text-muted-foreground">8GB mínimo</p>
                <p className="text-xs text-muted-foreground">16GB+ recomendado</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <HardDrive className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Almacenamiento</p>
                <p className="text-xs text-muted-foreground">20GB libre mínimo</p>
                <p className="text-xs text-muted-foreground">SSD recomendado</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Zap className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">GPU (Opcional)</p>
                <p className="text-xs text-muted-foreground">NVIDIA con CUDA</p>
                <p className="text-xs text-muted-foreground">Apple Silicon (M1/M2/M3)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installation Steps */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pasos de Instalación</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeOS} onValueChange={setActiveOS}>
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="windows" className="gap-1.5 text-xs">
                <Monitor className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Windows</span>
              </TabsTrigger>
              <TabsTrigger value="mac" className="gap-1.5 text-xs">
                <Apple className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">macOS</span>
              </TabsTrigger>
              <TabsTrigger value="linux" className="gap-1.5 text-xs">
                <Terminal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Linux</span>
              </TabsTrigger>
              <TabsTrigger value="docker" className="gap-1.5 text-xs">
                <Server className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Docker</span>
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {steps.map((step, index) => renderStep(step, index))}
              </div>
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>

      {/* Models Reference */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Modelos Recomendados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-4 p-2 bg-muted/50 rounded-lg text-xs font-medium">
              <span>Modelo</span>
              <span>Tamaño</span>
              <span>RAM Requerida</span>
              <span>Uso Recomendado</span>
            </div>
            {[
              { name: 'phi3:mini', size: '2.3GB', ram: '4GB', use: 'Tareas rápidas, pruebas' },
              { name: 'llama3.2', size: '4.7GB', ram: '8GB', use: 'Uso general, chat' },
              { name: 'mistral', size: '4.1GB', ram: '8GB', use: 'Razonamiento, análisis' },
              { name: 'codellama', size: '3.8GB', ram: '8GB', use: 'Programación, código' },
              { name: 'llama3.1:70b-q4', size: '40GB', ram: '48GB', use: 'Máxima calidad' },
            ].map((model, index) => (
              <div key={index} className="grid grid-cols-4 gap-4 p-2 rounded-lg border text-xs items-center">
                <div className="flex items-center gap-2">
                  <code className="font-medium">{model.name}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => copyToClipboard(`ollama pull ${model.name}`)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <span className="text-muted-foreground">{model.size}</span>
                <span className="text-muted-foreground">{model.ram}</span>
                <span className="text-muted-foreground">{model.use}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Solución de Problemas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-sm">
                Ollama no responde en el puerto 11434
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-2">
                <p>1. Verifica que el servicio esté corriendo: <code>ollama serve</code></p>
                <p>2. Comprueba si el puerto está ocupado: <code>netstat -an | grep 11434</code></p>
                <p>3. Reinicia el servicio de Ollama</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-sm">
                Error "out of memory" al cargar modelos
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-2">
                <p>1. Usa un modelo más pequeño como <code>phi3:mini</code></p>
                <p>2. Cierra aplicaciones que consuman memoria</p>
                <p>3. Considera actualizar la RAM de tu sistema</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-sm">
                Respuestas muy lentas
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-2">
                <p>1. Usa modelos cuantizados (q4) para menor uso de recursos</p>
                <p>2. Si tienes GPU NVIDIA, verifica que CUDA esté instalado</p>
                <p>3. En Mac, los chips Apple Silicon ofrecen mejor rendimiento</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* External Links */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" asChild>
              <a href="https://ollama.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Sitio Oficial
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://ollama.com/library" target="_blank" rel="noopener noreferrer">
                <HardDrive className="h-3.5 w-3.5 mr-1.5" />
                Biblioteca de Modelos
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://github.com/ollama/ollama" target="_blank" rel="noopener noreferrer">
                <Terminal className="h-3.5 w-3.5 mr-1.5" />
                GitHub
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AIInstallationGuide;
