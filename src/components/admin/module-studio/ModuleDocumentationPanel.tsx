/**
 * ModuleDocumentationPanel - Documentation Generator para módulos
 * Generación automática de docs, API reference, ejemplos
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  RefreshCw, 
  Sparkles,
  Maximize2,
  Minimize2,
  Book,
  Code,
  Copy,
  Check,
  Download,
  FileCode
} from 'lucide-react';
import { useModuleDocumentationGenerator } from '@/hooks/admin/useModuleDocumentationGenerator';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface ModuleDocContext {
  moduleKey: string;
  moduleName?: string;
}

interface ModuleDocumentationPanelProps {
  context: ModuleDocContext | null;
  className?: string;
}

export function ModuleDocumentationPanel({ context, className }: ModuleDocumentationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('pages');
  const [copied, setCopied] = useState(false);

  const {
    isLoading,
    pages,
    apiReferences,
    examples,
    activeJob,
    stats,
    generateDocumentation,
    getDocumentation,
    exportDocumentation,
  } = useModuleDocumentationGenerator();

  const handleGenerateAll = useCallback(async () => {
    if (context?.moduleKey) {
      await generateDocumentation(context.moduleKey, {
        includeApi: true,
        includeExamples: true,
        includeChangelog: true,
      });
    }
  }, [context?.moduleKey, generateDocumentation]);

  const handleCopy = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleDownload = useCallback(async () => {
    if (context?.moduleKey) {
      const url = await exportDocumentation(context.moduleKey, 'markdown');
      if (url) {
        window.open(url, '_blank');
      }
    }
  }, [context?.moduleKey, exportDocumentation]);

  if (!context) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Selecciona un módulo para generar docs</p>
        </CardContent>
      </Card>
    );
  }

  const hasPages = pages && pages.length > 0;
  const hasApiRefs = apiReferences && apiReferences.length > 0;
  const hasExamples = examples && examples.length > 0;

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Documentation Generator</CardTitle>
              <p className="text-xs text-muted-foreground">
                {stats?.last_generated 
                  ? `Generado ${formatDistanceToNow(new Date(stats.last_generated), { locale: es, addSuffix: true })}`
                  : 'Sin generar aún'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleGenerateAll}
              disabled={isLoading}
              className="h-8 w-8"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-3", isExpanded ? "h-[calc(100%-80px)]" : "")}>
        {/* Quick Stats */}
        <div className="flex gap-2 mb-3">
          <Badge variant={hasPages ? 'default' : 'outline'} className="text-xs">
            <Book className="h-3 w-3 mr-1" />
            {pages?.length || 0} Pages
          </Badge>
          <Badge variant={hasApiRefs ? 'default' : 'outline'} className="text-xs">
            <Code className="h-3 w-3 mr-1" />
            {apiReferences?.length || 0} API
          </Badge>
          <Badge variant={hasExamples ? 'default' : 'outline'} className="text-xs">
            <FileCode className="h-3 w-3 mr-1" />
            {examples?.length || 0} Examples
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="pages" className="text-xs">Páginas</TabsTrigger>
            <TabsTrigger value="api" className="text-xs">API Ref</TabsTrigger>
            <TabsTrigger value="examples" className="text-xs">Ejemplos</TabsTrigger>
          </TabsList>

          <TabsContent value="pages" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-350px)]" : "h-[200px]"}>
              {hasPages ? (
                <div className="space-y-2">
                  {pages.map((page) => (
                    <div key={page.id} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{page.title}</span>
                        <Badge variant="outline" className="text-xs">{page.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {page.content?.slice(0, 100)}...
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Book className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Genera documentación con IA</p>
                  <Button 
                    size="sm" 
                    className="mt-3"
                    onClick={handleGenerateAll}
                    disabled={isLoading}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generar Docs
                  </Button>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="api" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-350px)]" : "h-[200px]"}>
              {hasApiRefs ? (
                <div className="space-y-2">
                  {apiReferences.map((api) => (
                    <div key={api.id} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium font-mono">{api.name}</span>
                        <Badge variant="secondary" className="text-xs">{api.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{api.description}</p>
                      {api.signature && (
                        <pre className="mt-2 text-xs p-2 bg-muted/50 rounded font-mono overflow-x-auto">
                          {api.signature}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>API Reference no generada</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="examples" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-350px)]" : "h-[200px]"}>
              {hasExamples ? (
                <div className="space-y-3">
                  {examples.map((example) => (
                    <div key={example.id} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{example.title}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => handleCopy(example.code)}
                        >
                          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                      <pre className="text-xs p-2 bg-muted/50 rounded font-mono overflow-x-auto">
                        {example.code}
                      </pre>
                      {example.description && (
                        <p className="text-xs text-muted-foreground mt-2">{example.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <FileCode className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Ejemplos no generados</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ModuleDocumentationPanel;
